"""
Predictive ML Service for Environmental Data
Uses simple time-series forecasting (Linear/Polynomial Regression)
"""
import numpy as np
import logging
from typing import Dict, List, Tuple, Optional

logger = logging.getLogger(__name__)

class Predictor:
    """Predicts future trends from historical time-series data"""
    
    @staticmethod
    def predict_trend(data_points: List[float], forecast_count: int = 12) -> Dict:
        """
        Predict future values using polynomial regression (degree 2)
        
        Args:
            data_points: List of historical values
            forecast_count: Number of points to predict
            
        Returns:
            Dictionary with predicted values and confidence
        """
        if len(data_points) < 3:
            return {"error": "Insufficient data for prediction", "success": False}
        
        try:
            # Create X indices (0, 1, 2, ...)
            x = np.arange(len(data_points))
            y = np.array(data_points)
            
            # Fit polynomial (degree 2 for curved trends)
            coeffs = np.polyfit(x, y, 2)
            poly = np.poly1d(coeffs)
            
            # Predict future X values
            future_x = np.arange(len(data_points), len(data_points) + forecast_count)
            predictions = poly(future_x)
            
            # Add some "realism" (clamping, noise)
            # Ensure NDVI stays between -1 and 1
            if any(p > -1 and p < 1 for p in data_points): # Likely NDVI
                predictions = np.clip(predictions, -1, 1)
            
            # Calculate simple confidence (based on mean squared error of fit)
            fit_values = poly(x)
            mse = np.mean((y - fit_values)**2)
            confidence = max(0, min(100, 100 - (mse * 100)))
            
            return {
                "success": True,
                "predictions": predictions.tolist(),
                "confidence": round(float(confidence), 2),
                "trend_type": "Polynomial Regression (Degree 2)",
                "historical_mean": float(np.mean(y)),
                "predicted_mean": float(np.mean(predictions))
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return {"error": str(e), "success": False}

def get_predictor():
    """Factory function for Predictor"""
    return Predictor()
