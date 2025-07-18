# FastAPI main application
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
from typing import List, Optional
import os
import tempfile
from dotenv import load_dotenv

from database import get_db, engine
from models import Base
from routers import auth, documents, credits, integrations
from auth_utils import get_current_user
from google_vision import google_vision_client
from combined_ocr_processor import combined_ocr_processor

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Askelio API",
    description="API pro automatizované zpracování faktur a účtenek",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(credits.router, prefix="/credits", tags=["credits"])
app.include_router(integrations.router, prefix="/integrations", tags=["integrations"])

@app.get("/")
async def root():
    return {"message": "Askelio API v1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/test-vision")
async def test_google_vision(file: UploadFile = File(...)):
    """Test endpoint for Google Vision API (legacy - use /test-combined-ocr instead)."""

    # Validate file type
    allowed_types = [
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "image/gif", "image/bmp", "image/tiff"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type"
        )

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Test Google Vision API
        if google_vision_client.client:
            text, confidence, structured_data = google_vision_client.extract_document_text(temp_file_path)

            return {
                "status": "success",
                "google_vision_available": True,
                "file_name": file.filename,
                "extracted_text": text[:500] + "..." if len(text) > 500 else text,
                "confidence": confidence,
                "text_length": len(text),
                "structured_data_summary": {
                    "pages": structured_data.get("pages", 0),
                    "blocks": len(structured_data.get("blocks", [])),
                    "paragraphs": len(structured_data.get("paragraphs", [])),
                    "words": len(structured_data.get("words", []))
                }
            }
        else:
            return {
                "status": "error",
                "google_vision_available": False,
                "message": "Google Vision API not configured"
            }

    except Exception as e:
        return {
            "status": "error",
            "google_vision_available": False,
            "message": str(e)
        }
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/test-combined-ocr")
async def test_combined_ocr(file: UploadFile = File(...)):
    """Test endpoint for Combined OCR (AI + Traditional methods)."""

    # Validate file type
    allowed_types = [
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "image/gif", "image/bmp", "image/tiff"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type"
        )

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Test Combined OCR (AI + Traditional)
        result = combined_ocr_processor.process_document(temp_file_path)

        if "error" in result:
            return {
                "status": "error",
                "message": result["error"]
            }

        return {
            "status": "success",
            "file_name": file.filename,
            "ocr_type": "combined_ai_traditional",
            "final_result": {
                "text_preview": result["final_result"]["text"][:500] + "..." if len(result["final_result"]["text"]) > 500 else result["final_result"]["text"],
                "confidence": result["final_result"]["confidence"],
                "method_used": result["final_result"]["method_used"],
                "total_processing_time": result["final_result"]["total_processing_time"],
                "structured_data": result["final_result"]["structured_data"]
            },
            "methods_comparison": {
                "methods_used": result["comparison"]["methods_used"],
                "successful_methods": result["comparison"]["successful_methods"],
                "best_individual_confidence": result["comparison"]["best_individual_confidence"]
            },
            "individual_results": [
                {
                    "method": r["method"],
                    "confidence": r["confidence"],
                    "text_length": r["text_length"],
                    "processing_time": r["processing_time"],
                    "preprocessing": r["preprocessing"]
                }
                for r in result["individual_results"]
            ]
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
