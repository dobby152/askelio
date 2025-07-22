"""
Clean OCR Manager with 5 different sources for invoice/receipt scanning
Sequential processing through all OCR providers
"""
import os
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from PIL import Image
import pytesseract
import cv2
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class OCRResult:
    """Result from an OCR provider"""
    provider: str
    text: str
    confidence: float
    processing_time: float
    success: bool
    error_message: Optional[str] = None

class OCRManager:
    """
    Simplified OCR Manager using only Google Vision API with Gemini for immediate data structuring.
    Removed multiple OCR concepts - focusing on single high-quality provider.
    """

    def __init__(self):
        self.providers = {
            'google_vision': self._init_google_vision()
        }

        # Track which providers are available
        self.available_providers = [name for name, provider in self.providers.items() if provider is not None]
        logger.info(f"Initialized simplified OCR Manager with Google Vision only: {self.available_providers}")

        # Initialize Gemini for immediate data structuring
        try:
            from gemini_decision_engine import GeminiDecisionEngine
            self.gemini_engine = GeminiDecisionEngine()
            logger.info(f"Gemini engine initialized: {self.gemini_engine.is_available}")
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini engine: {e}")
            self.gemini_engine = None
    
    def _init_google_vision(self):
        """Initialize Google Vision API"""
        try:
            from google.cloud import vision
            from google.oauth2 import service_account

            # Try to get credentials path from environment
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

            # If not in env, try default path
            if not credentials_path:
                credentials_path = 'google-credentials.json'

            if os.path.exists(credentials_path):
                # Use service account credentials
                credentials = service_account.Credentials.from_service_account_file(credentials_path)
                client = vision.ImageAnnotatorClient(credentials=credentials)
                logger.info("Google Vision API initialized successfully")
                return client
            else:
                logger.warning(f"Google Vision API credentials not found at: {credentials_path}")
                return None
        except Exception as e:
            logger.warning(f"Failed to initialize Google Vision API: {e}")
            return None
    


    def process_image_with_structuring(self, image_path: str, document_type: str = "invoice") -> Dict[str, any]:
        """
        Simplified processing: Google Vision OCR + immediate Gemini data structuring
        Returns structured data directly instead of multiple OCR results
        """
        logger.info(f"Starting simplified OCR processing with structuring for: {image_path}")

        # Process with Google Vision
        if 'google_vision' not in self.available_providers:
            return {
                "success": False,
                "error": "Google Vision not available",
                "structured_data": None,
                "raw_text": "",
                "confidence": 0.0,
                "processing_time": 0.0
            }

        import time
        start_time = time.time()

        # Get OCR result from Google Vision
        ocr_result = self._process_with_provider('google_vision', image_path)

        if not ocr_result.success:
            return {
                "success": False,
                "error": f"Google Vision OCR failed: {ocr_result.error_message}",
                "structured_data": None,
                "raw_text": "",
                "confidence": 0.0,
                "processing_time": time.time() - start_time
            }

        # Immediately structure data with Gemini
        structured_result = None
        if self.gemini_engine and self.gemini_engine.is_available:
            try:
                structured_result = self.gemini_engine.structure_and_validate_data(
                    ocr_result.text, None, document_type
                )
                logger.info(f"Gemini structuring completed: success={structured_result.success}")
            except Exception as e:
                logger.warning(f"Gemini structuring failed: {e}")

        return {
            "success": True,
            "provider": "google_vision",
            "raw_text": ocr_result.text,
            "confidence": ocr_result.confidence,
            "processing_time": time.time() - start_time,
            "structured_data": structured_result.structured_data if structured_result and structured_result.success else None,
            "structuring_confidence": structured_result.confidence_score if structured_result else 0.0,
            "structuring_notes": structured_result.validation_notes if structured_result else "Gemini not available",
            "fields_extracted": structured_result.fields_extracted if structured_result else []
        }
    
    def _process_with_provider(self, provider_name: str, image_path: str) -> OCRResult:
        """Process image with specific provider (only Google Vision supported)"""
        import time
        start_time = time.time()

        try:
            if provider_name == 'google_vision':
                return self._process_google_vision(image_path, start_time)
            else:
                return OCRResult(
                    provider=provider_name,
                    text="",
                    confidence=0.0,
                    processing_time=time.time() - start_time,
                    success=False,
                    error_message=f"Provider {provider_name} not supported in simplified mode"
                )
        except Exception as e:
            return OCRResult(
                provider=provider_name,
                text="",
                confidence=0.0,
                processing_time=time.time() - start_time,
                success=False,
                error_message=str(e)
            )
    
    def _process_google_vision(self, image_path: str, start_time: float) -> OCRResult:
        """Process with Google Vision API"""
        import time
        from google.cloud import vision
        
        client = self.providers['google_vision']

        # Check if file is PDF and convert to image first
        if image_path.lower().endswith('.pdf'):
            try:
                import fitz  # PyMuPDF

                # Convert PDF to image
                pdf_document = fitz.open(image_path)
                page = pdf_document[0]  # Get first page
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
                img_data = pix.tobytes("png")
                pdf_document.close()

                # Use the converted image data
                content = img_data

            except ImportError:
                # Fallback: try to read PDF as binary (will likely fail)
                logger.warning("PyMuPDF not available, trying to process PDF directly (may fail)")
                with open(image_path, 'rb') as image_file:
                    content = image_file.read()
            except Exception as e:
                raise Exception(f"Failed to convert PDF to image: {str(e)}")
        else:
            # Regular image file
            with open(image_path, 'rb') as image_file:
                content = image_file.read()

        image = vision.Image(content=content)
        response = client.document_text_detection(image=image)
        
        if response.error.message:
            raise Exception(response.error.message)
        
        text = response.full_text_annotation.text if response.full_text_annotation else ""
        confidence = 0.95  # Google Vision typically has high confidence
        
        return OCRResult(
            provider='google_vision',
            text=text,
            confidence=confidence,
            processing_time=time.time() - start_time,
            success=True
        )
    



    def get_available_providers(self) -> List[str]:
        """Get list of available OCR providers"""
        return self.available_providers.copy()

    def get_provider_status(self) -> Dict[str, bool]:
        """Get status of providers (simplified to only Google Vision)"""
        return {name: (name in self.available_providers) for name in ['google_vision']}

    def get_gemini_status(self) -> Dict[str, any]:
        """Get Gemini engine status"""
        if self.gemini_engine:
            return self.gemini_engine.get_status()
        return {
            "available": False,
            "api_key_configured": False,
            "model_name": None,
            "engine_type": "not_initialized",
            "features": []
        }
