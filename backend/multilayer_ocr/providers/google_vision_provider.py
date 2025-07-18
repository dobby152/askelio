"""
Google Cloud Vision OCR Provider for multilayer OCR system
"""
import io
import os
import logging
from typing import Dict, Any, Tuple, Optional

try:
    from google.cloud import vision
    from google.oauth2 import service_account
    GOOGLE_VISION_AVAILABLE = True
except ImportError:
    GOOGLE_VISION_AVAILABLE = False

from ..core.ocr_provider_base import OCRProviderBase
from ..core.ocr_result import OCRProviderType, ProcessingMethod, StructuredData

logger = logging.getLogger(__name__)


class GoogleVisionProvider(OCRProviderBase):
    """Google Cloud Vision OCR provider"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.client = None
        super().__init__(OCRProviderType.GOOGLE_VISION, config)
    
    def _initialize(self) -> None:
        """Initialize Google Vision provider"""
        if not GOOGLE_VISION_AVAILABLE:
            logger.error("Google Cloud Vision library not available")
            self.is_available = False
            return
        
        try:
            # Try to get credentials from various sources
            credentials_path = self._find_credentials()
            
            if credentials_path:
                credentials = service_account.Credentials.from_service_account_file(credentials_path)
                self.client = vision.ImageAnnotatorClient(credentials=credentials)
                logger.info(f"Google Vision initialized with credentials: {credentials_path}")
            else:
                # Try default credentials (environment variable, service account, etc.)
                self.client = vision.ImageAnnotatorClient()
                logger.info("Google Vision initialized with default credentials")
            
            # Test the client with a simple request
            self._test_client()
            self.is_available = True
            logger.info("Google Vision provider initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Vision: {e}")
            self.is_available = False
            self.client = None
    
    def _find_credentials(self) -> Optional[str]:
        """Find Google Cloud credentials file"""
        # Check config first
        if 'credentials_path' in self.config:
            path = self.config['credentials_path']
            if os.path.exists(path):
                return path
        
        # Check environment variable
        env_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        if env_path and os.path.exists(env_path):
            return env_path
        
        # Check common locations
        possible_paths = [
            'backend/google-credentials.json',
            'google-credentials.json',
            os.path.join(os.path.dirname(__file__), '../../google-credentials.json'),
            os.path.join(os.path.dirname(__file__), '../../../google-credentials.json')
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        return None
    
    def _test_client(self) -> None:
        """Test Google Vision client with a minimal request"""
        # This is a minimal test - in production you might want a more thorough test
        if not self.client:
            raise Exception("Client not initialized")
        
        # We'll skip the actual test here to avoid unnecessary API calls
        # In production, you might want to test with a small image
        pass
    
    def _extract_text(self, image_path: str, preprocessing_method: ProcessingMethod) -> Tuple[str, float, Dict[str, Any]]:
        """Extract text using Google Vision API"""
        try:
            if not self.client:
                raise Exception("Google Vision client not initialized")
            
            # Read image file
            with io.open(image_path, 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            
            # Use document text detection for better results with documents
            response = self.client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(f'Google Vision API error: {response.error.message}')
            
            if not response.full_text_annotation:
                return "", 0.0, {'message': 'No text detected'}
            
            # Extract full text
            full_text = response.full_text_annotation.text
            
            # Calculate confidence from word-level data
            confidence = self._calculate_google_vision_confidence(response.full_text_annotation)
            
            # Extract additional metadata
            additional_metadata = {
                'pages': len(response.full_text_annotation.pages),
                'blocks': sum(len(page.blocks) for page in response.full_text_annotation.pages),
                'paragraphs': sum(len(block.paragraphs) for page in response.full_text_annotation.pages 
                                for block in page.blocks),
                'words': sum(len(paragraph.words) for page in response.full_text_annotation.pages 
                           for block in page.blocks for paragraph in block.paragraphs),
                'language_detected': self._detect_language(response.full_text_annotation),
                'preprocessing_method': preprocessing_method.value
            }
            
            return full_text.strip(), confidence, additional_metadata
            
        except Exception as e:
            logger.error(f"Google Vision extraction failed: {e}")
            return f"Google Vision error: {str(e)}", 0.0, {'error': str(e)}
    
    def _calculate_google_vision_confidence(self, annotation) -> float:
        """Calculate confidence score from Google Vision annotation"""
        try:
            total_confidence = 0
            word_count = 0
            low_confidence_words = 0
            
            for page in annotation.pages:
                for block in page.blocks:
                    for paragraph in block.paragraphs:
                        for word in paragraph.words:
                            if hasattr(word, 'confidence') and word.confidence is not None:
                                confidence = word.confidence
                                total_confidence += confidence
                                word_count += 1
                                
                                # Count words with low confidence
                                if confidence < 0.7:
                                    low_confidence_words += 1
            
            if word_count > 0:
                avg_confidence = total_confidence / word_count
                
                # Penalize if too many words have low confidence
                low_confidence_ratio = low_confidence_words / word_count
                if low_confidence_ratio > 0.3:  # More than 30% low confidence
                    avg_confidence *= 0.8
                
                # Google Vision is generally very accurate, but cap at 95%
                return min(0.95, max(0.1, avg_confidence))
            else:
                # If no confidence data available, use high default for Google Vision
                return 0.85
                
        except Exception as e:
            logger.warning(f"Confidence calculation failed: {e}")
            return 0.85  # Conservative fallback for Google Vision
    
    def _detect_language(self, annotation) -> Optional[str]:
        """Detect language from Google Vision annotation"""
        try:
            # Google Vision can provide language information
            for page in annotation.pages:
                if hasattr(page, 'property') and page.property:
                    if hasattr(page.property, 'detected_languages') and page.property.detected_languages:
                        # Return the most confident language
                        best_lang = max(page.property.detected_languages, 
                                      key=lambda x: x.confidence if hasattr(x, 'confidence') else 0)
                        return best_lang.language_code
            
            # Fallback: simple heuristic based on text content
            text = annotation.text.lower()
            czech_chars = sum(1 for c in text if c in 'áčďéěíňóřšťúůýž')
            if czech_chars > 0:
                return 'cs'
            else:
                return 'en'
                
        except Exception:
            return None
    
    def _extract_structured_data(self, text: str) -> StructuredData:
        """Extract structured data using Google Vision's advanced capabilities"""
        structured_data = StructuredData()
        
        if not text:
            return structured_data
        
        # Use similar patterns as Tesseract but with higher confidence
        # since Google Vision typically provides cleaner text
        
        # Document type detection
        text_lower = text.lower()
        if any(word in text_lower for word in ['faktura', 'invoice']):
            structured_data.document_type = 'faktura'
        elif any(word in text_lower for word in ['účtenka', 'receipt']):
            structured_data.document_type = 'uctenka'
        elif any(word in text_lower for word in ['smlouva', 'contract']):
            structured_data.document_type = 'smlouva'
        
        # Enhanced vendor extraction (Google Vision typically has cleaner text)
        import re
        
        vendor_patterns = [
            r'(?:dodavatel|prodejce|firma):\s*([^\n\r]+)',
            r'^([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]+s\.r\.o\.)',
            r'^([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]+a\.s\.)',
            r'([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]{3,}(?:s\.r\.o\.|a\.s\.|spol\.|Ltd\.|Inc\.))'
        ]
        
        for pattern in vendor_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                vendor_name = match.group(1).strip()
                if len(vendor_name) > 3:
                    structured_data.vendor = vendor_name
                    break
        
        # Enhanced amount extraction
        amount_patterns = [
            r'(?:celkem\s+k\s+úhradě|celková\s+částka|k\s+úhradě)[\s:]*([0-9\s,\.]+)(?:\s*(CZK|Kč|EUR|USD))?',
            r'CELKEM.*?([0-9]{1,3}(?:[\s,]\d{3})*(?:[,\.]\d{2})?)',
            r'([0-9]{1,3}(?:\s\d{3})*(?:,\d{2})?)\s*(?:CZK|Kč|EUR|USD)',
            r'([0-9]{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2})?)\s*(CZK|Kč|EUR|USD)'
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                amount_str = match.group(1).strip()
                try:
                    # Process Czech number format
                    if ' ' in amount_str and ',' in amount_str:
                        amount_str = amount_str.replace(' ', '').replace(',', '.')
                    elif ',' in amount_str and amount_str.count(',') == 1:
                        parts = amount_str.split(',')
                        if len(parts[1]) == 2:
                            amount_str = amount_str.replace(',', '.')
                        else:
                            amount_str = amount_str.replace(',', '')
                    else:
                        amount_str = amount_str.replace(' ', '')
                    
                    amount_value = float(amount_str)
                    structured_data.amount = amount_value
                    
                    if len(match.groups()) > 1 and match.group(2):
                        structured_data.currency = match.group(2).replace('Kč', 'CZK')
                    else:
                        structured_data.currency = "CZK"
                    break
                except ValueError:
                    continue
        
        # Enhanced date extraction
        date_patterns = [
            r'(?:datum\s+vystavení|datum\s+vystaveni):\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})',
            r'(?:datum\s+splatnosti):\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})',
            r'(?:ze\s+dne|vystaveno):\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})',
            r'(\d{4})-(\d{1,2})-(\d{1,2})',
            r'(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    day, month, year = match.group(1), match.group(2), match.group(3)
                    if len(day) == 4:  # YYYY-MM-DD format
                        year, month, day = day, month, year
                    
                    day_int, month_int, year_int = int(day), int(month), int(year)
                    if 1 <= day_int <= 31 and 1 <= month_int <= 12 and 2000 <= year_int <= 2030:
                        structured_data.date = f"{year_int}-{month_int:02d}-{day_int:02d}"
                        break
                except:
                    continue
        
        # Enhanced invoice number extraction
        invoice_patterns = [
            r'(?:faktura|invoice)\s+(?:č\.|číslo|number)?\s*([A-Z0-9\-/]+)',
            r'(?:variabilni\s+symbol|variable\s+symbol):\s*([A-Z0-9\-/]+)',
            r'(?:č\.|číslo|#)\s*([A-Z0-9\-/]{6,})',
            r'([A-Z0-9]{8,})',
            r'(\d{6,})'
        ]
        
        for pattern in invoice_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                invoice_num = match.group(1).strip()
                if len(invoice_num) >= 6:
                    structured_data.invoice_number = invoice_num
                    break
        
        return structured_data
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get information about Google Vision provider"""
        return {
            'provider': self.provider_type.value,
            'available': self.is_available,
            'client_initialized': self.client is not None,
            'config': {k: v for k, v in self.config.items() if k != 'credentials_path'},
            'features': [
                'document_text_detection',
                'text_detection',
                'language_detection',
                'confidence_scoring',
                'structured_output'
            ],
            'supported_formats': ['PNG', 'JPEG', 'GIF', 'BMP', 'WEBP', 'RAW', 'ICO', 'PDF', 'TIFF']
        }
