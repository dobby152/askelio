"""
PaddleOCR Provider for multilayer OCR system
Open source OCR solution with good multilingual support
"""
import logging
from typing import Dict, Any, Tuple, Optional
import numpy as np
from PIL import Image

try:
    from paddleocr import PaddleOCR
    PADDLE_OCR_AVAILABLE = True
except ImportError:
    PADDLE_OCR_AVAILABLE = False

from ..core.ocr_provider_base import OCRProviderBase
from ..core.ocr_result import OCRProviderType, ProcessingMethod, StructuredData

logger = logging.getLogger(__name__)


class PaddleOCRProvider(OCRProviderBase):
    """PaddleOCR provider - open source multilingual OCR"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.ocr_engine = None
        super().__init__(OCRProviderType.PADDLE_OCR, config)
    
    def _initialize(self) -> None:
        """Initialize PaddleOCR provider"""
        if not PADDLE_OCR_AVAILABLE:
            logger.error("PaddleOCR library not available")
            self.is_available = False
            return
        
        try:
            # Configure PaddleOCR
            use_angle_cls = self.config.get('use_angle_cls', True)
            lang = self.config.get('lang', 'en')  # Default to English, can be 'ch', 'en', etc.
            use_gpu = self.config.get('use_gpu', False)
            show_log = self.config.get('show_log', False)
            
            # Initialize PaddleOCR
            self.ocr_engine = PaddleOCR(
                use_angle_cls=use_angle_cls,
                lang=lang,
                use_gpu=use_gpu,
                show_log=show_log
            )
            
            self.is_available = True
            logger.info(f"PaddleOCR provider initialized successfully (lang: {lang}, gpu: {use_gpu})")
            
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {e}")
            self.is_available = False
            self.ocr_engine = None
    
    def _extract_text(self, image_path: str, preprocessing_method: ProcessingMethod) -> Tuple[str, float, Dict[str, Any]]:
        """Extract text using PaddleOCR"""
        try:
            if not self.ocr_engine:
                raise Exception("PaddleOCR engine not initialized")
            
            # Run OCR
            result = self.ocr_engine.ocr(image_path, cls=True)
            
            if not result or not result[0]:
                return "", 0.0, {'message': 'No text detected'}
            
            # Extract text and confidence from results
            full_text = ""
            confidences = []
            word_count = 0
            line_count = 0
            
            for line in result[0]:
                if line:
                    # PaddleOCR returns [[[x1,y1],[x2,y2],[x3,y3],[x4,y4]], (text, confidence)]
                    bbox, (text, confidence) = line
                    full_text += text + " "
                    confidences.append(confidence)
                    word_count += len(text.split())
                    line_count += 1
            
            # Calculate average confidence
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            # PaddleOCR confidence adjustment (it tends to be optimistic)
            adjusted_confidence = min(0.90, avg_confidence * 0.95)  # Cap at 90% and slight reduction
            
            # Additional metadata
            additional_metadata = {
                'lines_detected': line_count,
                'words_detected': word_count,
                'avg_confidence': avg_confidence,
                'adjusted_confidence': adjusted_confidence,
                'preprocessing_method': preprocessing_method.value,
                'paddle_version': 'PaddleOCR 2.x',
                'language': self.config.get('lang', 'en')
            }
            
            return full_text.strip(), adjusted_confidence, additional_metadata
            
        except Exception as e:
            logger.error(f"PaddleOCR extraction failed: {e}")
            return f"PaddleOCR error: {str(e)}", 0.0, {'error': str(e)}
    
    def _extract_structured_data(self, text: str) -> StructuredData:
        """Extract structured data from PaddleOCR text"""
        structured_data = StructuredData()
        
        if not text:
            return structured_data
        
        # Use similar patterns as other providers
        import re
        
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
        """Get information about PaddleOCR provider"""
        return {
            'provider': self.provider_type.value,
            'available': self.is_available,
            'engine_initialized': self.ocr_engine is not None,
            'config': self.config,
            'features': [
                'multilingual_support',
                'text_detection',
                'text_recognition',
                'angle_classification',
                'open_source',
                'gpu_acceleration'
            ],
            'supported_languages': [
                'ch', 'en', 'fr', 'german', 'korean', 'japan',
                'chinese_cht', 'ta', 'te', 'ka', 'latin', 'arabic',
                'cyrillic', 'devanagari'
            ],
            'supported_formats': ['JPEG', 'PNG', 'BMP'],
            'version': 'PaddleOCR 2.x'
        }
