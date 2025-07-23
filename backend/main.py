#!/usr/bin/env python3
"""
🚀 ASKELIO DOCUMENT PROCESSING API v3.0 - CLEAN ARCHITECTURE
Ultra Cost-Effective API with Powerful LLM Models (Claude 3.5 Sonnet, GPT-4o)

CLEAN IMPLEMENTATION:
- Only unified_document_processor (no legacy components)
- Powerful models with deep understanding
- Minimal, focused endpoints
- Production-ready architecture
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi import Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import tempfile
import time
import logging
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from database_sqlite import get_db, init_db
from models_sqlite import Document, ExtractedField
from unified_document_processor import UnifiedDocumentProcessor, ProcessingOptions, ProcessingMode

# Load environment variables
load_dotenv()

# 🚀 Initialize ONLY Unified Document Processor (Clean Architecture)
unified_processor = UnifiedDocumentProcessor()

# Initialize SQLite database
init_db()

# FastAPI app
app = FastAPI(
    title="Askelio Document Processing API v3.0",
    description="🚀 Clean Architecture with Powerful LLM Models",
    version="3.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    logger.info(f"🔍 Request: {request.method} {request.url}")
    logger.info(f"🔍 Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"✅ Response: {response.status_code} in {process_time:.3f}s")
    
    return response

@app.get("/")
async def root():
    return {
        "message": "Askelio Document Processing API v3.0",
        "description": "🚀 Clean Architecture with Powerful LLM Models (Claude 3.5 Sonnet, GPT-4o)",
        "endpoints": {
            "POST /api/v1/documents/process": "🎯 MAIN: Unified document processing",
            "GET /health": "Health check",
            "GET /api/v1/system/status": "System status",
            "GET /documents": "List processed documents"
        },
        "features": [
            "Claude 3.5 Sonnet (Flagship)",
            "GPT-4o (Premium)", 
            "Claude 3 Haiku (Optimal)",
            "Deep context understanding",
            "Czech language support",
            "Cost-effective processing"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "3.0.0", "architecture": "clean"}

# 🎯 MAIN ENDPOINT - Unified Document Processing
@app.post("/api/v1/documents/process")
async def process_document_unified(
    file: UploadFile = File(...),
    mode: str = "cost_optimized",
    max_cost_czk: float = 5.0,
    min_confidence: float = 0.8,
    enable_fallbacks: bool = True,
    return_raw_text: bool = False
):
    """
    🎯 UNIFIED DOCUMENT PROCESSING ENDPOINT
    
    Powerful models with deep understanding and context awareness.
    
    Parameters:
    - mode: cost_optimized (default), accuracy_first, speed_first, budget_strict
    - max_cost_czk: Maximum cost per document in CZK (default: 5.0 for powerful models)
    - min_confidence: Minimum acceptable confidence (default: 0.8)
    - enable_fallbacks: Enable fallback providers (default: true)
    - return_raw_text: Include raw OCR text in response (default: false)
    
    Returns consistent format with powerful model results.
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
                    "validation_notes": result.validation_notes,
                    "raw_google_vision_text": result.raw_text  # 🔍 DEBUG: Raw Google Vision text
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

# 📊 SYSTEM STATUS
@app.get("/api/v1/system/status")
async def get_system_status():
    """Get comprehensive system status"""
    try:
        stats = unified_processor.get_statistics()
        return {
            "status": "success",
            "system_ready": True,
            "version": "3.0.0",
            "architecture": "clean_unified_processor",
            "statistics": stats,
            "powerful_models": {
                "flagship": "Claude 3.5 Sonnet",
                "premium": "GPT-4o", 
                "optimal": "Claude 3 Haiku",
                "budget": "GPT-4o Mini"
            }
        }
    except Exception as e:
        logger.error(f"❌ System status error: {e}")
        return {
            "status": "error",
            "system_ready": False,
            "error": str(e)
        }

# 📄 DOCUMENT MANAGEMENT
@app.get("/documents")
async def get_documents(db: Session = Depends(get_db)):
    """Get list of processed documents"""
    documents = db.query(Document).order_by(Document.created_at.desc()).all()
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "status": doc.status,
            "confidence": doc.confidence,
            "processing_time": doc.processing_time,
            "cost_czk": getattr(doc, 'cost_czk', 0.0),
            "provider_used": doc.provider_used,
            "created_at": doc.created_at.isoformat() if doc.created_at else None
        }
        for doc in documents
    ]

@app.get("/documents/{document_id}")
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get specific document details"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get extracted fields
    fields = db.query(ExtractedField).filter(ExtractedField.document_id == document_id).all()
    
    return {
        "id": document.id,
        "filename": document.filename,
        "status": document.status,
        "confidence": document.confidence,
        "processing_time": document.processing_time,
        "provider_used": document.provider_used,
        "extracted_text": document.extracted_text,
        "created_at": document.created_at.isoformat() if document.created_at else None,
        "extracted_fields": [
            {
                "field_name": field.field_name,
                "field_value": field.field_value,
                "confidence": field.confidence,
                "data_type": field.data_type
            }
            for field in fields
        ]
    }

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        reload=False
    )
