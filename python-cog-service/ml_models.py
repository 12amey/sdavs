"""
ML Models for Satellite Image Classification
Uses PyTorch and pre-trained models for land cover classification
"""

import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import numpy as np
import logging
import os
from typing import Dict, List, Tuple, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

# EuroSAT land cover classes
EUROSAT_CLASSES = [
    'AnnualCrop',
    'Forest',
    'HerbaceousVegetation',
    'Highway',
    'Industrial',
    'Pasture',
    'PermanentCrop',
    'Residential',
    'River',
    'SeaLake'
]

class SatelliteImageClassifier:
    """
    Satellite image classification using deep learning
    Supports both pre-trained models and custom EuroSAT-trained models
    """
    
    def __init__(self, model_path: Optional[str] = None, device: str = 'cpu'):
        """
        Initialize the classifier
        
        Args:
            model_path: Path to trained model weights. If None, uses pre-trained ResNet
            device: 'cpu' or 'cuda'
        """
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],  # ImageNet means
                std=[0.229, 0.224, 0.225]     # ImageNet stds
            )
        ])
        
        # Load or create model
        if model_path and os.path.exists(model_path):
            self.model = self._load_trained_model(model_path)
            logger.info(f"Loaded trained model from {model_path}")
        else:
            self.model = self._create_pretrained_model()
            logger.info("Using pre-trained ResNet50 model")
        
        self.model = self.model.to(self.device)
        self.model.eval()
    
    def _create_pretrained_model(self) -> nn.Module:
        """Create model using pre-trained ResNet50"""
        model = models.resnet50(pretrained=True)
        
        # Modify final layer for EuroSAT classes
        num_classes = len(EUROSAT_CLASSES)
        model.fc = nn.Linear(model.fc.in_features, num_classes)
        
        return model
    
    def _load_trained_model(self, model_path: str) -> nn.Module:
        """Load trained model from checkpoint"""
        model = self._create_pretrained_model()
        
        try:
            checkpoint = torch.load(model_path, map_location=self.device)
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if 'model_state_dict' in checkpoint:
                    model.load_state_dict(checkpoint['model_state_dict'])
                elif 'state_dict' in checkpoint:
                    model.load_state_dict(checkpoint['state_dict'])
                else:
                    model.load_state_dict(checkpoint)
            else:
                model.load_state_dict(checkpoint)
            
            logger.info("Successfully loaded model weights")
        except Exception as e:
            logger.warning(f"Could not load model weights: {e}. Using pre-trained model.")
        
        return model
    
    def classify_image(self, image_path: str) -> Dict:
        """
        Classify a single satellite image
        
        Args:
            image_path: Path to satellite image
        
        Returns:
            Dictionary with classification results and confidence scores
        """
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Run inference
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            
            # Get top predictions
            top5_prob, top5_idx = torch.topk(probabilities, min(5, len(EUROSAT_CLASSES)))
            
            # Format results
            predictions = []
            for prob, idx in zip(top5_prob, top5_idx):
                predictions.append({
                    'class': EUROSAT_CLASSES[idx.item()],
                    'confidence': prob.item() * 100
                })
            
            return {
                'success': True,
                'primary_class': predictions[0]['class'],
                'confidence': predictions[0]['confidence'],
                'all_predictions': predictions,
                'method': 'Deep Learning - ResNet50'
            }
            
        except Exception as e:
            logger.error(f"Error classifying image: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def classify_multispectral(
        self,
        bands: Dict[str, np.ndarray],
        required_bands: List[str] = ['B04', 'B03', 'B02']
    ) -> Dict:
        """
        Classify multispectral satellite imagery
        
        Args:
            bands: Dictionary of band names to numpy arrays
            required_bands: List of required band names
        
        Returns:
            Classification results
        """
        try:
            # Check if all required bands are present
            missing_bands = [b for b in required_bands if b not in bands]
            if missing_bands:
                return {
                    'success': False,
                    'error': f"Missing required bands: {missing_bands}"
                }
            
            # Stack bands to create RGB composite
            # B04 = Red, B03 = Green, B02 = Blue (for Sentinel-2)
            rgb_composite = np.stack([
                bands.get('B04', bands[required_bands[0]]),
                bands.get('B03', bands[required_bands[1]]) if len(required_bands) > 1 else bands[required_bands[0]],
                bands.get('B02', bands[required_bands[2]]) if len(required_bands) > 2 else bands[required_bands[0]]
            ], axis=-1)
            
            # Normalize to 0-255 range
            rgb_normalized = ((rgb_composite - rgb_composite.min()) /  
                            (rgb_composite.max() - rgb_composite.min()) * 255).astype(np.uint8)
            
            # Convert to PIL Image
            image = Image.fromarray(rgb_normalized)
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Run inference
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            
            # Get results
            top5_prob, top5_idx = torch.topk(probabilities, min(5, len(EUROSAT_CLASSES)))
            
            predictions = []
            for prob, idx in zip(top5_prob, top5_idx):
                predictions.append({
                    'class': EUROSAT_CLASSES[idx.item()],
                    'confidence': prob.item() * 100
                })
            
            return {
                'success': True,
                'primary_class': predictions[0]['class'],
                'confidence': predictions[0]['confidence'],
                'all_predictions': predictions,
                'method': 'Deep Learning - Multispectral',
                'bands_used': required_bands
            }
            
        except Exception as e:
            logger.error(f"Error classifying multispectral image: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class NDVICalculator:
    """Calculate NDVI and vegetation indices from multispectral bands"""
    
    @staticmethod
    def calculate_ndvi(nir: np.ndarray, red: np.ndarray) -> np.ndarray:
        """
        Calculate NDVI: (NIR - Red) / (NIR + Red)
        
        Args:
            nir: Near-infrared band
            red: Red band
        
        Returns:
            NDVI array
        """
        # Add small epsilon to avoid division by zero
        epsilon = 1e-8
        ndvi = (nir - red) / (nir + red + epsilon)
        
        # Clip to valid range
        ndvi = np.clip(ndvi, -1, 1)
        
        return ndvi
    
    @staticmethod
    def calculate_statistics(ndvi: np.ndarray) -> Dict:
        """Calculate statistics from NDVI array"""
        # Remove invalid values
        valid_ndvi = ndvi[np.isfinite(ndvi)]
        
        if len(valid_ndvi) == 0:
            return {
                'mean': 0.0,
                'median': 0.0,
                'std': 0.0,
                'min': 0.0,
                'max': 0.0
            }
        
        return {
            'mean': float(np.mean(valid_ndvi)),
            'median': float(np.median(valid_ndvi)),
            'std': float(np.std(valid_ndvi)),
            'min': float(np.min(valid_ndvi)),
            'max': float(np.max(valid_ndvi))
        }
    
    @staticmethod
    def classify_vegetation(ndvi: np.ndarray) -> Dict:
        """
        Classify pixels by vegetation health based on NDVI
        
        Returns:
            Dictionary with percentages for each class
        """
        total_pixels = ndvi.size
        
        # Classification thresholds
        water = np.sum(ndvi < -0.1)
        urban = np.sum((ndvi >= -0.1) & (ndvi < 0.1))
        bare_soil = np.sum((ndvi >= 0.1) & (ndvi < 0.2))
        sparse_veg = np.sum((ndvi >= 0.2) & (ndvi < 0.4))
        moderate_veg = np.sum((ndvi >= 0.4) & (ndvi < 0.6))
        dense_veg = np.sum(ndvi >= 0.6)
        
        return {
            'water': (water / total_pixels) * 100,
            'urban': (urban / total_pixels) * 100,
            'bareSoil': (bare_soil / total_pixels) * 100,
            'sparseVegetation': (sparse_veg / total_pixels) * 100,
            'moderateVegetation': (moderate_veg / total_pixels) * 100,
            'denseVegetation': (dense_veg / total_pixels) * 100
        }


# Global model instance (lazy loading)
_classifier_instance: Optional[SatelliteImageClassifier] = None

def get_classifier(model_path: Optional[str] = None) -> SatelliteImageClassifier:
    """Get or create the global classifier instance"""
    global _classifier_instance
    
    if _classifier_instance is None:
        device = os.getenv('ML_MODEL_DEVICE', 'cpu')
        _classifier_instance = SatelliteImageClassifier(model_path, device)
    
    return _classifier_instance
