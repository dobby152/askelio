#!/usr/bin/env python3
"""
Working server for testing Gemini AI functionality
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our modules
from invoice_processor import InvoiceProcessor

# Create FastAPI app
app = FastAPI(
    title="Askelio Invoice Processing API",
    description="Working API for invoice processing with Gemini AI",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Invoice Processor
print("🚀 Initializing Invoice Processor...")
invoice_processor = InvoiceProcessor()
print(f"✅ Invoice Processor initialized. Gemini AI available: {invoice_processor.gemini_engine.is_available}")

@app.get("/")
async def root():
    return {"message": "Askelio Invoice Processing API", "status": "running"}

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
        raise HTTPException(status_code=500, detail=f"System status error: {str(e)}")

@app.post("/test-gemini-structuring")
async def test_gemini_structuring(text: str):
    """Test Gemini AI data structuring with sample text"""
    try:
        # Test Gemini AI structuring
        result = invoice_processor.gemini_engine.structure_data_with_gemini(text, {})
        
        return {
            "status": "success",
            "input_text": text,
            "gemini_structuring": {
                "success": result.success,
                "structured_data": result.data if result.success else None,
                "error_message": result.error_message if not result.success else None,
                "validation_notes": result.validation_notes
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini structuring error: {str(e)}")

@app.get("/test-system")
async def test_system():
    """Test system components"""
    try:
        # Test Gemini AI
        gemini_test = None
        if invoice_processor.gemini_engine.is_available:
            try:
                test_result = invoice_processor.gemini_engine.structure_data_with_gemini(
                    "Test faktura č. 123 na částku 1000 Kč", {}
                )
                gemini_test = {
                    "success": test_result.success,
                    "has_data": bool(test_result.data) if test_result.success else False
                }
            except Exception as e:
                gemini_test = {"success": False, "error": str(e)}
        
        return {
            "status": "success",
            "ocr_manager": {
                "available_providers": invoice_processor.ocr_manager.get_available_providers(),
                "provider_status": invoice_processor.ocr_manager.get_provider_status()
            },
            "gemini_engine": invoice_processor.gemini_engine.get_status(),
            "gemini_test": gemini_test,
            "system_ready": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"System test error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Askelio API server...")
    print("📚 API documentation: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
