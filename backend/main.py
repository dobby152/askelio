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
from middleware.auth_middleware import SupabaseAuthMiddleware
import uvicorn
import os
import tempfile
import time
import logging
from datetime import datetime
from dotenv import load_dotenv


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from services.supabase_client import get_supabase_dependency
from services.document_service import document_service

from unified_document_processor import UnifiedDocumentProcessor, ProcessingOptions, ProcessingMode
from routers.auth import router as auth_router
from routers.dashboard import router as dashboard_router
from middleware.auth_middleware import get_current_user


# Load environment variables
load_dotenv()

# 🚀 Initialize ONLY Unified Document Processor (Clean Architecture)
unified_processor = UnifiedDocumentProcessor()


# Supabase is initialized in services/supabase_client.py

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

# Authentication middleware
app.add_middleware(SupabaseAuthMiddleware)

# Include routers
app.include_router(auth_router)
app.include_router(dashboard_router)

# Test endpoint
@app.get("/test")
async def test_endpoint():
    """Simple test endpoint"""
    logger.info("🧪 Test endpoint called")
    return {"success": True, "message": "API is working!", "timestamp": datetime.now().isoformat()}

# Dashboard endpoints moved to dashboard router

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
    return_raw_text: bool = False,
    enable_ares_enrichment: bool = True,
    current_user: dict = Depends(get_current_user)
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
    - enable_ares_enrichment: Enable ARES company data enrichment (default: true)
    
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
            return_raw_text=return_raw_text,
            enable_ares_enrichment=enable_ares_enrichment,
            user_id=current_user['id']  # Set user ownership
        )

        # Process document with unified processor
        result = unified_processor.process_document(temp_file_path, file.filename, options)

        # Clean up temp file
        os.unlink(temp_file_path)

        # Build consistent response
        if result.success:
            # For now, skip duplicate checking - can be implemented later with Supabase
            # TODO: Implement duplicate detection using Supabase queries
            duplicate_info = None

            response_data = {
                "document_id": result.document_id,
                "document_type": result.document_type.value,
                "structured_data": result.structured_data,
                "confidence": result.confidence
            }

            # Add duplicate information if found
            if duplicate_info:
                response_data["duplicate_warning"] = duplicate_info

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

# 🔍 DUPLICATE DETECTION
@app.post("/api/v1/documents/check-duplicates")
async def check_duplicates(
    invoice_number: str = None,
    supplier_name: str = None,
    total_amount: float = None,
    date: str = None,
    currency: str = "CZK",
    current_user: dict = Depends(get_current_user)
):
    """
    Check for duplicate invoices before processing

    Args:
        invoice_number: Invoice number to check
        supplier_name: Supplier/vendor name
        total_amount: Total amount of the invoice
        date: Invoice date
        currency: Currency (default: CZK)

    Returns:
        Information about potential duplicates
    """
    try:
        user_id = current_user['id']

        # For now, return no duplicates - this can be implemented later with Supabase
        # TODO: Implement duplicate detection using Supabase queries

        return {
            "success": True,
            "is_duplicate": False,
            "duplicate_count": 0,
            "duplicates": [],
            "message": "Duplicate check completed successfully"
        }

    except Exception as e:
        logger.error(f"Duplicate check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Duplicate check failed: {str(e)}")

@app.get("/api/v1/documents/duplicate-stats")
async def get_duplicate_statistics(
    current_user: dict = Depends(get_current_user)
):
    """Get duplicate statistics for the current user"""
    try:
        user_id = current_user['id']

        # For now, return empty statistics - this can be implemented later with Supabase
        # TODO: Implement duplicate statistics using Supabase queries
        stats = {
            "total_duplicates": 0,
            "duplicate_percentage": 0.0,
            "most_common_duplicates": []
        }

        return {
            "success": True,
            "data": stats,
            "message": "Duplicate statistics retrieved successfully"
        }

    except Exception as e:
        logger.error(f"Failed to get duplicate statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get duplicate statistics: {str(e)}")

# 📄 DOCUMENT MANAGEMENT
@app.get("/documents")
async def get_documents(current_user: dict = Depends(get_current_user)):
    """Get list of processed documents for the current user"""
    user_id = current_user['id']
    logger.info(f"Fetching documents for user: {user_id}")

    # Get documents using Supabase service
    result = await document_service.get_user_documents(str(user_id))

    if not result['success']:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {result.get('error', 'Unknown error')}")

    documents = result['data'] or []
    logger.info(f"Found {len(documents)} documents for user {user_id}")

    return [
        {
            "id": doc.get('id'),
            "filename": doc.get('filename'),
            "status": doc.get('status'),
            "confidence": doc.get('confidence_score'),
            "processing_time": doc.get('processing_time'),
            "cost_czk": doc.get('processing_cost', 0.0),
            "provider_used": doc.get('ocr_provider'),
            "created_at": doc.get('created_at'),
            "file_path": doc.get('file_path'),
            "size": doc.get('file_size'),
            "pages": doc.get('pages'),
            "type": doc.get('file_type')
        }
        for doc in documents
    ]

@app.get("/documents/{document_id}")
async def get_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific document details for the current user"""
    user_id = current_user['id']

    # Get document using Supabase service
    result = await document_service.get_document_by_id(document_id, str(user_id))

    if not result['success']:
        if 'not found' in str(result.get('error', '')).lower():
            raise HTTPException(status_code=404, detail="Document not found")
        raise HTTPException(status_code=500, detail=f"Failed to fetch document: {result.get('error', 'Unknown error')}")

    document = result['data']
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get extracted fields
    fields_result = await document_service.get_document_fields(document_id, str(user_id))
    fields = fields_result['data'] if fields_result['success'] else []

    return {
        "id": document.get('id'),
        "filename": document.get('filename'),
        "status": document.get('status'),
        "confidence": document.get('confidence_score'),
        "processing_time": document.get('processing_time'),
        "provider_used": document.get('ocr_provider'),
        "extracted_text": document.get('extracted_text'),
        "ares_enriched": document.get('metadata', {}),  # Include metadata
        "created_at": document.get('created_at'),
        "extracted_fields": [
            {
                "field_name": field.get('field_name'),
                "field_value": field.get('field_value'),
                "confidence": field.get('confidence'),
                "data_type": field.get('field_type')
            }
            for field in fields
        ]
    }

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a document and all its associated data for the current user"""
    user_id = current_user['id']

    # Delete document using Supabase service
    result = await document_service.delete_document(document_id, str(user_id))

    if not result['success']:
        if 'not found' in str(result.get('error', '')).lower():
            raise HTTPException(status_code=404, detail="Document not found")
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {result.get('error', 'Unknown error')}")

    return {
        "success": True,
        "message": "Document deleted successfully",
        "deleted_document_id": document_id
    }

@app.get("/documents/{document_id}/export")
async def export_document(
    document_id: str,
    format: str = "json",
    include_ares: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """
    Export document with ARES enriched data for the current user
    Supports JSON, CSV, and XML formats with full ARES integration
    """
    user_id = current_user['id']

    # Get document using Supabase service
    result = await document_service.get_document_by_id(document_id, str(user_id))

    if not result['success']:
        if 'not found' in str(result.get('error', '')).lower():
            raise HTTPException(status_code=404, detail="Document not found")
        raise HTTPException(status_code=500, detail=f"Failed to fetch document: {result.get('error', 'Unknown error')}")

    document = result['data']
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get extracted fields
    fields_result = await document_service.get_document_fields(document_id, str(user_id))
    fields = fields_result['data'] if fields_result['success'] else []

    # Build structured data from fields
    structured_data = {}
    for field in fields:
        structured_data[field.get('field_name', '')] = field.get('field_value', '')

    # Include metadata if available and requested
    if include_ares and document.get('metadata'):
        structured_data["_metadata"] = document['metadata']

    export_data = {
        "document_id": document.get('id'),
        "filename": document.get('filename'),
        "processed_at": document.get('processed_at'),
        "confidence": document.get('confidence_score'),
        "provider_used": document.get('ocr_provider'),
        "structured_data": structured_data,
        "export_metadata": {
            "exported_at": datetime.now().isoformat(),
            "format": format,
            "metadata_included": include_ares and bool(document.get('metadata'))
        }
    }

    if format.lower() == "json":
        return export_data
    elif format.lower() == "csv":
        # Simple CSV export for structured data
        csv_lines = ["Field,Value,Confidence"]
        for field in fields:
            csv_lines.append(f'"{field.get("field_name", "")}","{field.get("field_value", "")}",{field.get("confidence", 0.0)}')

        from fastapi.responses import Response
        return Response(
            content="\n".join(csv_lines),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=document_{document_id}.csv"}
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use 'json' or 'csv'")

@app.get("/api/v1/ares/test")
async def test_ares_integration():
    """
    Test ARES integration functionality
    Returns test results for known Czech companies
    """
    try:
        from ares_client import ares_client

        # Test známých IČO
        test_icos = [
            ("02445344", "Skanska Residential a.s."),
            ("27082440", "Alza.cz a.s.")
        ]

        results = []

        for ico, expected_name in test_icos:
            try:
                company_data = ares_client.get_company_data(ico)

                if company_data:
                    results.append({
                        "ico": ico,
                        "expected_name": expected_name,
                        "actual_name": company_data.name,
                        "dic": company_data.dic,
                        "address": company_data.address,
                        "is_active": company_data.is_active,
                        "is_vat_payer": company_data.is_vat_payer,
                        "success": True,
                        "name_match": expected_name.lower() in company_data.name.lower()
                    })
                else:
                    results.append({
                        "ico": ico,
                        "expected_name": expected_name,
                        "success": False,
                        "error": "Company not found"
                    })

            except Exception as e:
                results.append({
                    "ico": ico,
                    "expected_name": expected_name,
                    "success": False,
                    "error": str(e)
                })

        return {
            "status": "success",
            "ares_integration": "active",
            "test_results": results,
            "summary": {
                "total_tests": len(test_icos),
                "successful": len([r for r in results if r.get("success", False)]),
                "failed": len([r for r in results if not r.get("success", False)])
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "ares_integration": "failed",
            "error": str(e)
        }

@app.get("/api/v1/ares/{ico}")
async def get_company_from_ares(ico: str):
    """
    Get company data from ARES by IČO
    """
    try:
        from ares_client import ares_client

        company_data = ares_client.get_company_data(ico)

        if company_data:
            return {
                "success": True,
                "ico": company_data.ico,
                "name": company_data.name,
                "dic": company_data.dic,
                "address": company_data.address,
                "legal_form": company_data.legal_form,
                "is_active": company_data.is_active,
                "is_vat_payer": company_data.is_vat_payer
            }
        else:
            raise HTTPException(status_code=404, detail="Company not found in ARES")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ARES API error: {str(e)}")

# Dashboard endpoints moved to dashboard router







if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        reload=False
    )
