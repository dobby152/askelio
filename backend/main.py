# Clean FastAPI main application for Invoice/Receipt Processing
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import tempfile
from dotenv import load_dotenv

from invoice_processor import InvoiceProcessor

# Load environment variables
load_dotenv()

# Initialize Invoice Processor (handles 5 OCR sources + Gemini AI)
invoice_processor = InvoiceProcessor()

# Initialize Clean FastAPI app
app = FastAPI(
    title="Askelio Invoice Processing API",
    description="Clean API for invoice/receipt processing with 5 OCR sources + Gemini AI",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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

            # Structured invoice data
            "structured_data": result.structured_data,

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
        status = invoice_processor.get_system_status()
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


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
