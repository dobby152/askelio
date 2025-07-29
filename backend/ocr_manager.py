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

            # Try API key first (simpler setup)
            api_key = os.getenv('GOOGLE_VISION_API_KEY') or os.getenv('GOOGLE_API_KEY')
            if api_key:
                try:
                    # Use API key authentication
                    client = vision.ImageAnnotatorClient(client_options={"api_key": api_key})
                    logger.info("Google Vision API initialized successfully with API key")
                    return client
                except Exception as e:
                    logger.warning(f"Failed to initialize Google Vision API with API key: {e}")

            # Fallback to service account credentials
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

            # If not in env, try default path
            if not credentials_path:
                credentials_path = 'google-credentials.json'

            if os.path.exists(credentials_path):
                # Use service account credentials
                credentials = service_account.Credentials.from_service_account_file(credentials_path)
                client = vision.ImageAnnotatorClient(credentials=credentials)
                logger.info("Google Vision API initialized successfully with service account")
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

        # Check if it's a PDF file
        if image_path.lower().endswith('.pdf'):
            logger.info("PDF file detected - attempting conversion to image")

            # Try to convert PDF to image using available methods
            try:
                # Method 1: Try pdf2image if available
                try:
                    import pdf2image
                    import io

                    logger.info("Converting PDF to image using pdf2image")

                    # Set poppler path for Windows
                    poppler_path = r"C:\Users\askelatest\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-24.08.0\Library\bin"

                    pages = pdf2image.convert_from_path(
                        image_path,
                        first_page=1,
                        last_page=1,
                        dpi=200,
                        poppler_path=poppler_path if os.path.exists(poppler_path) else None
                    )

                    if pages:
                        # Convert PIL image to bytes
                        img_byte_arr = io.BytesIO()
                        pages[0].save(img_byte_arr, format='PNG')
                        content = img_byte_arr.getvalue()
                        logger.info(f"PDF converted to image successfully ({len(content)} bytes)")
                    else:
                        raise Exception("No pages found in PDF")

                except Exception as pdf2image_error:
                    logger.warning(f"pdf2image conversion failed: {pdf2image_error}")

                    # Method 2: Try PyMuPDF if available
                    try:
                        import fitz

                        logger.info("Converting PDF to image using PyMuPDF")
                        doc = fitz.open(image_path)
                        page = doc[0]  # Get first page

                        # Convert to image with good resolution
                        mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
                        pix = page.get_pixmap(matrix=mat)
                        content = pix.tobytes("png")

                        doc.close()
                        logger.info(f"PDF converted to image successfully ({len(content)} bytes)")

                    except Exception as pymupdf_error:
                        logger.warning(f"PyMuPDF conversion failed: {pymupdf_error}")

                        # Method 3: Return error - PDF conversion not available
                        raise Exception(
                            "PDF conversion failed. Please install poppler-utils for pdf2image or "
                            "convert the PDF to an image file (PNG, JPG) manually. "
                            f"pdf2image error: {pdf2image_error}, PyMuPDF error: {pymupdf_error}"
                        )

            except Exception as conversion_error:
                return OCRResult(
                    provider='google_vision',
                    text="",
                    confidence=0.0,
                    processing_time=time.time() - start_time,
                    success=False,
                    error_message=str(conversion_error)
                )
        else:
            # For image files, read content directly
            with open(image_path, 'rb') as image_file:
                content = image_file.read()

        # Process with Google Vision API
        try:
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

        except Exception as vision_error:
            return OCRResult(
                provider='google_vision',
                text="",
                confidence=0.0,
                processing_time=time.time() - start_time,
                success=False,
                error_message=str(vision_error)
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
