"""
Tesseract OCR Provider for multilayer OCR system
"""
import pytesseract
from PIL import Image
import logging
import os
import re
from typing import Dict, Any, Tuple, Optional

from ..core.ocr_provider_base import OCRProviderBase
from ..core.ocr_result import OCRProviderType, ProcessingMethod, StructuredData
from ..preprocessing.advanced_image_preprocessor import AdvancedImagePreprocessor

logger = logging.getLogger(__name__)


class TesseractProvider(OCRProviderBase):
    """Tesseract OCR provider with advanced configurations"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.preprocessor = AdvancedImagePreprocessor()
        super().__init__(OCRProviderType.TESSERACT, config)
    
    def _initialize(self) -> None:
        """Initialize Tesseract provider"""
        try:
            # Check if Tesseract is available
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract version: {version}")
            
            # Set Tesseract path if specified in config
            tesseract_path = self.config.get('tesseract_path')
            if tesseract_path and os.path.exists(tesseract_path):
                pytesseract.pytesseract.tesseract_cmd = tesseract_path
                logger.info(f"Tesseract path set to: {tesseract_path}")
            elif os.name == 'nt':  # Windows
                # Try common Windows paths
                common_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                    r'C:\Tesseract-OCR\tesseract.exe'
                ]
                for path in common_paths:
                    if os.path.exists(path):
                        pytesseract.pytesseract.tesseract_cmd = path
                        logger.info(f"Found Tesseract at: {path}")
                        break
            
            # Test Tesseract with a simple operation
            test_result = pytesseract.image_to_string(Image.new('RGB', (100, 100), 'white'))
            self.is_available = True
            logger.info("Tesseract provider initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Tesseract: {e}")
            self.is_available = False
    
    def _extract_text(self, image_path: str, preprocessing_method: ProcessingMethod) -> Tuple[str, float, Dict[str, Any]]:
        """Extract text using Tesseract with specified preprocessing"""
        try:
            # Preprocess image
            processed_image_path = self.preprocessor.preprocess_image(image_path, preprocessing_method)
            
            # Load processed image
            image = Image.open(processed_image_path)
            
            # Get OCR configuration based on preprocessing method
            config = self._get_tesseract_config(preprocessing_method)
            
            # Extract text
            text = pytesseract.image_to_string(image, config=config, lang='ces+eng')
            
            # Get detailed OCR data for confidence calculation
            data = pytesseract.image_to_data(image, config=config, lang='ces+eng', 
                                           output_type=pytesseract.Output.DICT)
            
            # Calculate confidence
            confidence = self._calculate_tesseract_confidence(data, text)
            
            # Additional metadata
            additional_metadata = {
                'tesseract_config': config,
                'preprocessing_method': preprocessing_method.value,
                'processed_image_path': processed_image_path,
                'word_count': len([conf for conf in data['conf'] if int(conf) > 0]),
                'avg_word_confidence': sum([int(conf) for conf in data['conf'] if int(conf) > 0]) / 
                                     len([conf for conf in data['conf'] if int(conf) > 0]) if data['conf'] else 0
            }
            
            # Clean up temporary file
            if processed_image_path != image_path:
                self.preprocessor.cleanup_temp_files([processed_image_path])
            
            return text.strip(), confidence, additional_metadata
            
        except Exception as e:
            logger.error(f"Tesseract extraction failed: {e}")
            return f"Tesseract error: {str(e)}", 0.0, {'error': str(e)}
    
    def _get_tesseract_config(self, preprocessing_method: ProcessingMethod) -> str:
        """Get Tesseract configuration based on preprocessing method"""
        base_config = "--oem 3"  # Use LSTM OCR Engine Mode
        
        if preprocessing_method == ProcessingMethod.NONE:
            return f"{base_config} --psm 3"  # Fully automatic page segmentation
        elif preprocessing_method == ProcessingMethod.BASIC:
            return f"{base_config} --psm 6"  # Uniform block of text
        elif preprocessing_method == ProcessingMethod.GENTLE:
            return f"{base_config} --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ.,:-/() "
        elif preprocessing_method == ProcessingMethod.AGGRESSIVE:
            return f"{base_config} --psm 6 -c tessedit_char_blacklist=|@#$%^&*+=[]{{}}\\;\"<>?"
        elif preprocessing_method == ProcessingMethod.CUSTOM:
            return f"{base_config} --psm 6 -c preserve_interword_spaces=1"
        else:
            return f"{base_config} --psm 6"
    
    def _calculate_tesseract_confidence(self, data: Dict[str, Any], text: str) -> float:
        """Calculate confidence score for Tesseract result"""
        if not text or len(text.strip()) < 3:
            return 0.05
        
        # Get word-level confidences
        confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
        
        if not confidences:
            return 0.1
        
        # Calculate base confidence from Tesseract
        avg_confidence = sum(confidences) / len(confidences) / 100.0
        
        # Apply quality adjustments
        quality_score = self._assess_text_quality(text)
        
        # Combine confidence and quality
        final_confidence = (avg_confidence * 0.7) + (quality_score * 0.3)
        
        # Tesseract typically has lower confidence than cloud services
        # Cap at 0.85 to reflect this
        return min(0.85, max(0.05, final_confidence))
    
    def _assess_text_quality(self, text: str) -> float:
        """Assess quality of extracted text"""
        if not text:
            return 0.0
        
        score = 0.0
        
        # Length bonus (longer text usually means better extraction)
        if len(text) > 100:
            score += 0.3
        elif len(text) > 50:
            score += 0.2
        elif len(text) > 20:
            score += 0.1
        
        # Word quality assessment
        words = text.split()
        if words:
            readable_words = sum(1 for word in words if self._is_readable_word(word))
            word_quality = readable_words / len(words)
            score += word_quality * 0.4
        
        # Character quality assessment
        total_chars = len(text)
        if total_chars > 0:
            # Count problematic characters
            problematic_chars = sum(1 for c in text if c in '|||###***???')
            char_quality = 1.0 - (problematic_chars / total_chars)
            score += char_quality * 0.2
        
        # Language pattern detection
        if self._has_language_patterns(text):
            score += 0.1
        
        return min(1.0, score)
    
    def _has_language_patterns(self, text: str) -> bool:
        """Check if text contains recognizable language patterns"""
        text_lower = text.lower()
        
        # Czech patterns
        czech_patterns = [
            'faktura', 'účtenka', 'datum', 'částka', 'celkem', 'kč', 'czk',
            'dodavatel', 'odběratel', 'splatnost', 'variabilní', 'symbol'
        ]
        
        # English patterns
        english_patterns = [
            'invoice', 'receipt', 'date', 'amount', 'total', 'eur', 'usd',
            'vendor', 'customer', 'due', 'variable', 'symbol'
        ]
        
        all_patterns = czech_patterns + english_patterns
        found_patterns = sum(1 for pattern in all_patterns if pattern in text_lower)
        
        return found_patterns >= 2
    
    def _extract_structured_data(self, text: str) -> StructuredData:
        """Extract structured data from text using regex patterns"""
        structured_data = StructuredData()
        
        if not text:
            return structured_data
        
        # Document type detection
        text_lower = text.lower()
        if any(word in text_lower for word in ['faktura', 'invoice']):
            structured_data.document_type = 'faktura'
        elif any(word in text_lower for word in ['účtenka', 'receipt']):
            structured_data.document_type = 'uctenka'
        elif any(word in text_lower for word in ['smlouva', 'contract']):
            structured_data.document_type = 'smlouva'
        
        # Vendor extraction
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
        
        # Amount extraction
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
        
        # Date extraction
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
        
        # Invoice number extraction
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
        """Get information about Tesseract provider"""
        try:
            version = pytesseract.get_tesseract_version()
            languages = pytesseract.get_languages()
        except:
            version = "unknown"
            languages = []
        
        return {
            'provider': self.provider_type.value,
            'version': str(version),
            'available': self.is_available,
            'languages': languages,
            'config': self.config,
            'preprocessing_methods': [method.value for method in ProcessingMethod]
        }
