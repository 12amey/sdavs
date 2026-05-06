"""
Test Cloud Detection Feature
"""
import numpy as np
from cloud_detector import get_cloud_detector
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_cloud_detector():
    detector = get_cloud_detector()
    
    # 1. Test with a "Clear" synthetic image (Blue/Green)
    clear_img = np.zeros((100, 100, 3), dtype=np.uint8)
    clear_img[:, :, 1] = 100 # Some green
    clear_img[:, :, 2] = 150 # Some blue
    
    result = detector.detect_clouds(clear_img)
    print(f"Clear image test: {result}")
    assert result['cloud_cover_percentage'] < 5.0
    assert result['density'] == "Clear"
    
    # 2. Test with a "Cloudy" synthetic image (High brightness, low variance)
    cloudy_img = np.ones((100, 100, 3), dtype=np.uint8) * 230 # Very bright grey/white
    
    result = detector.detect_clouds(cloudy_img)
    print(f"Cloudy image test: {result}")
    assert result['cloud_cover_percentage'] > 90.0
    assert result['density'] == "Overcast"
    
    # 3. Test with "Partly Cloudy" (Half clear, half cloudy)
    partly_img = clear_img.copy()
    partly_img[:50, :, :] = 240 # Top half is cloudy
    
    result = detector.detect_clouds(partly_img)
    print(f"Partly cloudy test: {result}")
    assert 40.0 < result['cloud_cover_percentage'] < 60.0
    assert result['density'] == "Cloudy" # 50% is "Cloudy" per density logic

    print("✅ All cloud detector tests passed!")

if __name__ == "__main__":
    test_cloud_detector()
