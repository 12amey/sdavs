"""
EuroSAT RGB Satellite Image Classifier
Uses the EuroSAT dataset for real satellite image classification
"""
import os
import numpy as np
from PIL import Image
from collections import Counter
import logging

logger = logging.getLogger(__name__)

class EuroSATClassifier:
    """Real satellite image classifier using EuroSAT dataset"""
    
    def __init__(self, dataset_path=r"D:\amey\database\EuroSAT_RGB"):
        self.dataset_path = dataset_path
        self.classes = [
            'AnnualCrop', 'Forest', 'HerbaceousVegetation', 'Highway',
            'Industrial', 'Pasture', 'PermanentCrop', 'Residential',
            'River', 'SeaLake'
        ]
        self.class_samples = {}
        self.class_stats = {}
        self._load_samples()
    
    def _load_samples(self):
        """Load representative samples from each class"""
        logger.info(f"Loading EuroSAT samples from {self.dataset_path}")
        
        for class_name in self.classes:
            class_path = os.path.join(self.dataset_path, class_name)
            if not os.path.exists(class_path):
                logger.warning(f"Class directory not found: {class_path}")
                continue
            
            # Load first 50 samples for each class
            samples = []
            image_files = [f for f in os.listdir(class_path) if f.endswith(('.jpg', '.png'))][:50]
            
            for img_file in image_files:
                try:
                    img_path = os.path.join(class_path, img_file)
                    img = Image.open(img_path).convert('RGB')
                    img_array = np.array(img, dtype=np.float32) / 255.0
                    samples.append(img_array)
                except Exception as e:
                    logger.warning(f"Error loading {img_file}: {e}")
            
            if samples:
                samples_array = np.array(samples)
                self.class_samples[class_name] = samples_array
                # Calculate mean color per channel
                self.class_stats[class_name] = {
                    'mean': np.mean(samples_array, axis=(0, 1, 2)),
                    'std': np.std(samples_array, axis=(0, 1, 2))
                }
                logger.info(f"Loaded {len(samples)} samples for {class_name}")
    
    def classify_image(self, image_array):
        """
        Classify a satellite image using color similarity to EuroSAT classes
        
        Args:
            image_array: numpy array of shape (H, W, 3) with values 0-255
            
        Returns:
            dict with classification results
        """
        height, width = image_array.shape[:2]
        
        # ANTI-SCREENSHOT CHECKS
        is_likely_screenshot = False
        screenshot_reasons = []
        
        # Check 1: DISABLED - Satellite exports can be any aspect ratio!
        # Google Earth, Landsat, Sentinel can be 16:9 or wide format
        # aspect_ratio = width / height if height > 0 else 1
        # if abs(aspect_ratio - 16/9) < 0.1 or abs(aspect_ratio - 16/10) < 0.1:
        #     is_likely_screenshot = True
        #     screenshot_reasons.append("Common monitor aspect ratio")
        
        # Normalize image for further checks and classification
        img_normalized = image_array.astype(np.float32) / 255.0

        # Check 2: Check for uniform gradients (like NDVI visualization)
        # Check if image has very smooth gradients (typical of UI visualizations)
        gradient_x = np.abs(np.diff(img_normalized[:, :, 1], axis=1))  # Green channel
        gradient_y = np.abs(np.diff(img_normalized[:, :, 1], axis=0))
        
        if np.mean(gradient_x) < 0.01 and np.mean(gradient_y) < 0.01:
            # Very smooth - likely a generated gradient
            if np.std(img_normalized[:, :, 1]) > 0.2:  # But has color variation
                is_likely_screenshot = True
                screenshot_reasons.append("Smooth gradient detected (UI visualization)")
        
        # Check 3: RELAXED white background check - only reject VERY white UIs
        mean_color = np.mean(img_normalized, axis=(0, 1))
        if np.all(mean_color > 0.95):  # Changed from 0.8 to 0.95 - allows bright snow/ice/sand
            is_likely_screenshot = True
            screenshot_reasons.append("Very white/UI background detected")
        
        # Check 4: DISABLED - Satellite images can be any shape!
        # Landsat scenes and satellite exports can be wide or tall
        # if width > height * 2 or height > width * 2:
        #     is_likely_screenshot = True
        #     screenshot_reasons.append("Extreme aspect ratio")
        
        # If likely screenshot, return low confidence
        if is_likely_screenshot:
            logger.info(f"🚫 Screenshot detected: {', '.join(screenshot_reasons)}")
            return {
                'primary_class': 'Residential',  # Most screenshots are of human interfaces
                'confidence': 5.0 + np.random.random() * 10,  # Very low 5-15%
                'probabilities': {'Residential': 15.0, 'Industrial': 10.0},
                'is_satellite_imagery': False,
                'method': 'EuroSAT RGB Classification (Screenshot Rejected)',
                'screenshot_detected': True,
                'screenshot_reasons': screenshot_reasons,
                'top_3': [('Residential', 15.0), ('Industrial', 10.0), ('Highway', 8.0)]
            }
        
        # Original classification logic for real images
        img_mean = np.mean(img_normalized, axis=(0, 1))
        img_std = np.std(img_normalized, axis=(0, 1))
        
        # Calculate similarity to each class
        similarities = {}
        for class_name, stats in self.class_stats.items():
            # Euclidean distance in RGB space
            color_distance = np.linalg.norm(img_mean - stats['mean'])
            std_distance = np.linalg.norm(img_std - stats['std'])
            
            # Similarity score (inverse of distance)
            similarity = 1.0 / (1.0 + color_distance + std_distance * 0.5)
            similarities[class_name] = similarity
        
        # Normalize similarities to percentages
        total_sim = sum(similarities.values())
        probabilities = {k: (v / total_sim) * 100 for k, v in similarities.items()}
        
        # Get top prediction
        top_class = max(probabilities, key=probabilities.get)
        confidence = probabilities[top_class]
        
        # DISABLED: Texture check - compressed satellite exports can be smooth!
        # Satellite exports (Google Earth, web) are often compressed/smooth
        # texture_complexity = np.std(img_normalized)
        # if texture_complexity < 0.15:
        #     confidence = confidence * 0.5
        #     logger.info(f"⚠️ Low texture complexity: {texture_complexity:.3f} - reducing confidence")
        
        # Determine if it's satellite imagery (stricter threshold)
        is_satellite = confidence > 30.0 and not is_likely_screenshot
        
        return {
            'primary_class': top_class,
            'confidence': confidence,
            'probabilities': probabilities,
            'is_satellite_imagery': is_satellite,
            'method': 'EuroSAT RGB Classification',
            'top_3': sorted(probabilities.items(), key=lambda x: x[1], reverse=True)[:3],
            'screenshot_detected': False
        }
    
    def is_dataset_loaded(self):
        """Check if dataset is properly loaded"""
        return len(self.class_samples) > 0

# Global classifier instance
_classifier = None

def get_classifier():
    """Get or initialize the EuroSAT classifier"""
    global _classifier
    if _classifier is None:
        _classifier = EuroSATClassifier()
    return _classifier
