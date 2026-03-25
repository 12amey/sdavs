"""
Test Script for ML Image Classification System
Tests Python ML service with EuroSAT RGB dataset
"""

import requests
import os
from pathlib import Path
import json

# Configuration
PYTHON_SERVICE_URL = "http://localhost:5000"
DATASET_PATH = r"D:\amey\database\EuroSAT_RGB"

# EuroSAT classes
CLASSES = [
    'AnnualCrop', 'Forest', 'HerbaceousVegetation', 'Highway',
    'Industrial', 'Pasture', 'PermanentCrop', 'Residential',
    'River', 'SeaLake'
]

def test_health():
    """Test if Python ML service is available"""
    print("=" * 60)
    print("TEST 1: Health Check")
    print("=" * 60)
    
    try:
        response = requests.get(f"{PYTHON_SERVICE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print("✅ Python ML Service is running!")
            print(f"Service: {data.get('service')}")
            print(f"Features: {', '.join(data.get('features', []))}")
            return True
        else:
            print(f"❌ Service returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Service not available: {e}")
        return False

def test_validation(image_path):
    """Test image validation endpoint"""
    print("\n" + "=" * 60)
    print(f"TEST 2: Image Validation - {Path(image_path).name}")
    print("=" * 60)
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(f"{PYTHON_SERVICE_URL}/validate-image", files=files)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Validation successful!")
            print(f"Is Satellite Imagery: {data.get('is_satellite_imagery')}")
            print(f"Confidence: {data.get('confidence'):.1f}%")
            print(f"Reasons: {', '.join(data.get('reasons', []))}")
            print(f"Metadata: {data.get('metadata')}")
            return data
        else:
            print(f"❌ Validation failed: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_classification(image_path, expected_class):
    """Test ML classification endpoint"""
    print("\n" + "=" * 60)
    print(f"TEST 3: ML Classification - {Path(image_path).name}")
    print(f"Expected: {expected_class}")
    print("=" * 60)
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(f"{PYTHON_SERVICE_URL}/classify", files=files)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                predicted = data.get('primary_class')
                confidence = data.get('confidence', 0)
                
                print(f"✅ Classification successful!")
                print(f"Predicted: {predicted} ({confidence:.1f}%)")
                print(f"Method: {data.get('method')}")
                
                # Show top predictions
                print("\nTop 3 Predictions:")
                for i, pred in enumerate(data.get('all_predictions', [])[:3], 1):
                    print(f"  {i}. {pred['class']} - {pred['confidence']:.1f}%")
                
                # Check if correct
                is_correct = predicted == expected_class
                print(f"\n{'✅ CORRECT' if is_correct else '❌ INCORRECT'}")
                
                return data, is_correct
            else:
                print(f"❌ Classification failed: {data.get('error')}")
                return data, False
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(response.text)
            return None, False
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, False

def test_analyze(image_path):
    """Test comprehensive analysis endpoint"""
    print("\n" + "=" * 60)
    print(f"TEST 4: Comprehensive Analysis - {Path(image_path).name}")
    print("=" * 60)
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(f"{PYTHON_SERVICE_URL}/analyze", files=files)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Analysis successful!")
                print(f"Dimensions: {data.get('dimensions')}")
                print(f"Bands: {data.get('bands')}")
                print(f"Method: {data.get('method')}")
                
                # NDVI stats (if available)
                if data.get('ndvi_stats'):
                    stats = data['ndvi_stats']
                    print(f"\nNDVI Statistics:")
                    print(f"  Mean: {stats.get('mean', 0):.3f}")
                    print(f"  Min: {stats.get('min', 0):.3f}")
                    print(f"  Max: {stats.get('max', 0):.3f}")
                
                # Vegetation classification (if available)
                if data.get('vegetation_classification'):
                    veg = data['vegetation_classification']
                    print(f"\nVegetation Classification:")
                    for key, value in veg.items():
                        if value > 1.0:  # Show only significant percentages
                            print(f"  {key}: {value:.1f}%")
                
                # ML Classification
                if data.get('ml_classification'):
                    ml = data['ml_classification']
                    print(f"\nML Classification:")
                    print(f"  Primary: {ml.get('primary_class')} ({ml.get('confidence'):.1f}%)")
                
                return data
            else:
                print(f"❌ Analysis failed: {data.get('error')}")
                return None
        else:
            print(f"❌ Request failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def run_full_test_suite():
    """Run complete test suite"""
    print("\n" + "=" * 60)
    print("STARTING COMPREHENSIVE ML SYSTEM TESTS")
    print("=" * 60)
    
    # Test 1: Health check
    if not test_health():
        print("\n❌ Python ML service is not running. Please start it first:")
        print("cd python-cog-service && python app.py")
        return
    
    # Select one test image from each class
    test_results = []
    
    for class_name in CLASSES:
        class_dir = Path(DATASET_PATH) / class_name
        
        if not class_dir.exists():
            print(f"\n⚠️ Directory not found: {class_dir}")
            continue
        
        # Get first image from this class
        images = list(class_dir.glob("*.jpg"))
        if not images:
            print(f"\n⚠️ No images found in {class_name}")
            continue
        
        test_image = str(images[0])
        
        print(f"\n{'=' * 60}")
        print(f"TESTING CLASS: {class_name}")
        print(f"Image: {Path(test_image).name}")
        print(f"{'=' * 60}")
        
        # Test validation
        validation_result = test_validation(test_image)
        
        # Test classification
        classification_result, is_correct = test_classification(test_image, class_name)
        
        # Test comprehensive analysis
        analysis_result = test_analyze(test_image)
        
        test_results.append({
            'class': class_name,
            'image': Path(test_image).name,
            'validation': validation_result is not None,
            'classification': is_correct,
            'analysis': analysis_result is not None
        })
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    total = len(test_results)
    passed_validation = sum(1 for r in test_results if r['validation'])
    passed_classification = sum(1 for r in test_results if r['classification'])
    passed_analysis = sum(1 for r in test_results if r['analysis'])
    
    print(f"\nTotal Classes Tested: {total}")
    print(f"Validation Pass Rate: {passed_validation}/{total} ({passed_validation/total*100:.1f}%)")
    print(f"Classification Accuracy: {passed_classification}/{total} ({passed_classification/total*100:.1f}%)")
    print(f"Analysis Success Rate: {passed_analysis}/{total} ({passed_analysis/total*100:.1f}%)")
    
    print("\nDetailed Results:")
    for result in test_results:
        status = "✅" if result['classification'] else "❌"
        print(f"{status} {result['class']}: {result['image']}")
    
    print("\n" + "=" * 60)
    print("TESTING COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    run_full_test_suite()
