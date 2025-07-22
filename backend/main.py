# Clean FastAPI main application for Invoice/Receipt Processing
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi import Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import uvicorn
import os
import tempfile
import time
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from invoice_processor import InvoiceProcessor
from database_sqlite import get_db, init_db
from models_sqlite import Document, ExtractedField

# Load environment variables
load_dotenv()

# Initialize Invoice Processor (handles 5 OCR sources + Gemini AI)
invoice_processor = InvoiceProcessor()

# Initialize SQLite database
init_db()

def init_demo_data():
    """Initialize demo data if database is empty"""
    from database_sqlite import SessionLocal
    db = SessionLocal()
    try:
        # Check if we already have documents
        existing_count = db.query(Document).count()
        if existing_count > 0:
            print(f"📊 Database already has {existing_count} documents, skipping demo data")
            return

        print("📊 Initializing demo data...")

        # Create demo documents
        demo_docs = [
            {
                "filename": "Zálohová_faktura_250800001.pdf",
                "status": "completed",
                "type": "application/pdf",
                "size": "1.2 MB",
                "pages": 2,
                "accuracy": "95%",
                "confidence": 0.95,
                "extracted_text": "ZÁLOHOVÁ FAKTURA č. 250800001\nDatum: 21.07.2024\nCelkem k úhradě: 25 678,90 Kč",
                "provider_used": "google_vision",
                "data_source": "gemini",
                "processing_time": 2.45,
                "processed_at": datetime.now()
            },
            {
                "filename": "sample_invoice.pdf",
                "status": "completed",
                "type": "application/pdf",
                "size": "0.8 MB",
                "pages": 1,
                "accuracy": "98.5%",
                "confidence": 0.985,
                "extracted_text": "FAKTURA č. 2024-001\nDatum: 21.07.2024\nCelkem k úhradě: 15 678,90 Kč",
                "provider_used": "google_vision",
                "data_source": "gemini",
                "processing_time": 1.85,
                "processed_at": datetime.now()
            },
            {
                "filename": "receipt_grocery.jpg",
                "status": "completed",
                "type": "image/jpeg",
                "size": "0.5 MB",
                "pages": 1,
                "accuracy": "94.2%",
                "confidence": 0.942,
                "extracted_text": "TESCO\nDatum: 21.07.2024\nCelkem: 456,78 Kč",
                "provider_used": "google_vision",
                "data_source": "basic",
                "processing_time": 1.23,
                "processed_at": datetime.now()
            }
        ]

        for doc_data in demo_docs:
            document = Document(**doc_data)
            db.add(document)
            db.commit()
            db.refresh(document)

            # Add some demo extracted fields
            if "faktura" in doc_data["filename"].lower():
                demo_fields = [
                    {"field_name": "document_type", "field_value": "faktura", "confidence": 0.95, "data_type": "string"},
                    {"field_name": "vendor", "field_value": "Demo Dodavatel s.r.o.", "confidence": 0.92, "data_type": "string"},
                    {"field_name": "amount", "field_value": "25678.90", "confidence": 0.98, "data_type": "float"},
                    {"field_name": "currency", "field_value": "CZK", "confidence": 0.99, "data_type": "string"},
                    {"field_name": "date", "field_value": "2024-07-21", "confidence": 0.95, "data_type": "string"},
                    {"field_name": "invoice_number", "field_value": "250800001", "confidence": 0.97, "data_type": "string"},
                ]
            else:
                demo_fields = [
                    {"field_name": "document_type", "field_value": "účtenka", "confidence": 0.90, "data_type": "string"},
                    {"field_name": "vendor", "field_value": "TESCO", "confidence": 0.95, "data_type": "string"},
                    {"field_name": "amount", "field_value": "456.78", "confidence": 0.92, "data_type": "float"},
                    {"field_name": "currency", "field_value": "CZK", "confidence": 0.99, "data_type": "string"},
                    {"field_name": "date", "field_value": "2024-07-21", "confidence": 0.88, "data_type": "string"},
                ]

            for field_data in demo_fields:
                field = ExtractedField(document_id=document.id, **field_data)
                db.add(field)

            db.commit()

        print(f"📊 Created {len(demo_docs)} demo documents with extracted fields")

    finally:
        db.close()

# Initialize demo data
init_demo_data()



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
        "message": "Askelio Invoice Processing API v2.0.0",
        "description": "Clean API with 5 OCR sources + Gemini AI decision making",
        "endpoints": {
            "POST /process-invoice": "Main endpoint for invoice/receipt processing",
            "GET /health": "Health check",
            "GET /system-status": "System status and available providers"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

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
async def upload_document_fast(file: UploadFile = File(...)):
    """Ultra-fast upload with Tesseract only (no network calls)"""
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

    # Skip PDF files for fast endpoint (Tesseract can't handle PDFs directly)
    if file.content_type == "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="PDF files not supported in fast mode. Use regular upload endpoint."
        )

    # Save file temporarily and process
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Use simplified Google Vision + Gemini processing
        ocr_manager = invoice_processor.ocr_manager

        start_time = time.time()
        result = ocr_manager.process_image_with_structuring(temp_file_path, "invoice")
        processing_time = time.time() - start_time

        # Clean up temp file
        os.unlink(temp_file_path)

        # Create document record
        doc_id = f"doc_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        document = {
            "id": doc_id,
            "file_name": file.filename,
            "status": "completed" if result["success"] else "failed",
            "type": file.content_type,
            "size": f"{file.size / (1024*1024):.1f} MB" if file.size else "0 MB",
            "pages": 1,
            "accuracy": f"{result['confidence'] * 100:.1f}%" if result["success"] else "0%",
            "created_at": datetime.now().isoformat(),
            "processed_at": datetime.now().isoformat(),
            "processing_time": processing_time,
            "confidence": result["confidence"],
            "extracted_text": result["raw_text"] if result["success"] else "",
            "provider_used": result.get("provider", "google_vision"),
            "structured_data": result.get("structured_data"),
            "structuring_confidence": result.get("structuring_confidence", 0.0),
            "fields_extracted": result.get("fields_extracted", []),
            "error_message": result.get("error") if not result["success"] else None
        }

        # Store document in memory
        documents_storage.append(document)

        # Keep only last 50 documents to prevent memory issues
        if len(documents_storage) > 50:
            documents_storage.pop(0)

        return {
            "status": "success" if result.success else "error",
            "id": doc_id,
            "file_name": file.filename,
            "processing_time": processing_time,
            "confidence": result.confidence,
            "extracted_text": result.text[:500] + "..." if len(result.text) > 500 else result.text,
            "provider_used": "tesseract",
            "message": "Document processed with Tesseract OCR"
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
    file_path = document.file_path
    if not file_path or not os.path.exists(file_path):
        # For demo purposes, return a placeholder response
        raise HTTPException(status_code=404, detail="Document file not found - demo mode")

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
    """Get user credit information"""
    # Mock data for now - in real app would fetch from database
    return {
        "remaining_credits": 2450,
        "total_credits": 5000,
        "used_credits": 2550,
        "plan": "Pro"
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


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        reload=False
    )

