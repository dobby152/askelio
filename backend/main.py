# Clean FastAPI main application for Invoice/Receipt Processing
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi import Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import uvicorn
import os
import tempfile
import time
import logging
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Configure logging
logger = logging.getLogger(__name__)

from invoice_processor import InvoiceProcessor
from database_sqlite import get_db, init_db
from models_sqlite import Document, ExtractedField
from cost_effective_llm_engine import CostEffectiveLLMEngine
from unified_document_processor import UnifiedDocumentProcessor, ProcessingOptions, ProcessingMode

# Load environment variables
load_dotenv()

# Initialize Invoice Processor (handles OCR sources + Cost-Effective LLM)
invoice_processor = InvoiceProcessor()

# Initialize Cost-Effective LLM Engine (GPT-4o-mini + Claude hybrid)
cost_effective_llm = CostEffectiveLLMEngine()

# Initialize Unified Document Processor (Main Orchestrator)
unified_processor = UnifiedDocumentProcessor()

# Initialize SQLite database
init_db()

# Demo data initialization removed - ready for production use



# Initialize Clean FastAPI app
app = FastAPI(
    title="Askelio Invoice Processing API",
    description="Clean API for invoice/receipt processing with 5 OCR sources + Gemini AI",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3003", "http://127.0.0.1:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Askelio Invoice Processing API v2.1.0",
        "description": "Cost-Effective API with OCR + Hybrid LLM (GPT-4o-mini + Claude)",
        "endpoints": {
            "POST /api/v1/documents/process": "🎯 NEW: Unified document processing endpoint",
            "POST /process-invoice": "Legacy: Invoice processing",
            "GET /health": "Health check",
            "GET /api/v1/system/status": "🎯 NEW: Comprehensive system status"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.1.0"}

@app.post("/api/v1/documents/process")
async def process_document_unified(
    file: UploadFile = File(...),
    mode: str = "cost_optimized",
    max_cost_czk: float = 1.0,
    min_confidence: float = 0.8,
    enable_fallbacks: bool = True,
    return_raw_text: bool = False
):
    """
    🎯 UNIFIED DOCUMENT PROCESSING ENDPOINT

    Simple, robust, and cost-effective document processing with intelligent routing.

    Parameters:
    - mode: cost_optimized (default), accuracy_first, speed_first, budget_strict
    - max_cost_czk: Maximum cost per document in CZK (default: 1.0)
    - min_confidence: Minimum acceptable confidence (default: 0.8)
    - enable_fallbacks: Enable fallback providers (default: true)
    - return_raw_text: Include raw OCR text in response (default: false)

    Returns consistent format:
    {
        "success": boolean,
        "data": {...},
        "meta": {...},
        "error": null | {...}
    }
    """

    if not file.filename:
        return {
            "success": False,
            "data": None,
            "meta": {"processing_time": 0.0, "cost_czk": 0.0},
            "error": {"code": "NO_FILE", "message": "No file provided"}
        }

    # Validate file type
    allowed_types = [
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "image/gif", "image/bmp", "image/tiff"
    ]

    if file.content_type not in allowed_types:
        return {
            "success": False,
            "data": None,
            "meta": {"processing_time": 0.0, "cost_czk": 0.0},
            "error": {
                "code": "UNSUPPORTED_FILE_TYPE",
                "message": f"Unsupported file type: {file.content_type}",
                "supported_types": allowed_types
            }
        }

    # Validate file size (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        return {
            "success": False,
            "data": None,
            "meta": {"processing_time": 0.0, "cost_czk": 0.0},
            "error": {
                "code": "FILE_TOO_LARGE",
                "message": "File too large (max 10MB)",
                "file_size_mb": round(file.size / (1024*1024), 2)
            }
        }

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Parse processing mode
        try:
            processing_mode = ProcessingMode(mode)
        except ValueError:
            processing_mode = ProcessingMode.COST_OPTIMIZED

        # Create processing options
        options = ProcessingOptions(
            mode=processing_mode,
            max_cost_czk=max_cost_czk,
            min_confidence=min_confidence,
            enable_fallbacks=enable_fallbacks,
            store_in_db=True,
            return_raw_text=return_raw_text
        )

        # Process document with unified processor
        result = unified_processor.process_document(temp_file_path, file.filename, options)

        # Clean up temp file
        os.unlink(temp_file_path)

        # Build consistent response
        if result.success:
            response_data = {
                "document_id": result.document_id,
                "document_type": result.document_type.value,
                "structured_data": result.structured_data,
                "confidence": result.confidence
            }

            if return_raw_text:
                response_data["raw_text"] = result.raw_text

            return {
                "success": True,
                "data": response_data,
                "meta": {
                    "processing_time": result.processing_time,
                    "cost_czk": result.cost_czk,
                    "provider_used": result.provider_used,
                    "fallbacks_used": result.fallbacks_used,
                    "validation_notes": result.validation_notes
                },
                "error": None
            }
        else:
            return {
                "success": False,
                "data": None,
                "meta": {
                    "processing_time": result.processing_time,
                    "cost_czk": result.cost_czk,
                    "provider_used": result.provider_used,
                    "fallbacks_used": result.fallbacks_used
                },
                "error": {
                    "code": "PROCESSING_FAILED",
                    "message": result.error_message or "Document processing failed"
                }
            }

    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

        logger.error(f"❌ Unified processing error: {e}")
        return {
            "success": False,
            "data": None,
            "meta": {"processing_time": 0.0, "cost_czk": 0.0},
            "error": {
                "code": "INTERNAL_ERROR",
                "message": f"Internal processing error: {str(e)}"
            }
        }

@app.post("/process-invoice")
async def process_invoice(file: UploadFile = File(...)):
    """
    Main endpoint for invoice/receipt processing
    Sequential processing through 5 OCR sources + Gemini AI decision making
    """
    # Validate file type
    allowed_types = [
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "image/gif", "image/bmp", "image/tiff"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Supported types: {', '.join(allowed_types)}"
        )

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Process invoice through complete pipeline
        result = invoice_processor.process_invoice(temp_file_path, file.filename)

        return {
            "status": "success" if result.success else "error",
            "file_name": result.file_name,
            "processing_time": result.processing_time,

            # Main results
            "extracted_text": result.extracted_text[:1000] + "..." if len(result.extracted_text) > 1000 else result.extracted_text,
            "confidence": result.confidence,
            "selected_provider": result.selected_provider,

            # AI Decision details
            "ai_decision": {
                "reasoning": result.ai_decision.reasoning,
                "quality_analysis": result.ai_decision.quality_analysis,
                "gemini_used": result.ai_decision.success
            },

            # OCR Results summary
            "ocr_summary": {
                "total_providers_used": len(result.ocr_results),
                "successful_providers": len([r for r in result.ocr_results if r.success]),
                "provider_results": [
                    {
                        "provider": r.provider,
                        "success": r.success,
                        "confidence": r.confidence,
                        "text_length": len(r.text) if r.success else 0,
                        "processing_time": r.processing_time
                    }
                    for r in result.ocr_results
                ]
            },

            # Primary structured data (Gemini if available, otherwise basic)
            "structured_data": result.gemini_structured_data.structured_data if (result.gemini_structured_data and result.gemini_structured_data.success) else result.basic_structured_data,

            # Data source information
            "data_source": {
                "method": "gemini" if (result.gemini_structured_data and result.gemini_structured_data.success) else "basic",
                "gemini_used": result.gemini_structured_data.success if result.gemini_structured_data else False,
                "gemini_confidence": result.gemini_structured_data.confidence_score if result.gemini_structured_data else None,
                "basic_confidence": result.basic_structured_data.get("extraction_confidence", 0.0) if result.basic_structured_data else None
            },

            # Enhanced Gemini structuring details
            "gemini_analysis": {
                "success": result.gemini_structured_data.success if result.gemini_structured_data else False,
                "confidence": result.gemini_structured_data.confidence_score if result.gemini_structured_data else None,
                "validation_notes": result.gemini_structured_data.validation_notes if result.gemini_structured_data else None,
                "fields_extracted": result.gemini_structured_data.fields_extracted if result.gemini_structured_data else [],
                "processing_time": result.gemini_structured_data.processing_time if result.gemini_structured_data else None,
                "comparison_with_basic": result.gemini_structured_data.comparison_with_basic if result.gemini_structured_data else None,
                "error_message": result.gemini_structured_data.error_message if result.gemini_structured_data else None
            },

            # Error information
            "error_message": result.error_message
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Processing failed: {str(e)}",
            "file_name": file.filename
        }
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/system-status")
async def system_status():
    """Get status of the entire invoice processing system"""
    try:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔍 DEBUG: invoice_processor instance: {id(invoice_processor)}")
        logger.info(f"🔍 DEBUG: gemini_engine instance: {id(invoice_processor.gemini_engine)}")
        logger.info(f"🔍 DEBUG: gemini_engine.is_available: {invoice_processor.gemini_engine.is_available}")
        status = invoice_processor.get_system_status()
        logger.info(f"🔍 DEBUG: status gemini_engine: {status['gemini_engine']}")
        return {
            "status": "success",
            "system_ready": status["system_ready"],
            "ocr_providers": {
                "available": status["ocr_manager"]["available_providers"],
                "total_available": len(status["ocr_manager"]["available_providers"]),
                "provider_status": status["ocr_manager"]["provider_status"]
            },
            "gemini_ai": status["gemini_engine"],
            "supported_file_types": status["supported_file_types"],
            "message": f"System ready with {len(status['ocr_manager']['available_providers'])} OCR providers"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to get system status: {str(e)}",
            "system_ready": False
        }


@app.get("/test-system")
async def test_system():
    """Test the entire invoice processing system"""
    try:
        test_result = invoice_processor.test_system()
        return {
            "status": "success",
            "test_results": test_result,
            "message": "System test completed"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"System test failed: {str(e)}"
        }

# Additional endpoints for frontend integration

@app.get("/documents")
async def get_documents(db: Session = Depends(get_db)):
    """Get list of processed documents"""
    # Get documents from database, sorted by newest first
    documents = db.query(Document).order_by(Document.created_at.desc()).all()

    # Convert to dict format for frontend compatibility
    result = []
    for doc in documents:
        result.append({
            "id": doc.id,
            "filename": doc.filename,
            "file_name": doc.filename,  # For compatibility
            "status": doc.status,
            "type": doc.type,
            "size": doc.size,
            "pages": doc.pages,
            "accuracy": doc.accuracy,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "processed_at": doc.processed_at.isoformat() if doc.processed_at else None,
            "processing_time": doc.processing_time,
            "confidence": doc.confidence,
            "extracted_text": doc.extracted_text,
            "provider_used": doc.provider_used,
            "data_source": doc.data_source
        })

    print(f"📄 Returning {len(result)} documents from database:")
    for doc in result:
        print(f"  - {doc['id']}: {doc['filename']} ({doc['status']})")
    return result

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload and process document with fast OCR (Google Vision only for speed)"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    allowed_types = [
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "image/gif", "image/bmp", "image/tiff"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Supported: {', '.join(allowed_types)}"
        )

    # Validate file size (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large (max 10MB)"
        )

    # Save file temporarily and process
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Process with complete pipeline (OCR + Gemini structuring)
        result = invoice_processor.process_invoice(temp_file_path, file.filename)

        # Clean up temp file
        os.unlink(temp_file_path)

        # Extract Gemini structured data if available
        structured_data = result.gemini_structured_data.structured_data if (result.gemini_structured_data and result.gemini_structured_data.success) else result.basic_structured_data
        data_source = "gemini" if (result.gemini_structured_data and result.gemini_structured_data.success) else "basic"

        # Create document record in database
        document = Document(
            filename=file.filename,
            status="completed" if result.success else "failed",
            type=file.content_type,
            size=f"{file.size / (1024*1024):.1f} MB" if file.size else "0 MB",
            pages=1,
            accuracy=f"{result.confidence * 100:.1f}%" if result.success else "0%",
            processed_at=datetime.now(),
            processing_time=result.processing_time,
            confidence=result.confidence,
            extracted_text=result.extracted_text if result.success else "",
            provider_used=result.selected_provider,
            data_source=data_source
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        # Store extracted fields in database
        if structured_data and isinstance(structured_data, dict):
            for field_name, field_value in structured_data.items():
                if field_value is not None:
                    extracted_field = ExtractedField(
                        document_id=document.id,
                        field_name=field_name,
                        field_value=str(field_value),
                        confidence=result.confidence,
                        data_type=type(field_value).__name__
                    )
                    db.add(extracted_field)
            db.commit()

        if result.success:
            return {
                "status": "success",
                "id": document.id,
                "file_name": file.filename,
                "processing_time": result.processing_time,
                "confidence": result.confidence,
                "extracted_text": result.extracted_text[:500] + "..." if len(result.extracted_text) > 500 else result.extracted_text,
                "provider_used": result.selected_provider,

                # Primary structured data (Gemini if available)
                "structured_data": structured_data,

                # Data source information
                "data_source": {
                    "method": data_source,
                    "gemini_used": result.gemini_structured_data.success if result.gemini_structured_data else False,
                    "gemini_confidence": result.gemini_structured_data.confidence_score if result.gemini_structured_data else None
                },

                "message": f"Document processed successfully using {data_source} structuring"
            }
        else:
            return {
                "status": "error",
                "id": document.id,
                "file_name": file.filename,
                "processing_time": result.processing_time,
                "confidence": 0.0,
                "error_message": result.error_message,
                "message": "Processing failed"
            }

    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )

@app.post("/documents/upload-fast")
async def upload_document_fast(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Fast upload with Google Vision OCR (optimized for speed)"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    allowed_types = [
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "image/gif", "image/bmp", "image/tiff"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}"
        )

    # Validate file size (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large (max 10MB)"
        )

    # Save file temporarily and process
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Use fast Google Vision processing only
        ocr_manager = invoice_processor.ocr_manager
        start_time = time.time()

        # Process with Google Vision only for speed
        result = ocr_manager.process_image_with_structuring(temp_file_path, "invoice")
        processing_time = time.time() - start_time

        # Clean up temp file
        os.unlink(temp_file_path)

        if not result.get("success", False):
            raise HTTPException(
                status_code=500,
                detail=f"OCR processing failed: {result.get('error', 'Unknown error')}"
            )

        # Create document record in database
        document = Document(
            filename=file.filename,
            status="completed",
            type=file.content_type,
            size=f"{file.size / (1024*1024):.1f} MB" if file.size else "0 MB",
            pages=1,
            accuracy=f"{result.get('confidence', 0.0) * 100:.1f}%",
            processed_at=datetime.now(),
            processing_time=processing_time,
            confidence=result.get("confidence", 0.0),
            extracted_text=result.get("raw_text", ""),
            provider_used=result.get("provider", "google_vision"),
            data_source="basic"
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        # Store extracted fields if available
        structured_data = result.get("structured_data", {})
        if structured_data and isinstance(structured_data, dict):
            for field_name, field_value in structured_data.items():
                if field_value is not None:
                    extracted_field = ExtractedField(
                        document_id=document.id,
                        field_name=field_name,
                        field_value=str(field_value),
                        confidence=result.get("confidence", 0.0),
                        data_type=type(field_value).__name__
                    )
                    db.add(extracted_field)
            db.commit()

        return {
            "status": "success",
            "id": document.id,
            "file_name": file.filename,
            "processing_time": processing_time,
            "confidence": result.get("confidence", 0.0),
            "extracted_text": result.get("raw_text", "")[:500] + "..." if len(result.get("raw_text", "")) > 500 else result.get("raw_text", ""),
            "provider_used": result.get("provider", "google_vision"),
            "structured_data": structured_data,
            "message": "Document processed successfully with fast OCR"
        }

    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )

@app.get("/documents/{document_id}")
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get specific document details"""
    # Get document from database
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get extracted fields
    extracted_fields = db.query(ExtractedField).filter(ExtractedField.document_id == document_id).all()

    # Convert extracted fields to structured data format
    structured_data = {}
    for field in extracted_fields:
        structured_data[field.field_name] = field.field_value

    result = {
        "id": document.id,
        "filename": document.filename,
        "file_name": document.filename,  # For compatibility
        "status": document.status,
        "type": document.type,
        "size": document.size,
        "pages": document.pages,
        "accuracy": document.accuracy,
        "created_at": document.created_at.isoformat() if document.created_at else None,
        "processed_at": document.processed_at.isoformat() if document.processed_at else None,
        "processing_time": document.processing_time,
        "confidence": document.confidence,
        "extracted_text": document.extracted_text,
        "provider_used": document.provider_used,
        "data_source": document.data_source,
        "structured_data": structured_data,
        "extracted_fields": [
            {
                "field_name": field.field_name,
                "field_value": field.field_value,
                "confidence": field.confidence,
                "data_type": field.data_type
            }
            for field in extracted_fields
        ]
    }

    print(f"📄 Returning document details for: {document_id} with {len(extracted_fields)} extracted fields")
    return result

@app.get("/documents/{document_id}/preview")
async def get_document_preview(document_id: int, db: Session = Depends(get_db)):
    """Get document file for preview"""
    # Get document from database
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Check if document has a file_path
    file_path = getattr(document, 'file_path', None)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document file not found")

    # Read and return the file
    with open(file_path, "rb") as file:
        content = file.read()

    headers = {
        "Content-Disposition": f"inline; filename={document.filename}"
    }

    print(f"🔍 Serving preview for document: {document_id}")
    return Response(
        content=content,
        media_type=document.type,
        headers=headers
    )

@app.get("/credits")
async def get_credits():
    """Get user credit information - requires implementation with user management"""
    # TODO: Implement user management and credit system
    # For now, return basic structure that frontend expects
    return {
        "remaining_credits": 0,
        "total_credits": 0,
        "used_credits": 0,
        "plan": "Free",
        "message": "Credit system not yet implemented"
    }

@app.get("/ocr/status")
async def get_ocr_status():
    """Get OCR system status"""
    try:
        # Get status from invoice processor
        ocr_manager = invoice_processor.ocr_manager
        gemini_engine = invoice_processor.gemini_engine

        available_providers = []
        provider_status = {}

        # Use OCR manager's built-in methods
        available_providers = ocr_manager.get_available_providers()
        provider_status = ocr_manager.get_provider_status()

        return {
            "status": "success",
            "system_ready": len(available_providers) > 0,
            "ocr_providers": {
                "available": available_providers,
                "total_available": len(available_providers),
                "provider_status": provider_status
            },
            "gemini_ai": {
                "available": gemini_engine.is_available if gemini_engine else False,
                "api_key_configured": bool(os.getenv('GOOGLE_API_KEY')),
                "model_name": "gemini-1.5-flash",
                "engine_type": "google_generative_ai"
            },
            "supported_file_types": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif", ".pdf"],
            "message": f"System ready with {len(available_providers)} OCR providers"
        }
    except Exception as e:
        return {
            "status": "error",
            "system_ready": False,
            "message": f"Error getting OCR status: {str(e)}"
        }

@app.get("/ocr/providers")
async def get_ocr_providers():
    """Get detailed OCR provider information"""
    try:
        ocr_manager = invoice_processor.ocr_manager
        available_providers = ocr_manager.get_available_providers()
        provider_status = ocr_manager.get_provider_status()

        providers = []

        # Provider details mapping
        provider_details = {
            "google_vision": {
                "name": "Google Vision API",
                "accuracy": "99%",
                "speed": "fast",
                "cost": "paid"
            },
            "azure_computer_vision": {
                "name": "Azure Computer Vision",
                "accuracy": "98%",
                "speed": "fast",
                "cost": "paid"
            },
            "tesseract": {
                "name": "Tesseract OCR",
                "accuracy": "95%",
                "speed": "medium",
                "cost": "free"
            },
            "easy_ocr": {
                "name": "EasyOCR",
                "accuracy": "94%",
                "speed": "slow",
                "cost": "free"
            },
            "paddle_ocr": {
                "name": "PaddleOCR",
                "accuracy": "93%",
                "speed": "medium",
                "cost": "free"
            }
        }

        # Build provider list
        for provider_id in available_providers:
            if provider_id in provider_details:
                provider_info = provider_details[provider_id].copy()
                provider_info.update({
                    "id": provider_id,
                    "status": "active" if provider_status.get(provider_id, False) else "inactive"
                })
                providers.append(provider_info)

        return {
            "status": "success",
            "providers": providers,
            "total_providers": len(providers)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error getting provider info: {str(e)}"
        }

@app.post("/test-multilayer-ocr")
async def test_multilayer_ocr(file: UploadFile = File(...)):
    """Test multilayer OCR system with uploaded file"""
    try:
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Process through multilayer OCR
        result = invoice_processor.process_invoice(temp_file_path, file.filename)

        # Clean up temp file
        os.unlink(temp_file_path)

        return {
            "status": "success" if result.success else "error",
            "file_name": result.file_name,
            "processing_time": result.processing_time,
            "confidence": result.confidence,
            "extracted_data": result.structured_data if hasattr(result, 'structured_data') else {},
            "ocr_results": result.ocr_results if hasattr(result, 'ocr_results') else [],
            "gemini_decision": result.ai_decision if hasattr(result, 'ai_decision') else None,
            "message": result.error_message if hasattr(result, 'error_message') and result.error_message else "Zpracování dokončeno"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"OCR test failed: {str(e)}"
        }

@app.post("/test-gemini-structuring")
async def test_gemini_structuring(text: str = Form(...)):
    """Test Gemini AI data structuring with sample text"""
    try:
        # Test basic structuring first
        basic_structured = invoice_processor._structure_invoice_data(text)

        # Test Gemini structuring
        gemini_structured = invoice_processor.gemini_engine.structure_and_validate_data(
            text, basic_structured, "invoice"
        )

        return {
            "status": "success",
            "input_text": text[:200] + "..." if len(text) > 200 else text,
            "basic_structuring": {
                "data": basic_structured,
                "fields_count": len(basic_structured.get("fields", {})),
                "confidence": basic_structured.get("extraction_confidence", 0.0)
            },
            "gemini_structuring": {
                "success": gemini_structured.success,
                "data": gemini_structured.structured_data,
                "confidence": gemini_structured.confidence_score,
                "validation_notes": gemini_structured.validation_notes,
                "fields_extracted": gemini_structured.fields_extracted,
                "processing_time": gemini_structured.processing_time,
                "comparison": gemini_structured.comparison_with_basic,
                "error_message": gemini_structured.error_message
            },
            "recommendation": "gemini" if gemini_structured.success and gemini_structured.confidence_score > basic_structured.get("extraction_confidence", 0.0) else "basic"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/documents/upload-cost-effective")
async def upload_document_cost_effective(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Cost-effective upload with hybrid LLM (GPT-4o-mini + Claude fallback)"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    allowed_types = [
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "image/gif", "image/bmp", "image/tiff"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}"
        )

    # Validate file size (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large (max 10MB)"
        )

    # Save file temporarily and process
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Step 1: OCR processing
        ocr_manager = invoice_processor.ocr_manager
        start_time = time.time()

        ocr_result = ocr_manager.process_image_with_structuring(temp_file_path, "invoice")

        if not ocr_result.get("success", False):
            raise HTTPException(
                status_code=500,
                detail=f"OCR processing failed: {ocr_result.get('error', 'Unknown error')}"
            )

        # Step 2: Cost-effective LLM processing
        llm_result = cost_effective_llm.structure_invoice_data(
            ocr_result.get("raw_text", ""),
            file.filename
        )

        processing_time = time.time() - start_time

        # Clean up temp file
        os.unlink(temp_file_path)

        # Create document record in database
        document = Document(
            filename=file.filename,
            status="completed" if llm_result.success else "failed",
            type=file.content_type,
            size=f"{file.size / (1024*1024):.1f} MB" if file.size else "0 MB",
            pages=1,
            accuracy=f"{llm_result.confidence_score * 100:.1f}%" if llm_result.success else "0%",
            processed_at=datetime.now(),
            processing_time=processing_time,
            confidence=llm_result.confidence_score,
            extracted_text=ocr_result.get("raw_text", ""),
            provider_used=f"ocr:{ocr_result.get('provider', 'google_vision')}, llm:{llm_result.provider_used}",
            data_source="cost_effective_llm"
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        # Store extracted fields if available
        if llm_result.success and llm_result.structured_data:
            for field_name, field_value in llm_result.structured_data.items():
                if field_value is not None and field_name != "items":  # Skip complex nested items for now
                    extracted_field = ExtractedField(
                        document_id=document.id,
                        field_name=field_name,
                        field_value=str(field_value),
                        confidence=llm_result.confidence_score,
                        data_type=type(field_value).__name__
                    )
                    db.add(extracted_field)
            db.commit()

        if llm_result.success:
            return {
                "status": "success",
                "id": document.id,
                "file_name": file.filename,
                "processing_time": processing_time,
                "confidence": llm_result.confidence_score,
                "extracted_text": ocr_result.get("raw_text", "")[:500] + "..." if len(ocr_result.get("raw_text", "")) > 500 else ocr_result.get("raw_text", ""),
                "provider_used": llm_result.provider_used,
                "structured_data": llm_result.structured_data,
                "cost_info": {
                    "cost_estimate_usd": llm_result.cost_estimate,
                    "cost_estimate_czk": round(llm_result.cost_estimate * 24, 3),
                    "reasoning": llm_result.reasoning
                },
                "message": f"Document processed successfully with {llm_result.provider_used}"
            }
        else:
            return {
                "status": "error",
                "id": document.id,
                "file_name": file.filename,
                "processing_time": processing_time,
                "confidence": 0.0,
                "error_message": llm_result.error_message,
                "cost_info": {
                    "cost_estimate_usd": llm_result.cost_estimate,
                    "cost_estimate_czk": round(llm_result.cost_estimate * 24, 3)
                },
                "message": "Processing failed"
            }

    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )

@app.get("/llm/statistics")
async def get_llm_statistics():
    """Get LLM usage and cost statistics"""
    try:
        stats = cost_effective_llm.get_statistics()
        return {
            "status": "success",
            "statistics": stats,
            "message": "LLM statistics retrieved successfully"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to get statistics: {str(e)}"
        }

@app.get("/llm/status")
async def get_llm_status():
    """Get LLM system status and capabilities"""
    try:
        status = cost_effective_llm.get_system_status()
        return {
            "status": "success",
            "llm_system": status,
            "message": "LLM system status retrieved successfully"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to get LLM status: {str(e)}"
        }

@app.get("/api/v1/system/status")
async def get_system_status_unified():
    """🎯 UNIFIED SYSTEM STATUS - Comprehensive system status with all components"""
    try:
        unified_status = unified_processor.get_system_status()
        llm_status = cost_effective_llm.get_system_status()

        return {
            "success": True,
            "data": {
                "system_ready": unified_status["system_ready"],
                "version": "2.1.0",
                "components": unified_status["components"],
                "capabilities": unified_status["capabilities"],
                "llm_system": llm_status,
                "statistics": unified_status["statistics"]
            },
            "meta": {"timestamp": datetime.now().isoformat()},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "meta": {"timestamp": datetime.now().isoformat()},
            "error": {"code": "STATUS_ERROR", "message": f"Failed to get system status: {str(e)}"}
        }

@app.get("/api/v1/system/costs")
async def get_cost_statistics():
    """💰 COST STATISTICS - Real-time cost tracking and usage statistics"""
    try:
        unified_stats = unified_processor.get_statistics()
        llm_stats = cost_effective_llm.get_statistics()

        return {
            "success": True,
            "data": {
                "processing_costs": unified_stats["cost_stats"],
                "llm_costs": llm_stats["costs"],
                "efficiency_metrics": {
                    "success_rate": unified_stats["processing_stats"]["success_rate_percent"],
                    "average_processing_time": unified_stats["performance_stats"]["average_processing_time"]
                }
            },
            "meta": {"timestamp": datetime.now().isoformat(), "currency": "CZK"},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "meta": {"timestamp": datetime.now().isoformat()},
            "error": {"code": "STATS_ERROR", "message": f"Failed to get cost statistics: {str(e)}"}
        }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        reload=False
    )

