"""
Unified Document Processor - Main Orchestrator
Robust, cost-effective, and simple document processing pipeline
"""
import os
import logging
import time
import tempfile
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
from pathlib import Path
# from services.duplicate_detection_service import DuplicateDetectionService  # Disabled for Supabase migration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProcessingMode(Enum):
    COST_EFFECTIVE = "cost_effective"      # Default: GPT-4o-mini primary (renamed from cost_optimized)
    ACCURACY_FIRST = "accuracy_first"      # Claude primary
    SPEED_FIRST = "speed_first"           # Fastest available
    BUDGET_STRICT = "budget_strict"       # Cheapest options only

class DocumentType(Enum):
    INVOICE = "invoice"
    RECEIPT = "receipt"
    CONTRACT = "contract"
    DOCUMENT = "document"
    UNKNOWN = "unknown"

@dataclass
class ProcessingOptions:
    """Options for document processing"""
    mode: ProcessingMode = ProcessingMode.COST_EFFECTIVE
    max_cost_czk: float = 1.0  # Maximum cost per document in CZK
    min_confidence: float = 0.8  # Minimum acceptable confidence
    enable_fallbacks: bool = True
    store_in_db: bool = True
    return_raw_text: bool = False
    enable_ares_enrichment: bool = True  # Enable ARES company data enrichment
    user_id: Optional[str] = None  # User ID for document ownership

@dataclass
class ProcessingResult:
    """Unified result from document processing"""
    success: bool
    document_id: Optional[int]
    document_type: DocumentType
    structured_data: Dict[str, Any]
    raw_text: Optional[str]
    confidence: float
    processing_time: float
    cost_czk: float
    provider_used: str
    fallbacks_used: List[str]
    validation_notes: List[str]
    error_message: Optional[str] = None

class UnifiedDocumentProcessor:
    """
    Main orchestrator for document processing
    Provides simple, robust, and cost-effective document processing
    """
    
    def __init__(self):
        logger.info("🚀 Initializing Unified Document Processor...")

        # Initialize database components
        self._init_database()

        # Initialize components
        self._init_components()

        # Processing statistics
        self.stats = {
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
            "total_cost_czk": 0.0,
            "avg_processing_time": 0.0,
            "provider_usage": {},
            "fallback_usage": 0
        }

        # Duplicate detection service disabled for Supabase migration
        # self.duplicate_detector = DuplicateDetectionService()

        logger.info("✅ Unified Document Processor initialized")

    def _init_database(self):
        """Initialize Supabase database components"""
        try:
            # Only use Supabase services - no local database
            from services.supabase_client import get_supabase_client
            from models.supabase_models import Document

            self.supabase_client = get_supabase_client()
            self.Document = Document

            # Set legacy attributes to None since we're using Supabase only
            self.SessionLocal = None
            self.Base = None

            logger.info("✅ Supabase database components initialized")
        except Exception as e:
            logger.warning(f"⚠️ Supabase database components not available: {e}")
            self.supabase_client = None
            self.SessionLocal = None
            self.Base = None
            self.Document = None

    def _init_components(self):
        """Initialize all processing components"""
        try:
            # OCR Engine
            from ocr_manager import OCRManager
            self.ocr_manager = OCRManager()
            logger.info("✅ OCR Manager initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OCR Manager: {e}")
            self.ocr_manager = None
        
        try:
            # OpenRouter LLM Engine (SPEED-OPTIMIZED with Cache)
            from openrouter_llm_engine import OpenRouterLLMEngine
            self.llm_engine = OpenRouterLLMEngine()
            logger.info("✅ OpenRouter LLM Engine initialized (Speed-Optimized v3.0)")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenRouter LLM Engine: {e}")
            self.llm_engine = None

        # 🎯 Gemini Decision Engine (Optional - only for accuracy_first mode)
        self.gemini_engine = None
        gemini_enabled = os.getenv('ENABLE_GEMINI', 'false').lower() == 'true'

        if gemini_enabled:
            try:
                from gemini_decision_engine import GeminiDecisionEngine
                self.gemini_engine = GeminiDecisionEngine()
                logger.info("✅ Gemini Decision Engine initialized (optional)")
            except Exception as e:
                logger.warning(f"⚠️ Gemini Decision Engine not available: {e}")
                self.gemini_engine = None
        else:
            logger.info("ℹ️ Gemini Decision Engine disabled (set ENABLE_GEMINI=true to enable)")
        
        # Database components disabled for Supabase migration
        # Database operations now handled by document_service
        logger.info("ℹ️ Database components disabled (using Supabase services)")

        # 🏢 ARES Client for Czech company data enrichment
        try:
            from ares_client import ares_client
            self.ares_client = ares_client
            logger.info("✅ ARES Client initialized for company data enrichment")
        except Exception as e:
            logger.warning(f"⚠️ ARES Client not available: {e}")
            self.ares_client = None
    
    def process_document(self, file_path: str, filename: str, 
                        options: ProcessingOptions = None) -> ProcessingResult:
        """
        Main entry point for document processing
        Simple interface with robust error handling and fallbacks
        """
        start_time = time.time()
        
        if options is None:
            options = ProcessingOptions()
        
        logger.info(f"📄 Processing document: {filename} (mode: {options.mode.value})")
        
        try:
            # Step 1: Document Classification
            doc_type = self._classify_document(file_path, filename)
            logger.info(f"📋 Document classified as: {doc_type.value}")
            
            # Step 2: OCR Processing with fallback
            ocr_result = self._process_ocr(file_path, options)
            if not ocr_result["success"]:
                return self._create_error_result(
                    doc_type, start_time, "OCR processing failed", 
                    ocr_result.get("error", "Unknown OCR error")
                )
            
            # Step 3: LLM Processing with intelligent routing
            llm_result = self._process_llm(
                ocr_result["text"], filename, doc_type, options
            )
            
            # Step 4: Data Validation
            validated_data = self._validate_data(llm_result.extracted_data, doc_type)

            # Step 4.5: ARES Enrichment (Czech company data)
            enriched_data = self._enrich_with_ares(validated_data, options)

            # Step 5: Database Storage (if enabled)
            document_id = None
            storage_error = None
            if options.store_in_db:
                document_id, storage_error = self._store_in_database(
                    filename, ocr_result, llm_result, enriched_data, options
                )
                if document_id:
                    logger.info(f"💾 Document stored with ID: {document_id}")
                else:
                    logger.warning(f"⚠️ Failed to store document in database: {storage_error}")

            # Step 6: Update Statistics
            self._update_statistics(llm_result, time.time() - start_time)

            # Step 7: Build Result
            # If document storage failed, mark the overall result as failed
            overall_success = llm_result.success and (not options.store_in_db or document_id is not None)

            result = ProcessingResult(
                success=overall_success,
                document_id=document_id,
                document_type=doc_type,
                structured_data=enriched_data,
                raw_text=ocr_result["text"] if options.return_raw_text else None,
                confidence=llm_result.confidence_score,
                processing_time=time.time() - start_time,
                cost_czk=llm_result.cost_usd * 23.5,  # USD to CZK conversion (fixed)
                provider_used=f"ocr:{ocr_result['provider']}, llm:{llm_result.model_used}",
                fallbacks_used=ocr_result.get("fallbacks_used", []),
                validation_notes=llm_result.validation_notes,
                error_message=storage_error if storage_error else llm_result.error_message
            )
            
            logger.info(f"✅ Document processed successfully in {result.processing_time:.2f}s "
                       f"(cost: {result.cost_czk:.3f} Kč, confidence: {result.confidence:.2f})")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Document processing failed: {e}")
            return self._create_error_result(
                DocumentType.UNKNOWN, start_time, "Processing error", str(e)
            )
    
    def _classify_document(self, file_path: str, filename: str) -> DocumentType:
        """Classify document type for optimal processing"""
        filename_lower = filename.lower()
        
        # Simple classification based on filename
        if any(word in filename_lower for word in ['faktura', 'invoice', 'bill']):
            return DocumentType.INVOICE
        elif any(word in filename_lower for word in ['účtenka', 'receipt', 'pokladní']):
            return DocumentType.RECEIPT
        elif any(word in filename_lower for word in ['smlouva', 'contract', 'dohoda']):
            return DocumentType.CONTRACT
        else:
            return DocumentType.DOCUMENT
    
    def _process_ocr(self, file_path: str, options: ProcessingOptions) -> Dict[str, Any]:
        """Process OCR with fallback support"""
        if not self.ocr_manager:
            return {"success": False, "error": "OCR Manager not available"}
        
        try:
            # Primary OCR (Google Vision)
            result = self.ocr_manager.process_image_with_structuring(file_path, "invoice")
            
            if result.get("success", False):
                return {
                    "success": True,
                    "text": result.get("raw_text", ""),
                    "confidence": result.get("confidence", 0.0),
                    "provider": result.get("provider", "google_vision"),
                    "fallbacks_used": []
                }
            
            # Fallback to Tesseract if enabled
            if options.enable_fallbacks:
                logger.warning("⚠️ Google Vision failed, trying Tesseract fallback...")
                try:
                    import pytesseract
                    from PIL import Image
                    import pdf2image

                    # Convert PDF to image if needed
                    if file_path.lower().endswith('.pdf'):
                        pages = pdf2image.convert_from_path(file_path, first_page=1, last_page=1, dpi=200)
                        if pages:
                            # Use Tesseract on the image
                            text = pytesseract.image_to_string(pages[0], lang='ces+eng')
                            logger.info("✅ Tesseract fallback successful")
                            return {
                                "success": True,
                                "text": text,
                                "confidence": 0.7,  # Lower confidence for Tesseract
                                "provider": "tesseract",
                                "fallbacks_used": ["tesseract"]
                            }
                    else:
                        # Regular image file
                        image = Image.open(file_path)
                        text = pytesseract.image_to_string(image, lang='ces+eng')
                        logger.info("✅ Tesseract fallback successful")
                        return {
                            "success": True,
                            "text": text,
                            "confidence": 0.7,
                            "provider": "tesseract",
                            "fallbacks_used": ["tesseract"]
                        }
                except Exception as e:
                    logger.error(f"❌ Tesseract fallback failed: {e}")

                return {"success": False, "error": "All OCR methods failed"}
            
            return {"success": False, "error": result.get("error", "OCR failed")}
            
        except Exception as e:
            logger.error(f"❌ OCR processing error: {e}")
            return {"success": False, "error": str(e)}
    
    def _process_llm(self, text: str, filename: str, doc_type: DocumentType,
                    options: ProcessingOptions):
        """Process with appropriate AI engine based on processing mode"""

        logger.info(f"🔍 Processing mode: {options.mode} (type: {type(options.mode)})")
        logger.info(f"🔍 Comparing with ACCURACY_FIRST: {ProcessingMode.ACCURACY_FIRST} (type: {type(ProcessingMode.ACCURACY_FIRST)})")
        logger.info(f"🔍 Mode comparison result: {options.mode == ProcessingMode.ACCURACY_FIRST}")

        # Select AI engine based on processing mode
        if options.mode == ProcessingMode.ACCURACY_FIRST:
            logger.info("🎯 Selected: Gemini AI (accuracy_first mode)")
            return self._process_with_gemini(text, filename, doc_type, options)
        else:
            logger.info("🚀 Selected: OpenRouter LLM (cost-effective mode)")
            return self._process_with_openrouter(text, filename, doc_type, options)

    def _process_with_gemini(self, text: str, filename: str, doc_type: DocumentType,
                           options: ProcessingOptions):
        """Process with Gemini AI for highest accuracy"""
        if not self.gemini_engine or not self.gemini_engine.is_available:
            logger.warning("⚠️ Gemini engine not available, falling back to OpenRouter...")
            return self._process_with_openrouter(text, filename, doc_type, options)

        try:
            logger.info("🤖 Using Gemini AI for accuracy_first mode")

            # Use Gemini for data structuring
            gemini_result = self.gemini_engine.structure_and_validate_data(
                text, None, doc_type.value
            )

            # Convert Gemini result to standard LLM result format
            result = self._convert_gemini_to_llm_result(gemini_result)

            if result.success and result.confidence_score >= options.min_confidence:
                logger.info(f"✅ Gemini processing successful (confidence: {result.confidence_score:.2f})")
                return result
            elif result.success:
                logger.warning(f"⚠️ Gemini confidence ({result.confidence_score:.2f}) below minimum ({options.min_confidence})")
                if options.enable_fallbacks:
                    logger.info("🔄 Trying OpenRouter fallback...")
                    return self._process_with_openrouter(text, filename, doc_type, options)
                return result
            else:
                logger.error("❌ Gemini processing failed")
                if options.enable_fallbacks:
                    logger.info("🔄 Trying OpenRouter fallback...")
                    return self._process_with_openrouter(text, filename, doc_type, options)
                return self._basic_data_extraction(text, doc_type)

        except Exception as e:
            logger.error(f"❌ Gemini processing error: {e}")
            if options.enable_fallbacks:
                logger.info("🔄 Trying OpenRouter fallback...")
                return self._process_with_openrouter(text, filename, doc_type, options)
            return self._basic_data_extraction(text, doc_type)

    def _process_with_openrouter(self, text: str, filename: str, doc_type: DocumentType,
                               options: ProcessingOptions):
        """Process with OpenRouter LLM for cost-effective processing"""
        if not self.llm_engine:
            logger.warning("⚠️ OpenRouter engine not available, using regex fallback...")
            return self._basic_data_extraction(text, doc_type)

        try:
            logger.info("🚀 Using OpenRouter LLM for cost-effective processing")

            # 🧠 INTELLIGENT COMPLEXITY ASSESSMENT (auto-detection)
            # Let the LLM engine determine complexity automatically
            complexity = "auto"  # Engine will auto-detect based on content

            # Use OpenRouter LLM engine with intelligent processing
            result = self.llm_engine.structure_invoice_data(
                text,
                filename,
                complexity=complexity,
                max_cost_usd=options.max_cost_czk / 23.5  # Convert CZK to USD (allow powerful models)
            )

            # Check if result meets minimum confidence
            if result.confidence_score < options.min_confidence and options.enable_fallbacks:
                logger.warning(f"⚠️ OpenRouter confidence ({result.confidence_score:.2f}) below minimum ({options.min_confidence})")
                # OpenRouter engine already handles internal fallbacks

            return result

        except Exception as e:
            logger.error(f"❌ OpenRouter LLM processing error: {e}")
            return self._basic_data_extraction(text, doc_type)

    def _convert_gemini_to_llm_result(self, gemini_result):
        """Convert GeminiStructuredData to LLMResult format"""
        from openrouter_llm_engine import LLMResult

        return LLMResult(
            success=gemini_result.success,
            extracted_data=gemini_result.structured_data,  # Fixed: extracted_data not structured_data
            confidence_score=gemini_result.confidence_score,
            model_used="gemini_ai",  # Fixed: model_used not provider_used
            processing_time=gemini_result.processing_time,
            cost_usd=0.01,  # Fixed: cost_usd not cost_estimate
            reasoning=f"Gemini AI processing: {gemini_result.validation_notes}",
            validation_notes=[gemini_result.validation_notes] if isinstance(gemini_result.validation_notes, str) else gemini_result.validation_notes,
            error_message=gemini_result.error_message
        )

    def _basic_data_extraction(self, text: str, doc_type: DocumentType):
        """Basic regex-based data extraction as ultimate fallback"""
        from openrouter_llm_engine import LLMResult
        import re
        
        basic_data = {
            "document_type": doc_type.value,
            "extracted_at": datetime.now().isoformat(),
            "extraction_method": "regex_fallback"
        }
        
        # Basic regex patterns
        patterns = {
            "amount": r"(\d+[,.]?\d*)\s*(?:kč|czk|eur|usd)",
            "date": r"(\d{1,2}[./]\d{1,2}[./]\d{2,4})",
            "invoice_number": r"(?:faktura|invoice|č\.?)\s*:?\s*([A-Z0-9\-]+)",
            "ico": r"(?:ičo|ico|ič)\s*:?\s*(\d{8})",
            "dic": r"(?:dič|dic)\s*:?\s*(CZ\d{8,10})",
            "company_name": r"(?:název|firma|společnost)\s*:?\s*([^\n\r]+)"
        }
        
        for field, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                basic_data[field] = match.group(1)
        
        return LLMResult(
            success=True,
            extracted_data=basic_data,  # Fixed: extracted_data not structured_data
            confidence_score=0.6,  # Lower confidence for regex
            model_used="regex_fallback",  # Fixed: model_used not provider_used
            processing_time=0.1,
            cost_usd=0.0,  # Fixed: cost_usd not cost_estimate
            reasoning="Basic regex extraction used as fallback",
            validation_notes=["Low confidence - regex fallback used"]
        )

    def _validate_data(self, data: Dict[str, Any], doc_type: DocumentType) -> Dict[str, Any]:
        """Validate and clean extracted data"""
        if not data:
            return {}

        validated = data.copy()

        # Basic validation rules
        # Handle amount fields (can be objects or strings)
        amount_fields = ["amount", "total_amount", "subtotal", "tax_amount"]
        for field in amount_fields:
            if field in validated:
                try:
                    amount_value = validated[field]
                    if isinstance(amount_value, dict):
                        # Extract value from object
                        if "value" in amount_value:
                            amount_str = str(amount_value["value"]).replace(",", ".")
                        elif "amount" in amount_value:
                            amount_str = str(amount_value["amount"]).replace(",", ".")
                        else:
                            # Take first numeric value from dict
                            for v in amount_value.values():
                                if isinstance(v, (int, float, str)):
                                    amount_str = str(v).replace(",", ".")
                                    break
                            else:
                                amount_str = "0"
                    else:
                        amount_str = str(amount_value).replace(",", ".")

                    # Clean and convert to float
                    import re
                    amount_str = re.sub(r'[^\d.,]', '', amount_str)
                    amount_str = amount_str.replace(',', '.')
                    validated[field] = float(amount_str) if amount_str else None
                except (ValueError, TypeError, AttributeError):
                    validated[field] = None

        if "date" in validated:
            # Basic date format validation
            date_str = str(validated["date"])
            if not any(char.isdigit() for char in date_str):
                validated["date"] = None

        # Add validation timestamp
        validated["validated_at"] = datetime.now().isoformat()
        validated["document_type"] = doc_type.value

        return validated

    def _enrich_with_ares(self, data: Dict[str, Any], options: ProcessingOptions) -> Dict[str, Any]:
        """
        Obohacuje strukturovaná data o údaje z ARES na základě IČO
        Automaticky doplňuje chybějící údaje o dodavateli a odběrateli
        """
        if not data or not self.ares_client or not options.enable_ares_enrichment:
            if not options.enable_ares_enrichment:
                logger.debug("ℹ️ ARES enrichment disabled in options")
            return data

        enriched = data.copy()
        enrichment_notes = []

        try:
            # Obohacení údajů o dodavateli (vendor)
            if "vendor" in enriched and isinstance(enriched["vendor"], dict):
                original_vendor = enriched["vendor"].copy()
                enriched_vendor = self.ares_client.enrich_subject_data(enriched["vendor"])

                if enriched_vendor != original_vendor:
                    enriched["vendor"] = enriched_vendor
                    enrichment_notes.append(f"✅ Vendor data enriched from ARES (IČO: {enriched_vendor.get('ico', 'N/A')})")

                    # Log what was enriched
                    if enriched_vendor.get("name") and not original_vendor.get("name"):
                        logger.info(f"📝 Vendor name enriched: {enriched_vendor['name']}")
                    if enriched_vendor.get("dic") and not original_vendor.get("dic"):
                        logger.info(f"📝 Vendor DIČ enriched: {enriched_vendor['dic']}")
                    if enriched_vendor.get("address") and not original_vendor.get("address"):
                        logger.info(f"📝 Vendor address enriched: {enriched_vendor['address']}")

            # Obohacení údajů o odběrateli (customer)
            if "customer" in enriched and isinstance(enriched["customer"], dict):
                original_customer = enriched["customer"].copy()
                enriched_customer = self.ares_client.enrich_subject_data(enriched["customer"])

                if enriched_customer != original_customer:
                    enriched["customer"] = enriched_customer
                    enrichment_notes.append(f"✅ Customer data enriched from ARES (IČO: {enriched_customer.get('ico', 'N/A')})")

                    # Log what was enriched
                    if enriched_customer.get("name") and not original_customer.get("name"):
                        logger.info(f"📝 Customer name enriched: {enriched_customer['name']}")
                    if enriched_customer.get("dic") and not original_customer.get("dic"):
                        logger.info(f"📝 Customer DIČ enriched: {enriched_customer['dic']}")
                    if enriched_customer.get("address") and not original_customer.get("address"):
                        logger.info(f"📝 Customer address enriched: {enriched_customer['address']}")

            # Přidej metadata o obohacení
            if enrichment_notes:
                enriched["_ares_enrichment"] = {
                    "enriched_at": datetime.now().isoformat(),
                    "notes": enrichment_notes,
                    "success": True
                }
                logger.info(f"🏢 ARES enrichment completed: {len(enrichment_notes)} subjects enriched")
            else:
                logger.debug("ℹ️ No ARES enrichment needed (no IČO found or data already complete)")

        except Exception as e:
            logger.error(f"❌ ARES enrichment failed: {e}")
            # Add error metadata but don't fail the whole process
            enriched["_ares_enrichment"] = {
                "enriched_at": datetime.now().isoformat(),
                "error": str(e),
                "success": False
            }

        return enriched

    def _store_in_database(self, filename: str, ocr_result: Dict,
                          llm_result, validated_data: Dict, options: ProcessingOptions = None) -> tuple[Optional[int], Optional[str]]:
        """Store processing results in database using Supabase service

        Returns:
            tuple: (document_id, error_message) - document_id is None if failed
        """
        if not options or not options.user_id:
            error_msg = "Cannot store document: user_id is required"
            logger.warning(f"⚠️ {error_msg}")
            return None, error_msg

        try:
            # Import Supabase service for document creation
            from services.document_service import DocumentService
            from models.supabase_models import DocumentCreate
            import os

            # Detect file type from filename
            file_extension = os.path.splitext(filename)[1].lower()
            file_type_map = {
                '.pdf': 'application/pdf',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.bmp': 'image/bmp',
                '.tiff': 'image/tiff'
            }
            file_type = file_type_map.get(file_extension, 'application/octet-stream')

            # Create document data using Pydantic model
            document_data = DocumentCreate(
                filename=filename,
                original_filename=filename,
                file_type=file_type,
                processing_mode=options.mode.value if hasattr(options.mode, 'value') else 'accuracy_first',
                language='cs',
                document_type=validated_data.get('document_type', 'invoice'),
                tags=[],
                notes=None,
                file_path=None,  # Will be set by upload handler
                file_size=None,  # Will be set by upload handler
                file_hash=None   # Will be set by upload handler
            )

            # Create document service and store document synchronously
            import asyncio
            doc_service = DocumentService()

            # Run async operations in sync context using thread pool
            import concurrent.futures
            import threading

            def run_async_in_thread():
                """Run async operations in a separate thread with its own event loop"""
                try:
                    # Create new event loop for this thread
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                    try:
                        # Create document
                        logger.info(f"🔍 Creating document with data: {document_data}")
                        result = loop.run_until_complete(doc_service.create_document(str(options.user_id), document_data))
                        logger.info(f"🔍 Create document result: {result}")

                        if result.get('success') and result.get('data'):
                            # Extract document ID from the response
                            created_documents = result['data']
                            if isinstance(created_documents, list) and len(created_documents) > 0:
                                document_id = created_documents[0]['id']
                            elif isinstance(created_documents, dict):
                                document_id = created_documents['id']
                            else:
                                error_msg = f"Unexpected document creation response format: {created_documents}"
                                logger.error(f"❌ {error_msg}")
                                return None, error_msg

                            logger.info(f"💾 Document created in database with ID: {document_id}")

                            # Update document with processing results
                            update_data = {
                                'status': 'completed' if llm_result.success else 'failed',
                                'extracted_text': ocr_result.get("text", ""),
                                'structured_data': validated_data,
                                'confidence_score': llm_result.confidence_score,
                                'accuracy_percentage': llm_result.confidence_score * 100,
                                'ocr_provider': ocr_result.get('provider', 'unknown'),
                                'llm_model': llm_result.model_used,
                                'processing_cost': llm_result.cost_usd * 23.5,  # USD to CZK
                                'processing_time': llm_result.processing_time,
                                'processed_at': datetime.now().isoformat()
                            }

                            update_result = loop.run_until_complete(doc_service.update_document(document_id, str(options.user_id), update_data))

                            if update_result.get('success'):
                                logger.info(f"✅ Document {document_id} updated successfully")

                                # 🧠 INVOICE DIRECTION ANALYSIS
                                # Analyze invoice direction if this is an invoice
                                if validated_data.get('document_type') in ['invoice', 'faktura']:
                                    try:
                                        from services.invoice_direction_service import InvoiceDirectionService
                                        from uuid import UUID

                                        direction_service = InvoiceDirectionService()
                                        direction, confidence, method = loop.run_until_complete(
                                            direction_service.analyze_invoice_direction(
                                                UUID(str(options.user_id)),
                                                UUID(document_id),
                                                validated_data
                                            )
                                        )

                                        # Update document with direction information
                                        direction_update = {
                                            'invoice_direction': direction.value,
                                            'direction_confidence': float(confidence),
                                            'direction_method': 'automatic',
                                            'financial_category': 'revenue' if direction.value == 'outgoing' else 'expense' if direction.value == 'incoming' else 'unknown',
                                            'requires_manual_review': confidence < 0.8
                                        }

                                        direction_result = loop.run_until_complete(
                                            doc_service.update_document(document_id, str(options.user_id), direction_update)
                                        )

                                        if direction_result.get('success'):
                                            logger.info(f"🎯 Invoice direction detected: {direction.value} (confidence: {confidence})")

                                            # Create financial transaction
                                            transaction_id = loop.run_until_complete(
                                                direction_service.create_financial_transaction(
                                                    UUID(str(options.user_id)),
                                                    UUID(document_id),
                                                    validated_data,
                                                    direction
                                                )
                                            )

                                            if transaction_id:
                                                logger.info(f"💰 Financial transaction created: {transaction_id}")
                                        else:
                                            logger.warning("⚠️ Failed to update document with direction information")

                                    except Exception as direction_error:
                                        logger.error(f"❌ Invoice direction analysis failed: {direction_error}")
                                        # Don't fail the entire process if direction analysis fails
                                return document_id, None
                            else:
                                error_msg = f"Failed to update document: {update_result.get('error', 'Unknown error')}"
                                logger.error(f"❌ {error_msg}")
                                return None, error_msg
                        else:
                            error_msg = f"Failed to create document: {result.get('error', 'Unknown error')}"
                            logger.error(f"❌ {error_msg}")
                            return None, error_msg
                    finally:
                        loop.close()
                except Exception as e:
                    error_msg = f"Thread async operation failed: {str(e)}"
                    logger.error(f"❌ {error_msg}")
                    return None, error_msg

            # Execute in thread pool to avoid event loop conflicts
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(run_async_in_thread)
                try:
                    return future.result(timeout=30)  # 30 second timeout
                except concurrent.futures.TimeoutError:
                    error_msg = "Database operation timed out after 30 seconds"
                    logger.error(f"❌ {error_msg}")
                    return None, error_msg

        except Exception as e:
            error_msg = f"Database storage failed: {str(e)}"
            logger.error(f"❌ {error_msg}")
            logger.error(f"❌ Exception type: {type(e)}")
            logger.error(f"❌ Exception details: {repr(e)}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return None, error_msg



    def _update_statistics(self, llm_result, processing_time: float):
        """Update processing statistics"""
        self.stats["total_processed"] += 1

        if llm_result.success:
            self.stats["successful"] += 1
        else:
            self.stats["failed"] += 1

        self.stats["total_cost_czk"] += llm_result.cost_usd * 23.5  # Fixed: cost_usd not cost_estimate

        # Update average processing time
        total_time = self.stats["avg_processing_time"] * (self.stats["total_processed"] - 1)
        self.stats["avg_processing_time"] = (total_time + processing_time) / self.stats["total_processed"]

        # Update provider usage
        provider = llm_result.model_used  # Fixed: model_used not provider_used
        self.stats["provider_usage"][provider] = self.stats["provider_usage"].get(provider, 0) + 1

    def _create_error_result(self, doc_type: DocumentType, start_time: float,
                           error_type: str, error_message: str) -> ProcessingResult:
        """Create error result with consistent format"""
        return ProcessingResult(
            success=False,
            document_id=None,
            document_type=doc_type,
            structured_data={},
            raw_text=None,
            confidence=0.0,
            processing_time=time.time() - start_time,
            cost_czk=0.0,
            provider_used="none",
            fallbacks_used=[],
            validation_notes=[],
            error_message=f"{error_type}: {error_message}"
        )

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive processing statistics"""
        success_rate = (
            (self.stats["successful"] / self.stats["total_processed"] * 100)
            if self.stats["total_processed"] > 0 else 0
        )

        avg_cost = (
            self.stats["total_cost_czk"] / self.stats["total_processed"]
            if self.stats["total_processed"] > 0 else 0
        )

        return {
            "processing_stats": {
                "total_processed": self.stats["total_processed"],
                "successful": self.stats["successful"],
                "failed": self.stats["failed"],
                "success_rate_percent": round(success_rate, 1)
            },
            "cost_stats": {
                "total_cost_czk": round(self.stats["total_cost_czk"], 3),
                "average_cost_per_document": round(avg_cost, 3),
                "estimated_monthly_cost": round(avg_cost * 1000, 2)  # Estimate for 1000 docs/month
            },
            "performance_stats": {
                "average_processing_time": round(self.stats["avg_processing_time"], 2),
                "provider_usage": self.stats["provider_usage"],
                "fallback_usage": self.stats["fallback_usage"]
            }
        }

    def get_system_status(self) -> Dict[str, Any]:
        """Get system status and health"""
        return {
            "system_ready": all([
                self.ocr_manager is not None,
                self.llm_engine is not None
            ]),
            "components": {
                "ocr_manager": self.ocr_manager is not None,
                "llm_engine": self.llm_engine is not None,
                "database": self.supabase_client is not None
            },
            "capabilities": {
                "supported_formats": [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff"],
                "processing_modes": [mode.value for mode in ProcessingMode],
                "document_types": [doc_type.value for doc_type in DocumentType]
            },
            "statistics": self.get_statistics()
        }
