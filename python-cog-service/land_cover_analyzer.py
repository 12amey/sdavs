"""
Enhanced Land Cover Analysis
Calculates detailed land cover percentages from satellite imagery
"""
import numpy as np
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class LandCoverAnalyzer:
    """Analyze land cover from RGB satellite imagery"""
    
    @staticmethod
    def analyze_land_cover(image_array, ndvi_array=None, eurosat_class=None):
        """
        Comprehensive land cover analysis
        
        Args:
            image_array: RGB image array (H, W, 3) with values 0-255
            ndvi_array: Optional NDVI array for vegetation analysis
            eurosat_class: Optional EuroSAT primary classification
            
        Returns:
            Dictionary with land cover percentages
        """
        height, width = image_array.shape[:2]
        total_pixels = height * width
        
        # Normalize to 0-1
        img_normalized = image_array.astype(np.float32) / 255.0
        
        # Extract color channels
        red = img_normalized[:, :, 0]
        green = img_normalized[:, :, 1]
        blue = img_normalized[:, :, 2]
        
        # Initialize coverage dictionary
        coverage = {
            'forest': 0.0,
            'water': 0.0,
            'urban': 0.0,
            'agricultural': 0.0,
            'barren': 0.0,
            'snow': 0.0,
            'grassland': 0.0,
            'wetland': 0.0
        }
        
        # Calculate indices
        brightness = (red + green + blue) / 3.0
        
        # Water detection (deep blue pixels)
        water_mask = (blue > red + 0.1) & (blue > green + 0.05) & (brightness < 0.6)
        coverage['water'] = (np.sum(water_mask) / total_pixels) * 100
        
        # Snow/Ice detection (very bright pixels with blue tint)
        snow_mask = (brightness > 0.75) & (blue >= red * 0.9) & (blue >= green * 0.9)
        coverage['snow'] = (np.sum(snow_mask) / total_pixels) * 100
        
        # Forest detection (dark green pixels)
        forest_mask = (green > red * 1.1) & (green > blue * 1.1) & (brightness < 0.5) & (green > 0.2)
        coverage['forest'] = (np.sum(forest_mask) / total_pixels) * 100
        
        # Grassland/Pasture (lighter green)
        grassland_mask = (green > red * 1.05) & (green > blue * 1.05) & (brightness >= 0.3) & (brightness < 0.7) & ~forest_mask
        coverage['grassland'] = (np.sum(grassland_mask) / total_pixels) * 100
        
        # Agricultural (patchwork of colors, moderate brightness)
        agricultural_mask = (brightness > 0.25) & (brightness < 0.65) & ~forest_mask & ~grassland_mask & ~water_mask
        coverage['agricultural'] = (np.sum(agricultural_mask) / total_pixels) * 100
        
        # Urban/Built-up (gray pixels - similar RGB values)
        color_variance = np.abs(red - green) + np.abs(green - blue) + np.abs(blue - red)
        urban_mask = (color_variance < 0.15) & (brightness > 0.3) & (brightness < 0.7) & ~snow_mask
        coverage['urban'] = (np.sum(urban_mask) / total_pixels) * 100
        
        # Barren/Desert (bright, brownish pixels)
        barren_mask = (red > green * 1.05) & (red > blue * 1.1) & (brightness > 0.4) & ~snow_mask
        coverage['barren'] = (np.sum(barren_mask) / total_pixels) * 100
        
        # Wetland (dark areas near water)
        wetland_mask = (brightness < 0.3) & ~water_mask & ~forest_mask
        coverage['wetland'] = (np.sum(wetland_mask) / total_pixels) * 100
        
        # Adjust based on EuroSAT classification if available
        if eurosat_class:
            coverage = LandCoverAnalyzer._adjust_with_eurosat(coverage, eurosat_class)
        
        # Use NDVI if available for better vegetation classification
        if ndvi_array is not None:
            coverage = LandCoverAnalyzer._refine_with_ndvi(coverage, ndvi_array)
        
        # Normalize to ensure total is ~100% (allowing for small overlaps)
        total_coverage = sum(coverage.values())
        if total_coverage > 100:
            factor = 100.0 / total_coverage
            coverage = {k: v * factor for k, v in coverage.items()}
        
        # Round to 1 decimal place
        coverage = {k: round(v, 1) for k, v in coverage.items()}
        
        logger.info(f"Land cover analysis complete: {coverage}")
        return coverage
    
    @staticmethod
    def _adjust_with_eurosat(coverage, eurosat_class):
        """Adjust coverage based on EuroSAT classification"""
        adjustments = {
            'Forest': {'forest': 1.2, 'grassland': 0.8},
            'River': {'water': 1.3, 'wetland': 1.1},
            'SeaLake': {'water': 1.5},
            'Highway': {'urban': 1.2, 'barren': 1.1},
            'Industrial': {'urban': 1.4},
            'Residential': {'urban': 1.3},
            'AnnualCrop': {'agricultural': 1.3},
            'PermanentCrop': {'agricultural': 1.2, 'grassland': 1.1},
            'Pasture': {'grassland': 1.3},
            'HerbaceousVegetation': {'grassland': 1.2}
        }
        
        if eurosat_class in adjustments:
            for land_type, factor in adjustments[eurosat_class].items():
                if land_type in coverage:
                    coverage[land_type] *= factor
        
        return coverage
    
    @staticmethod
    def _refine_with_ndvi(coverage, ndvi):
        """Refine vegetation coverage using NDVI"""
        total_pixels = ndvi.size
        
        # NDVI-based vegetation categories
        dense_veg = np.sum(ndvi >= 0.6) / total_pixels * 100
        moderate_veg = np.sum((ndvi >= 0.4) & (ndvi < 0.6)) / total_pixels * 100
        sparse_veg = np.sum((ndvi >= 0.2) & (ndvi < 0.4)) / total_pixels * 100
        
        # Distribute into forest and grassland based on existing ratios
        total_veg = coverage['forest'] + coverage['grassland'] + coverage['agricultural']
        if total_veg > 0:
            veg_ratio = dense_veg + moderate_veg
            # More NDVI = more forest/grassland
            coverage['forest'] = min(coverage['forest'] * 1.2, veg_ratio * 0.6)
            coverage['grassland'] = min(coverage['grassland'] * 1.1, veg_ratio * 0.4)
        
        return coverage
    
    @staticmethod
    def get_primary_land_use(coverage):
        """Get the dominant land cover type"""
        if not coverage or all(v == 0 for v in coverage.values()):
            return "Unknown"
        
        # Get max coverage type
        primary = max(coverage.items(), key=lambda x: x[1])
        
        # Map to friendly names
        friendly_names = {
            'forest': 'Forest',
            'water': 'Water Body',
            'urban': 'Urban/Built-up',
            'agricultural': 'Agricultural Land',
            'barren': 'Barren Land',
            'snow': 'Snow/Ice',
            'grassland': 'Grassland/Pasture',
            'wetland': 'Wetland'
        }
        
        return friendly_names.get(primary[0], primary[0].title())

# Global analyzer instance
_analyzer = None

def get_land_cover_analyzer():
    """Get or create the global land cover analyzer"""
    global _analyzer
    if _analyzer is None:
        _analyzer = LandCoverAnalyzer()
    return _analyzer
