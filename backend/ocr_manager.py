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
    Manages 5 different OCR sources for maximum accuracy:
    1. Google Vision API (cloud-based, high accuracy)
    2. Azure Computer Vision (cloud-based alternative) 
    3. Tesseract (open-source, local)
    4. EasyOCR (ML-based, local)
    5. PaddleOCR (ML-based, local, good for multiple languages)
    """
    
    def __init__(self):
        self.providers = {
            'google_vision': self._init_google_vision(),
            'azure_computer_vision': self._init_azure_cv(),
            'tesseract': self._init_tesseract(),
            'easy_ocr': self._init_easy_ocr(),
            'paddle_ocr': self._init_paddle_ocr()
        }
        
        # Track which providers are available
        self.available_providers = [name for name, provider in self.providers.items() if provider is not None]
        logger.info(f"Initialized OCR Manager with {len(self.available_providers)} available providers: {self.available_providers}")
    
    def _init_google_vision(self):
        """Initialize Google Vision API"""
        try:
            from google.cloud import vision
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            if credentials_path and os.path.exists(credentials_path):
                client = vision.ImageAnnotatorClient()
                logger.info("Google Vision API initialized successfully")
                return client
            else:
                logger.warning("Google Vision API credentials not found")
                return None
        except Exception as e:
            logger.warning(f"Failed to initialize Google Vision API: {e}")
            return None
    
    def _init_azure_cv(self):
        """Initialize Azure Computer Vision"""
        try:
            from azure.cognitiveservices.vision.computervision import ComputerVisionClient
            from msrest.authentication import CognitiveServicesCredentials
            
            endpoint = os.getenv('AZURE_COMPUTER_VISION_ENDPOINT')
            key = os.getenv('AZURE_COMPUTER_VISION_KEY')
            
            if endpoint and key:
                credentials = CognitiveServicesCredentials(key)
                client = ComputerVisionClient(endpoint, credentials)
                logger.info("Azure Computer Vision initialized successfully")
                return client
            else:
                logger.warning("Azure Computer Vision credentials not found")
                return None
        except Exception as e:
            logger.warning(f"Failed to initialize Azure Computer Vision: {e}")
            return None
    
    def _init_tesseract(self):
        """Initialize Tesseract OCR"""
        try:
            # Test if tesseract is available
            pytesseract.get_tesseract_version()
            logger.info("Tesseract OCR initialized successfully")
            return True
        except Exception as e:
            logger.warning(f"Failed to initialize Tesseract: {e}")
            return None
    
    def _init_easy_ocr(self):
        """Initialize EasyOCR"""
        try:
            import easyocr
            reader = easyocr.Reader(['en', 'cs'], gpu=False)
            logger.info("EasyOCR initialized successfully")
            return reader
        except Exception as e:
            logger.warning(f"Failed to initialize EasyOCR: {e}")
            return None
    
    def _init_paddle_ocr(self):
        """Initialize PaddleOCR"""
        try:
            from paddleocr import PaddleOCR
            ocr = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)
            logger.info("PaddleOCR initialized successfully")
            return ocr
        except Exception as e:
            logger.warning(f"Failed to initialize PaddleOCR: {e}")
            return None
    
    def process_image_sequential(self, image_path: str) -> List[OCRResult]:
        """
        Process image through all available OCR providers sequentially
        Returns list of results from all providers
        """
        results = []
        
        logger.info(f"Starting sequential OCR processing for: {image_path}")
        
        # Process through each provider sequentially
        for provider_name in ['google_vision', 'azure_computer_vision', 'tesseract', 'easy_ocr', 'paddle_ocr']:
            if provider_name in self.available_providers:
                logger.info(f"Processing with {provider_name}...")
                result = self._process_with_provider(provider_name, image_path)
                results.append(result)
                logger.info(f"{provider_name} completed: success={result.success}, confidence={result.confidence}")
            else:
                logger.info(f"Skipping {provider_name} (not available)")
        
        logger.info(f"Sequential OCR processing completed. {len(results)} results obtained.")
        return results
    
    def _process_with_provider(self, provider_name: str, image_path: str) -> OCRResult:
        """Process image with specific provider"""
        import time
        start_time = time.time()
        
        try:
            if provider_name == 'google_vision':
                return self._process_google_vision(image_path, start_time)
            elif provider_name == 'azure_computer_vision':
                return self._process_azure_cv(image_path, start_time)
            elif provider_name == 'tesseract':
                return self._process_tesseract(image_path, start_time)
            elif provider_name == 'easy_ocr':
                return self._process_easy_ocr(image_path, start_time)
            elif provider_name == 'paddle_ocr':
                return self._process_paddle_ocr(image_path, start_time)
            else:
                return OCRResult(
                    provider=provider_name,
                    text="",
                    confidence=0.0,
                    processing_time=time.time() - start_time,
                    success=False,
                    error_message="Unknown provider"
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
    
    def _process_azure_cv(self, image_path: str, start_time: float) -> OCRResult:
        """Process with Azure Computer Vision"""
        import time
        
        client = self.providers['azure_computer_vision']
        
        with open(image_path, 'rb') as image_file:
            read_response = client.read_in_stream(image_file, raw=True)
        
        # Get operation ID from response headers
        operation_id = read_response.headers["Operation-Location"].split("/")[-1]
        
        # Wait for operation to complete
        while True:
            read_result = client.get_read_result(operation_id)
            if read_result.status not in ['notStarted', 'running']:
                break
            time.sleep(1)
        
        text = ""
        confidence = 0.0
        if read_result.status == 'succeeded':
            for text_result in read_result.analyze_result.read_results:
                for line in text_result.lines:
                    text += line.text + "\n"
                    confidence += line.bounding_box[0] if line.bounding_box else 0.8
            
            confidence = confidence / len(read_result.analyze_result.read_results) if read_result.analyze_result.read_results else 0.8
        
        return OCRResult(
            provider='azure_computer_vision',
            text=text,
            confidence=confidence,
            processing_time=time.time() - start_time,
            success=read_result.status == 'succeeded'
        )
    
    def _process_tesseract(self, image_path: str, start_time: float) -> OCRResult:
        """Process with Tesseract OCR"""
        import time
        
        # Configure Tesseract for better accuracy
        config = '--oem 3 --psm 6 -l eng+ces'
        
        text = pytesseract.image_to_string(Image.open(image_path), config=config)
        
        # Get confidence data
        data = pytesseract.image_to_data(Image.open(image_path), config=config, output_type=pytesseract.Output.DICT)
        confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
        confidence = sum(confidences) / len(confidences) / 100 if confidences else 0.0
        
        return OCRResult(
            provider='tesseract',
            text=text,
            confidence=confidence,
            processing_time=time.time() - start_time,
            success=True
        )
    
    def _process_easy_ocr(self, image_path: str, start_time: float) -> OCRResult:
        """Process with EasyOCR"""
        import time
        
        reader = self.providers['easy_ocr']
        results = reader.readtext(image_path)
        
        text = ""
        confidences = []
        for (bbox, detected_text, conf) in results:
            text += detected_text + " "
            confidences.append(conf)
        
        confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return OCRResult(
            provider='easy_ocr',
            text=text.strip(),
            confidence=confidence,
            processing_time=time.time() - start_time,
            success=True
        )
    
    def _process_paddle_ocr(self, image_path: str, start_time: float) -> OCRResult:
        """Process with PaddleOCR"""
        import time
        
        ocr = self.providers['paddle_ocr']
        results = ocr.ocr(image_path, cls=True)
        
        text = ""
        confidences = []
        for line in results:
            for word_info in line:
                detected_text = word_info[1][0]
                conf = word_info[1][1]
                text += detected_text + " "
                confidences.append(conf)
        
        confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return OCRResult(
            provider='paddle_ocr',
            text=text.strip(),
            confidence=confidence,
            processing_time=time.time() - start_time,
            success=True
        )
    
    def get_available_providers(self) -> List[str]:
        """Get list of available OCR providers"""
        return self.available_providers.copy()
    
    def get_provider_status(self) -> Dict[str, bool]:
        """Get status of all providers"""
        return {name: (name in self.available_providers) for name in ['google_vision', 'azure_computer_vision', 'tesseract', 'easy_ocr', 'paddle_ocr']}
