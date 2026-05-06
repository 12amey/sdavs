"""
Cloud Detection for Satellite Imagery
Uses spectral heuristics to identify clouds and calculate coverage percentage.
"""
import numpy as np
from PIL import Image
import logging
from typing import Dict, List, Tuple, Optional

logger = logging.getLogger(__name__)

class CloudDetector:
    """Detects clouds in satellite imagery using spectral heuristics"""
    
    @staticmethod
    def detect_clouds(image_array: np.ndarray, nir_array: Optional[np.ndarray] = None) -> Dict:
        """
        Detect clouds and return coverage statistics
        
        Args:
            image_array: RGB image array (H, W, 3) with values 0-255
            nir_array: Optional Near-Infrared array
            
        Returns:
            Dictionary with cloud coverage metrics
        """
        height, width = image_array.shape[:2]
        total_pixels = height * width
        
        # Normalize to 0-1
        img_normalized = image_array.astype(np.float32) / 255.0
        r, g, b = img_normalized[:,:,0], img_normalized[:,:,1], img_normalized[:,:,2]
        
        # Basic RGB Cloud Mask
        # Clouds are bright (high R, G, B) and neutral (R ~ G ~ B)
        brightness = (r + g + b) / 3.0
        color_variance = np.abs(r - g) + np.abs(g - b) + np.abs(b - r)
        
        # Thresholds for cloud detection
        # Thick clouds: Very bright, very low variance
        thick_cloud_mask = (brightness > 0.8) & (color_variance < 0.1)
        
        # Thin clouds/haze: Moderately bright, low variance
        thin_cloud_mask = (brightness > 0.6) & (brightness <= 0.8) & (color_variance < 0.15)
        
        # Refine with NIR if available
        # Clouds are highly reflective in NIR
        if nir_array is not None:
            nir_normalized = nir_array.astype(np.float32) / nir_array.max() if nir_array.max() > 0 else nir_array
            # Clouds typically have high NIR and high Blue
            # Vegetation has high NIR but low Blue
            cloud_nir_mask = (nir_normalized > 0.5) & (b > 0.4)
            
            thick_cloud_mask = thick_cloud_mask | (cloud_nir_mask & (brightness > 0.7))
            thin_cloud_mask = thin_cloud_mask | (cloud_nir_mask & (brightness <= 0.7) & (brightness > 0.5))

        thick_count = np.sum(thick_cloud_mask)
        thin_count = np.sum(thin_cloud_mask)
        
        cloud_percentage = ((thick_count + thin_count) / total_pixels) * 100
        thick_percentage = (thick_count / total_pixels) * 100
        thin_percentage = (thin_count / total_pixels) * 100
        
        # Determine density
        density = "Clear"
        if cloud_percentage > 70:
            density = "Overcast"
        elif cloud_percentage > 30:
            density = "Cloudy"
        elif cloud_percentage > 5:
            density = "Partly Cloudy"
            
        result = {
            "success": True,
            "cloud_cover_percentage": round(float(cloud_percentage), 2),
            "thick_cloud_percentage": round(float(thick_percentage), 2),
            "thin_cloud_percentage": round(float(thin_percentage), 2),
            "density": density,
            "is_cloudy": bool(cloud_percentage > 15.0)
        }
        
        logger.info(f"Cloud detection: {result['cloud_cover_percentage']}% coverage ({density})")
        return result

def get_cloud_detector():
    """Factory function for CloudDetector"""
    return CloudDetector()
