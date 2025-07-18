"""
Azure Computer Vision OCR Provider for multilayer OCR system
"""
import io
import os
import time
import logging
from typing import Dict, Any, Tuple, Optional

try:
    from azure.cognitiveservices.vision.computervision import ComputerVisionClient
    from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
    from msrest.authentication import CognitiveServicesCredentials
    AZURE_VISION_AVAILABLE = True
except ImportError:
    AZURE_VISION_AVAILABLE = False

from ..core.ocr_provider_base import OCRProviderBase
from ..core.ocr_result import OCRProviderType, ProcessingMethod, StructuredData

logger = logging.getLogger(__name__)


class AzureComputerVisionProvider(OCRProviderBase):
    """Azure Computer Vision OCR provider"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.client = None
        super().__init__(OCRProviderType.AZURE_COMPUTER_VISION, config)
    
    def _initialize(self) -> None:
        """Initialize Azure Computer Vision provider"""
        if not AZURE_VISION_AVAILABLE:
            logger.error("Azure Computer Vision library not available")
            self.is_available = False
            return
        
        try:
            # Get credentials from config or environment
            subscription_key = self.config.get('subscription_key') or os.getenv('AZURE_COMPUTER_VISION_SUBSCRIPTION_KEY')
            endpoint = self.config.get('endpoint') or os.getenv('AZURE_COMPUTER_VISION_ENDPOINT')
            
            if not subscription_key:
                logger.error("Azure Computer Vision subscription key not found")
                self.is_available = False
                return
            
            if not endpoint:
                logger.error("Azure Computer Vision endpoint not found")
                self.is_available = False
                return
            
            # Initialize client
            credentials = CognitiveServicesCredentials(subscription_key)
            self.client = ComputerVisionClient(endpoint, credentials)
            
            # Test the client (optional - you might want to skip this to avoid API calls)
            self._test_client()
            self.is_available = True
            logger.info("Azure Computer Vision provider initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Azure Computer Vision: {e}")
            self.is_available = False
            self.client = None
    
    def _test_client(self) -> None:
        """Test Azure Computer Vision client"""
        # Skip actual test to avoid unnecessary API calls
        # In production, you might want to test with a small image
        pass
    
    def _extract_text(self, image_path: str, preprocessing_method: ProcessingMethod) -> Tuple[str, float, Dict[str, Any]]:
        """Extract text using Azure Computer Vision Read API"""
        try:
            if not self.client:
                raise Exception("Azure Computer Vision client not initialized")
            
            # Read image file
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
            
            # Call the Read API
            read_response = self.client.read_in_stream(
                io.BytesIO(image_data),
                raw=True
            )
            
            # Get operation ID from response headers
            operation_id = read_response.headers["Operation-Location"].split("/")[-1]
            
            # Wait for the operation to complete
            max_wait_time = 30  # seconds
            wait_interval = 1   # seconds
            total_wait = 0
            
            while total_wait < max_wait_time:
                read_result = self.client.get_read_result(operation_id)
                
                if read_result.status not in ['notStarted', 'running']:
                    break
                
                time.sleep(wait_interval)
                total_wait += wait_interval
            
            if read_result.status == OperationStatusCodes.failed:
                raise Exception("Azure Computer Vision Read operation failed")
            
            # Extract text from results
            full_text = ""
            word_confidences = []
            line_count = 0
            word_count = 0
            
            if read_result.analyze_result and read_result.analyze_result.read_results:
                for read_result_page in read_result.analyze_result.read_results:
                    for line in read_result_page.lines:
                        full_text += line.text + "\n"
                        line_count += 1
                        
                        # Extract word-level confidence if available
                        if hasattr(line, 'words') and line.words:
                            for word in line.words:
                                word_count += 1
                                if hasattr(word, 'confidence') and word.confidence is not None:
                                    word_confidences.append(word.confidence)
            
            # Calculate confidence
            if word_confidences:
                avg_confidence = sum(word_confidences) / len(word_confidences)
            else:
                # Azure Read API typically has high accuracy
                avg_confidence = 0.90
            
            # Additional metadata
            additional_metadata = {
                'operation_id': operation_id,
                'pages': len(read_result.analyze_result.read_results) if read_result.analyze_result else 0,
                'lines': line_count,
                'words': word_count,
                'avg_word_confidence': avg_confidence,
                'preprocessing_method': preprocessing_method.value,
                'api_version': 'Read 3.2'
            }
            
            return full_text.strip(), avg_confidence, additional_metadata
            
        except Exception as e:
            logger.error(f"Azure Computer Vision extraction failed: {e}")
            return f"Azure Computer Vision error: {str(e)}", 0.0, {'error': str(e)}
    
    def _extract_structured_data(self, text: str) -> StructuredData:
        """Extract structured data from Azure Computer Vision text"""
        structured_data = StructuredData()
        
        if not text:
            return structured_data
        
        # Use similar patterns as other providers but optimized for Azure's clean output
        import re
        
        # Document type detection
        text_lower = text.lower()
        if any(word in text_lower for word in ['faktura', 'invoice']):
            structured_data.document_type = 'faktura'
        elif any(word in text_lower for word in ['účtenka', 'receipt']):
            structured_data.document_type = 'uctenka'
        elif any(word in text_lower for word in ['smlouva', 'contract']):
            structured_data.document_type = 'smlouva'
        
        # Vendor extraction (Azure typically provides very clean text)
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
        """Get information about Azure Computer Vision provider"""
        return {
            'provider': self.provider_type.value,
            'available': self.is_available,
            'client_initialized': self.client is not None,
            'config': {k: v for k, v in self.config.items() if 'key' not in k.lower()},
            'features': [
                'read_api',
                'high_accuracy_ocr',
                'multi_language_support',
                'confidence_scoring',
                'async_processing'
            ],
            'supported_formats': ['JPEG', 'PNG', 'BMP', 'PDF', 'TIFF'],
            'api_version': 'Read 3.2'
        }
