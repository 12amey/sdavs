"""
Gemini AI Integration for Enhanced Screenshot Detection
Uses Google's Gemini API to verify if images are real satellite imagery
"""
import os
import logging
import google.generativeai as genai
from PIL import Image

logger = logging.getLogger(__name__)

class GeminiScreenshotDetector:
    """Use Gemini AI to detect screenshots and fake satellite imagery"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("✅ Gemini API initialized for screenshot detection")
        else:
            self.model = None
            logger.warning("⚠️ Gemini API key not found - enhanced detection disabled")
    
    def is_available(self):
        """Check if Gemini API is available"""
        return self.model is not None
    
    def detect_screenshot(self, image_path):
        """
        Use Gemini AI to detect if image is a screenshot/fake
        
        Args:
            image_path: Path to the image file
            
        Returns:
            dict with detection results
        """
        if not self.is_available():
            return {
                'is_screenshot': False,
                'confidence': 50.0,
              'reasoning': 'Gemini API not available',
                'gemini_available': False
            }
        
        try:
            # Load image
            img = Image.open(image_path)
            
            # Prompt for Gemini
            prompt = """Analyze this image and determine if it is:
            
A) REAL satellite/aerial imagery captured from space or aircraft (actual photos of Earth's surface)
B) A screenshot, UI visualization, computer-generated graphic, or regular photo

Respond in JSON format:
{
    "is_real_satellite_imagery": true/false,
    "confidence_percentage": 0-100,
    "image_type": "satellite" | "screenshot" | "visualization" | "regular_photo" | "unknown",
    "reasoning": "brief explanation of why",
    "indicators": ["list", "of", "key", "indicators"]
}

Be strict - only mark as satellite imagery if it shows actual aerial/satellite view of land/water."""

            # Call Gemini
            response = self.model.generate_content([prompt, img])
            result_text = response.text.strip()
            
            # Parse JSON response
            import json
            # Remove markdown code blocks if present
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(result_text)
            
            # Convert to our format
            is_screenshot = not result.get('is_real_satellite_imagery', False)
            confidence = 100 - result.get('confidence_percentage', 50) if is_screenshot else result.get('confidence_percentage', 50)
            
            logger.info(f"🤖 Gemini detection: is_screenshot={is_screenshot}, confidence={confidence:.1f}%, type={result.get('image_type')}")
            
            return {
                'is_screenshot': is_screenshot,
                'confidence': confidence,
                'reasoning': result.get('reasoning', ''),
                'image_type': result.get('image_type', 'unknown'),
                'indicators': result.get('indicators', []),
                'gemini_available': True,
                'raw_response': result
            }
            
        except Exception as e:
            logger.error(f"❌ Gemini detection error: {e}")
            return {
                'is_screenshot': False,
                'confidence': 50.0,
                'reasoning': f'Gemini API error: {str(e)}',
                'gemini_available': False
            }

# Global instance
_detector = None

def get_gemini_detector(api_key=None):
    """Get or initialize the Gemini detector"""
    global _detector
    if _detector is None:
        _detector = GeminiScreenshotDetector(api_key)
    return _detector
