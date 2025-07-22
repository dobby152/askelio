"""
Invoice Processor - Coordinates OCR and AI decision making for invoice/receipt processing
Sequential processing through the entire pipeline
"""
import os
import logging
import tempfile
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import time
from PIL import Image
import pdf2image
from pathlib import Path

from ocr_manager import OCRManager, OCRResult
from gemini_decision_engine import GeminiDecisionEngine, GeminiDecision, GeminiStructuredData

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class InvoiceProcessingResult:
    """Complete result from invoice processing"""
    success: bool
    file_name: str
    extracted_text: str
    confidence: float
    selected_provider: str
    processing_time: float
    
    # Detailed results
    ocr_results: List[OCRResult]
    ai_decision: GeminiDecision
    
    # Structured invoice data
    structured_data: Dict[str, any]
    gemini_structured_data: Optional[GeminiStructuredData] = None
    basic_structured_data: Optional[Dict[str, any]] = None

    # Error information
    error_message: Optional[str] = None

class InvoiceProcessor:
    """
    Main processor for invoice/receipt documents
    Coordinates OCR processing and AI decision making sequentially
    """
    
    def __init__(self):
        logger.info("Initializing Invoice Processor...")
        
        # Initialize OCR Manager
        self.ocr_manager = OCRManager()
        
        # Initialize Gemini Decision Engine
        self.gemini_engine = GeminiDecisionEngine()
        
        # Supported file types
        self.supported_image_types = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif']
        self.supported_pdf_types = ['.pdf']
        self.supported_types = self.supported_image_types + self.supported_pdf_types
        
        logger.info(f"Invoice Processor initialized with {len(self.ocr_manager.get_available_providers())} OCR providers")
        logger.info(f"Gemini AI available: {self.gemini_engine.is_available}")
    
    def process_invoice(self, file_path: str, file_name: str) -> InvoiceProcessingResult:
        """
        Process invoice/receipt document through complete pipeline
        Sequential processing: Validation → OCR → AI Decision → Structuring
        """
        start_time = time.time()
        logger.info(f"Starting invoice processing for: {file_name}")
        
        try:
            # Step 1: File validation
            logger.info("Step 1: File validation")
            validation_result = self._validate_file(file_path, file_name)
            if not validation_result["valid"]:
                return InvoiceProcessingResult(
                    success=False,
                    file_name=file_name,
                    extracted_text="",
                    confidence=0.0,
                    selected_provider="none",
                    processing_time=time.time() - start_time,
                    ocr_results=[],
                    ai_decision=GeminiDecision(
                        selected_provider="none",
                        confidence_score=0.0,
                        reasoning="File validation failed",
                        quality_analysis={},
                        text_result="",
                        processing_time=0.0,
                        success=False,
                        error_message=validation_result["error"]
                    ),
                    structured_data={},
                    error_message=validation_result["error"]
                )
            
            # Step 2: Convert to image if needed
            logger.info("Step 2: File conversion")
            image_path = self._prepare_image(file_path, file_name)
            
            # Step 3: Simplified OCR processing with immediate structuring
            logger.info("Step 3: Google Vision OCR + Gemini structuring")
            processing_result = self.ocr_manager.process_image_with_structuring(image_path, "invoice")

            if not processing_result["success"]:
                return InvoiceProcessingResult(
                    success=False,
                    file_name=file_name,
                    extracted_text="",
                    confidence=0.0,
                    selected_provider="google_vision",
                    processing_time=time.time() - start_time,
                    ocr_results=[],
                    ai_decision=GeminiDecision(
                        selected_provider="google_vision",
                        confidence_score=0.0,
                        reasoning="OCR processing failed",
                        quality_analysis={},
                        text_result="",
                        processing_time=0.0,
                        success=False,
                        error_message=processing_result.get("error", "Unknown error")
                    ),
                    structured_data={},
                    error_message=processing_result.get("error", "OCR processing failed")
                )

            # Data is already structured by Gemini in the OCR step
            logger.info("Step 4: Data already structured by Gemini")
            structured_data = processing_result.get("structured_data", {})

            # Create a mock AI decision for compatibility
            ai_decision = GeminiDecision(
                selected_provider="google_vision",
                confidence_score=processing_result.get("structuring_confidence", processing_result["confidence"]),
                reasoning="Simplified processing with Google Vision + Gemini",
                quality_analysis={"google_vision": processing_result["confidence"]},
                text_result=processing_result["raw_text"],
                processing_time=processing_result["processing_time"],
                success=True
            )

            # Clean up temporary files
            if image_path != file_path and os.path.exists(image_path):
                os.remove(image_path)

            total_time = time.time() - start_time
            logger.info(f"Simplified invoice processing completed in {total_time:.2f}s")

            # Create a single OCR result for compatibility
            ocr_result = OCRResult(
                provider="google_vision",
                text=processing_result["raw_text"],
                confidence=processing_result["confidence"],
                processing_time=processing_result["processing_time"],
                success=processing_result["success"]
            )

            return InvoiceProcessingResult(
                success=ai_decision.success,
                file_name=file_name,
                extracted_text=ai_decision.text_result,
                confidence=ai_decision.confidence_score,
                selected_provider=ai_decision.selected_provider,
                processing_time=total_time,
                ocr_results=[ocr_result],
                ai_decision=ai_decision,
                structured_data=structured_data,
                gemini_structured_data=None,
                basic_structured_data=None
            )
            
        except Exception as e:
            logger.error(f"Error processing invoice {file_name}: {e}")
            return InvoiceProcessingResult(
                success=False,
                file_name=file_name,
                extracted_text="",
                confidence=0.0,
                selected_provider="none",
                processing_time=time.time() - start_time,
                ocr_results=[],
                ai_decision=GeminiDecision(
                    selected_provider="none",
                    confidence_score=0.0,
                    reasoning="Processing error",
                    quality_analysis={},
                    text_result="",
                    processing_time=0.0,
                    success=False,
                    error_message=str(e)
                ),
                structured_data={},
                error_message=str(e)
            )
    
    def _validate_file(self, file_path: str, file_name: str) -> Dict[str, any]:
        """Validate file type and accessibility"""
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                return {"valid": False, "error": "File does not exist"}
            
            # Check file extension
            file_ext = Path(file_name).suffix.lower()
            if file_ext not in self.supported_types:
                return {"valid": False, "error": f"Unsupported file type: {file_ext}"}
            
            # Check file size (max 50MB)
            file_size = os.path.getsize(file_path)
            if file_size > 50 * 1024 * 1024:
                return {"valid": False, "error": "File too large (max 50MB)"}
            
            # Try to open the file
            if file_ext in self.supported_image_types:
                Image.open(file_path).verify()
            elif file_ext == '.pdf':
                # Basic PDF validation - try to convert first page
                pdf2image.convert_from_path(file_path, first_page=1, last_page=1)
            
            return {"valid": True, "error": None}
            
        except Exception as e:
            return {"valid": False, "error": f"File validation error: {str(e)}"}
    
    def _prepare_image(self, file_path: str, file_name: str) -> str:
        """Convert file to image format if needed"""
        file_ext = Path(file_name).suffix.lower()
        
        if file_ext in self.supported_image_types:
            # Already an image
            return file_path
        
        elif file_ext == '.pdf':
            # Convert PDF to image
            logger.info("Converting PDF to image...")
            
            # Convert first page of PDF to image
            images = pdf2image.convert_from_path(file_path, first_page=1, last_page=1, dpi=300)
            
            if not images:
                raise Exception("Failed to convert PDF to image")
            
            # Save as temporary image
            temp_image_path = tempfile.mktemp(suffix='.png')
            images[0].save(temp_image_path, 'PNG')
            
            logger.info(f"PDF converted to image: {temp_image_path}")
            return temp_image_path
        
        else:
            raise Exception(f"Unsupported file type: {file_ext}")
    
    def _structure_invoice_data(self, text: str) -> Dict[str, any]:
        """
        Structure extracted text into invoice-specific fields
        Basic extraction of common invoice fields
        """
        import re
        from datetime import datetime
        
        structured = {
            "raw_text": text,
            "extraction_timestamp": datetime.now().isoformat(),
            "fields": {}
        }
        
        # Extract common invoice fields using regex patterns
        patterns = {
            "invoice_number": [
                r"invoice\s*#?\s*:?\s*([A-Z0-9\-]+)",
                r"faktura\s*č\.\s*:?\s*([A-Z0-9\-]+)",
                r"číslo\s*faktury\s*:?\s*([A-Z0-9\-]+)"
            ],
            "date": [
                r"date\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
                r"datum\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})"
            ],
            "total_amount": [
                r"total\s*:?\s*([0-9,]+\.?\d*)",
                r"celkem\s*:?\s*([0-9,]+\.?\d*)",
                r"k\s*úhradě\s*:?\s*([0-9,]+\.?\d*)"
            ],
            "vendor": [
                r"from\s*:?\s*([^\n]+)",
                r"dodavatel\s*:?\s*([^\n]+)"
            ]
        }
        
        # Extract fields
        for field_name, field_patterns in patterns.items():
            for pattern in field_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    structured["fields"][field_name] = match.group(1).strip()
                    break
        
        # Calculate confidence based on how many fields were extracted
        total_fields = len(patterns)
        extracted_fields = len(structured["fields"])
        structured["extraction_confidence"] = extracted_fields / total_fields
        
        return structured
    
    def get_system_status(self) -> Dict[str, any]:
        """Get status of the entire invoice processing system"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔍 DEBUG get_system_status: gemini_engine instance: {id(self.gemini_engine)}")
        logger.info(f"🔍 DEBUG get_system_status: gemini_engine.is_available: {self.gemini_engine.is_available}")
        gemini_status = self.gemini_engine.get_status()
        logger.info(f"🔍 DEBUG get_system_status: gemini_status: {gemini_status}")
        return {
            "ocr_manager": {
                "available_providers": self.ocr_manager.get_available_providers(),
                "provider_status": self.ocr_manager.get_provider_status()
            },
            "gemini_engine": gemini_status,
            "supported_file_types": self.supported_types,
            "system_ready": len(self.ocr_manager.get_available_providers()) > 0
        }
    
    def test_system(self) -> Dict[str, any]:
        """Test the entire system"""
        status = self.get_system_status()
        
        # Test Gemini connection if available
        gemini_test = None
        if self.gemini_engine.is_available:
            gemini_test = self.gemini_engine.test_connection()
        
        return {
            "system_status": status,
            "gemini_test": gemini_test,
            "ready_for_processing": status["system_ready"]
        }
