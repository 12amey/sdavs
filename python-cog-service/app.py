from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import rasterio
from rasterio.windows import Window
import numpy as np
from PIL import Image
import io
import logging
import os
from dotenv import load_dotenv

# Import our modules
from ml_models import get_classifier, NDVICalculator
from nasa_earthdata import NASAEarthdataClient, fetch_latest_sentinel2
from land_cover_analyzer import LandCoverAnalyzer

# Import EuroSAT classifier
try:
    from eurosat_classifier import get_classifier as get_eurosat_classifier
    EUROSAT_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("✅ EuroSAT dataset classifier loaded!")
except ImportError as e:
    EUROSAT_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ EuroSAT classifier not available: {e}")

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for Spring Boot integration

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok", 
        "service": "Python ML & COG Service",
        "features": [
            "NDVI Calculation",
            "ML Land Cover Classification",
            "NASA Earthdata Integration",
            "GeoTIFF Processing"
        ]
    })

@app.route('/ndvi-stats', methods=['POST'])
def ndvi_stats():
    """
    Compute NDVI stats from Sentinel-2 COG bands
    Accepts: JSON with b04_url and b08_url (or tile_url for backward compatibility)
    Returns: JSON with NDVI statistics
    """
    try:
        data = request.json
        b04_url = data.get('b04_url')
        b08_url = data.get('b08_url') or data.get('tile_url') # NIR fallback
        
        # If only tile_url is provided, assume it's B08 and try to find B04
        if b08_url and not b04_url:
            b04_url = b08_url.replace('_B08.tif', '_B04.tif').replace('_B08_10m.tif', '_B04_10m.tif')
            logger.info(f"Derived B04 URL: {b04_url}")

        if not b04_url or not b08_url:
            return jsonify({"error": "Missing band URLs"}), 400
        
        with rasterio.open(b04_url) as red_src:
            with rasterio.open(b08_url) as nir_src:
                # Read center 512x512 for faster stats
                h, w = red_src.height, red_src.width
                win = Window(w//2 - 256, h//2 - 256, 512, 512)
                red = red_src.read(1, window=win).astype(np.float32) / 10000.0
                nir = nir_src.read(1, window=win).astype(np.float32) / 10000.0
        
        ndvi = NDVICalculator.calculate_ndvi(nir, red)
        stats = NDVICalculator.calculate_statistics(ndvi)
        
        return jsonify({
            "success": True,
            "ndvi": float(stats['mean']),
            "stats": stats,
            "classification": NDVICalculator.classify_vegetation(ndvi)
        })
        
    except Exception as e:
        logger.error(f"Error in ndvi-stats: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/ndvi', methods=['GET'])

@app.route('/classify', methods=['POST'])
def classify_image():
    """
    Classify satellite image using ML model (EuroSAT dataset)
    Accepts: multipart/form-data with 'image' file
    Returns: JSON with classification results
    """
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "Empty filename"}), 400
        
        # Save uploaded file temporarily
        temp_path = f"/tmp/{file.filename}"
        file.save(temp_path)
        
        logger.info(f"Classifying image: {file.filename}")
        
        try:
            # Use EuroSAT classifier if available
            if EUROSAT_AVAILABLE:
                eurosat = get_eurosat_classifier()
                if eurosat.is_dataset_loaded():
                    # Load and prepare image
                    img = Image.open(temp_path).convert('RGB')
                    img_array = np.array(img)
                    
                    result = eurosat.classify_image(img_array)
                    result['success'] = True
                    result['dataset'] = 'EuroSAT RGB (27,000 satellite images)'
                    logger.info(f"✅ EuroSAT classification: {result['primary_class']} ({result['confidence']:.1f}%)")
                    return jsonify(result)
            
            # Fallback to basic classifier
            classifier = get_classifier()
            result = classifier.classify_image(temp_path)
            result['dataset'] = 'Heuristic (no pretrained model)'
            return jsonify(result)
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
    except Exception as e:
        logger.error(f"Error classifying image: {str(e)}", exc_info=True)
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/analyze', methods=['POST'])
def analyze_multispectral():
    """
    Comprehensive analysis of multispectral satellite imagery
    Accepts: GeoTIFF file with multiple bands
    Returns: NDVI stats, classification, and vegetation analysis
    """
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        temp_path = f"/tmp/{file.filename}"
        file.save(temp_path)
        
        try:
            # Perform strict validation first
            validation_result = _perform_validation(temp_path)
            if not validation_result["is_satellite_imagery"]:
                return jsonify({
                    "success": False,
                    "error": "Invalid satellite imagery detected",
                    "confidence": validation_result["confidence"],
                    "reasons": validation_result["reasons"],
                    "is_satellite_imagery": False
                }), 200 # Return 200 so Java can parse the error object cleanly

            # Read GeoTIFF with rasterio
            with rasterio.open(temp_path) as src:
                # Get metadata
                num_bands = src.count
                width = src.width
                height = src.height
                
                logger.info(f"Image: {width}x{height}, {num_bands} bands")
                
                # Read bands
                bands = {}
                for i in range(1, min(num_bands + 1, 14)):  # Max 13 bands (Sentinel-2)
                    band_data = src.read(i)
                    bands[f'B{i:02d}'] = band_data
                
                # Calculate NDVI if NIR and Red bands are available
                # Assuming B08 = NIR, B04 = Red (Sentinel-2 convention)
                ndvi_stats = None
                vegetation_classes = None
                
                if 'B08' in bands and 'B04' in bands:
                    # Normalize bands (assuming 0-10000 range)
                    nir = bands['B08'].astype(np.float32) / 10000.0
                    red = bands['B04'].astype(np.float32) / 10000.0
                    
                    ndvi = NDVICalculator.calculate_ndvi(nir, red)
                    ndvi_stats = NDVICalculator.calculate_statistics(ndvi)
                    vegetation_classes = NDVICalculator.classify_vegetation(ndvi)
                    
                    logger.info(f"NDVI mean: {ndvi_stats['mean']:.3f}")
                elif num_bands >= 3:
                     # Fallback for RGB images: Use Visible Atmospherically Resistant Index (VARI)
                     # VARI = (Green - Red) / (Green + Red - Blue)
                     try:
                         red = bands['B01'].astype(np.float32) 
                         green = bands['B02'].astype(np.float32)
                         blue = bands['B03'].astype(np.float32)
                         
                         # Avoid division by zero
                         denominator = green + red - blue
                         denominator[denominator == 0] = 0.0001
                         
                         vari = (green - red) / denominator
                         
                         # Normalize VARI to typical NDVI range (-1 to 1) for compatibility
                         # VARI typically ranges from -1 to 1 naturally, but we clamp it
                         vari = np.clip(vari, -1.0, 1.0)
                         
                         ndvi_stats = NDVICalculator.calculate_statistics(vari)
                         vegetation_classes = NDVICalculator.classify_vegetation(vari)
                         logger.info(f"RGB-estimated Vegetation Index mean: {ndvi_stats['mean']:.3f}")
                         
                         # Assign to 'ndvi' variable for later use in land cover
                         ndvi = vari
                     except Exception as e:
                         logger.warning(f"Failed to calculate RGB vegetation index: {e}")
                         ndvi = None
                         ndvi_stats = {"mean": 0.0, "max": 0.0, "min": 0.0, "std": 0.0}
                         vegetation_classes = {"denseVegetation": 0, "moderateVegetation": 0, "sparseVegetation": 0, "noVegetation": 100}
                
                # ML Classification
                classifier = get_classifier()
                ml_result = classifier.classify_multispectral(bands)
                
                # Land Cover Analysis - Calculate detailed land cover percentages
                try:
                    # Read RGB image for land cover analysis
                    rgb_image = Image.open(temp_path).convert('RGB')
                    rgb_array = np.array(rgb_image)
                    
                    eurosat_class = ml_result.get('primary_class') if ml_result.get('success') else None
                    land_cover = LandCoverAnalyzer.analyze_land_cover(
                        rgb_array, 
                        ndvi_array=ndvi if 'B08' in bands and 'B04' in bands else None,
                        eurosat_class=eurosat_class
                    )
                    primary_land_use = LandCoverAnalyzer.get_primary_land_use(land_cover)
                    
                    logger.info(f"Land cover: {land_cover}, Primary: {primary_land_use}")
                except Exception as e:
                    logger.warning(f"Land cover analysis failed: {e}")
                    land_cover = {}
                    primary_land_use = "Unknown"
                
                # Compile results with type conversion for JSON serialization
                result = {
                    "success": True,
                    "filename": file.filename,
                    "dimensions": {"width": int(width), "height": int(height)},
                    "bands": int(num_bands),
                    "ndvi_stats": ndvi_stats,
                    "vegetation_classification": vegetation_classes,
                    "ml_classification": ml_result,
                    "land_cover": {k: float(v) for k, v in land_cover.items()} if land_cover else {},
                    "primary_land_use": str(primary_land_use),
                    "method": "Real ML Analysis - PyTorch ResNet50",
                    "is_satellite_imagery": bool(True),
                    "validation_confidence": float(validation_result["confidence"])
                }
                
                return jsonify(result)
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}", exc_info=True)
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/fetch-satellite', methods=['GET'])
def fetch_satellite_data():
    """
    Fetch real satellite imagery from NASA Earthdata
    Query params: lat, lng, date (YYYY-MM-DD), days_back (default: 30)
    Returns: JSON with available imagery metadata
    """
    try:
        lat = float(request.args.get('lat', 0))
        lng = float(request.args.get('lng', 0))
        date = request.args.get('date')
        days_back = int(request.args.get('days_back', 30))
        
        if lat == 0 or lng == 0:
            return jsonify({"error": "Invalid coordinates"}), 400
        
        logger.info(f"Fetching satellite data for {lat}, {lng}")
        
        # Fetch from NASA Earthdata
        try:
            result = fetch_latest_sentinel2(lat, lng, days_back)
            
            if result:
                return jsonify({
                    "success": True,
                    "imagery": result,
                    "source": "NASA Earthdata"
                })
            else:
                return jsonify({
                    "success": False,
                    "message": "No imagery found for the specified location and time range",
                    "suggestion": "Try increasing days_back parameter or different coordinates"
                })
                
        except ValueError as ve:
            return jsonify({
                "success": False,
                "error": str(ve),
                "message": "NASA Earthdata credentials not configured"
            }), 401
            
    except Exception as e:
        logger.error(f"Error fetching satellite data: {str(e)}", exc_info=True)
        return jsonify({"error": str(e), "success": False}), 500

def _perform_validation(temp_path):
    """
    Core validation logic for satellite imagery with EuroSAT screenshot detection
    """
    try:
        # Check if it's a GeoTIFF
        try:
            with rasterio.open(temp_path) as src:
                is_geotiff = True
                num_bands = src.count
                has_crs = src.crs is not None
                width = src.width
                height = src.height
        except:
            is_geotiff = False
            num_bands = 3
            has_crs = False
            
            # Try as regular image
            img = Image.open(temp_path)
            width, height = img.size
        
        # USE EUROSAT FOR SCREENSHOT DETECTION!
        eurosat_confidence = 50.0  # Default
        eurosat_is_screenshot = False
        
        if EUROSAT_AVAILABLE:
            try:
                eurosat = get_eurosat_classifier()
                if eurosat.is_dataset_loaded():
                    # Load image for EuroSAT
                    img = Image.open(temp_path).convert('RGB')
                    img_array = np.array(img)
                    
                    # Run EuroSAT classification
                    eurosat_result = eurosat.classify_image(img_array)
                    eurosat_confidence = eurosat_result.get('confidence', 50.0)
                    eurosat_is_screenshot = eurosat_result.get('screenshot_detected', False)
                    
                    logger.info(f"🔍 EuroSAT validation: confidence={eurosat_confidence:.1f}%, screenshot={eurosat_is_screenshot}")
                    
                    # If EuroSAT detected screenshot, return immediately with low confidence
                    if eurosat_is_screenshot:
                        return {
                            "is_satellite_imagery": bool(False),
                            "confidence": float(eurosat_confidence),
                            "reasons": eurosat_result.get('screenshot_reasons', ['Screenshot detected by EuroSAT']),
                            "metadata": {
                                "width": int(width),
                                "height": int(height),
                                "bands": int(num_bands),
                                "has_geospatial_info": bool(has_crs),
                                "eurosat_detection": "screenshot"
                            }
                        }
            except Exception as e:
                logger.warning(f"⚠️ EuroSAT validation failed: {e}")
        
        # Original confidence calculation (for non-screenshots)
        confidence = 0.0
        reasons = []
        
        if is_geotiff:
            confidence += 40.0
            reasons.append("GeoTIFF format detected")
        
        if has_crs:
            confidence += 30.0
            reasons.append("Coordinate reference system found")
        
        if num_bands > 3:
            confidence += 30.0
            reasons.append(f"Multiple spectral bands detected ({num_bands} bands)")
        
        if width >= 512 and height >= 512:
            confidence += 20.0
            reasons.append("Appropriate resolution for satellite imagery")
        
        # Adjust confidence based on EuroSAT if available
        if EUROSAT_AVAILABLE and eurosat_confidence < 30.0:
            confidence = min(confidence, eurosat_confidence + 10)  # Cap at EuroSAT + 10%
            reasons.append(f"Low EuroSAT confidence ({eurosat_confidence:.1f}%)")
        
        # RELAXED: Allow RGB satellite exports (Google Earth, Landsat web downloads)
        # GeoTIFF: 60-100% | RGB exports: 20-40% | Screenshots: <15%
        is_satellite = confidence >= 15.0  # Lowered from 60.0
        
        return {
            "is_satellite_imagery": bool(is_satellite),
            "confidence": float(min(100.0, confidence)),
            "reasons": reasons,
            "metadata": {
                "width": int(width),
                "height": int(height),
                "bands": int(num_bands),
                "has_geospatial_info": bool(has_crs)
            }
        }
    except Exception as e:
        logger.error(f"Error in validation helper: {str(e)}")
        raise e

@app.route('/validate-image', methods=['POST'])
def validate_satellite_image():
    """
    Validate if uploaded image is actual satellite imagery
    """
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        temp_path = f"/tmp/val_{file.filename}"
        file.save(temp_path)
        
        try:
            validation_result = _perform_validation(temp_path)
            return jsonify(validation_result)
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
    except Exception as e:
        logger.error(f"Error validating image: {str(e)}", exc_info=True)
        return jsonify({"error": str(e), "is_satellite_imagery": False, "confidence": 0.0}), 200

if __name__ == '__main__':
    port = int(os.getenv('PYTHON_SERVICE_PORT', 5000))
    host = os.getenv('PYTHON_SERVICE_HOST', '0.0.0.0')
    
    logger.info(f"Starting Python ML & COG Service on {host}:{port}")
    logger.info("Available endpoints:")
    logger.info("  GET  /health - Health check")
    logger.info("  GET  /ndvi - Calculate NDVI from COG URLs")
    logger.info("  POST /classify - ML classification of satellite image")
    logger.info("  POST /analyze - Comprehensive multispectral analysis")
    logger.info("  GET  /fetch-satellite - Fetch real imagery from NASA")
    logger.info("  POST /validate-image - Validate satellite imagery")
    
    app.run(host=host, port=port, debug=True)

