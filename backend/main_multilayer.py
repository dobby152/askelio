"""
Askelio API with Multilayer OCR System
Advanced OCR processing with multiple providers and AI decision making
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from typing import List, Optional, Dict, Any
import os
import shutil
from datetime import datetime
import json
import math
import asyncio
from pathlib import Path
import logging

# Multilayer OCR imports
from multilayer_ocr import (
    create_multilayer_ocr_engine,
    OCRProviderType,
    ProcessingMethod,
    MultilayerOCRResult
)

# Custom JSON encoder to handle NaN values
class NaNSafeJSONEncoder(json.JSONEncoder):
    def encode(self, obj):
        if isinstance(obj, dict):
            obj = self._clean_dict(obj)
        elif isinstance(obj, list):
            obj = self._clean_list(obj)
        return super().encode(obj)

    def _clean_dict(self, d):
        cleaned = {}
        for key, value in d.items():
            cleaned[key] = self._clean_value(value)
        return cleaned

    def _clean_list(self, lst):
        return [self._clean_value(item) for item in lst]

    def _clean_value(self, value):
        if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
            return 0.0
        elif isinstance(value, dict):
            return self._clean_dict(value)
        elif isinstance(value, list):
            return self._clean_list(value)
        return value

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Askelio API - Multilayer OCR",
    description="Advanced OCR API with multilayer processing and AI decision making",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", 
                   "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Data storage
documents = []
users = []

# Initialize Multilayer OCR Engine
ocr_config = {
    'engine': {
        'max_workers': 5,
        'timeout': 300
    },
    'providers': {
        'tesseract': {
            'enabled': True,
            'tesseract_path': r'C:\Program Files\Tesseract-OCR\tesseract.exe' if os.name == 'nt' else None
        },
        'google_vision': {
            'enabled': True,
            'credentials_path': 'backend/google-credentials.json'
        },
        'azure_vision': {
            'enabled': False,  # Enable if you have Azure credentials
            'subscription_key': os.getenv('AZURE_COMPUTER_VISION_SUBSCRIPTION_KEY'),
            'endpoint': os.getenv('AZURE_COMPUTER_VISION_ENDPOINT')
        },
        'paddle_ocr': {
            'enabled': False,  # Enable if you want to use PaddleOCR
            'lang': 'en',
            'use_gpu': False
        }
    },
    'ai_decision': {
        'provider_weights': {
            'google_vision': 1.0,
            'azure_computer_vision': 0.95,
            'paddle_ocr': 0.85,
            'tesseract': 0.75
        }
    },
    'fusion': {
        'similarity_threshold': 0.6,
        'confidence_threshold': 0.3
    }
}

# Create multilayer OCR engine
multilayer_ocr = create_multilayer_ocr_engine(ocr_config)

logger.info("Multilayer OCR Engine initialized")
logger.info(f"Available providers: {multilayer_ocr.get_available_providers()}")


@app.get("/")
async def root():
    return {
        "message": "Askelio API v2.0.0 - Multilayer OCR",
        "status": "running",
        "features": [
            "Multilayer OCR Processing",
            "AI Decision Making",
            "Result Fusion",
            "Advanced Image Preprocessing",
            "Multiple OCR Providers",
            "Document Processing",
            "User Management"
        ],
        "ocr_status": multilayer_ocr.get_engine_status()
    }


@app.get("/health")
async def health_check():
    ocr_status = multilayer_ocr.get_engine_status()
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "mode": "multilayer_ocr",
        "database": "mock",
        "services": {
            "api": "running",
            "uploads": "available",
            "multilayer_ocr": "running"
        },
        "ocr_providers": {
            "available": ocr_status['available_providers'],
            "total": ocr_status['total_providers'],
            "ai_decision_engine": ocr_status['ai_decision_engine'],
            "result_fusion_engine": ocr_status['result_fusion_engine']
        }
    }


@app.get("/ocr/status")
async def get_ocr_status():
    """Get detailed OCR system status"""
    return multilayer_ocr.get_engine_status()


@app.get("/ocr/providers")
async def get_ocr_providers():
    """Get information about available OCR providers"""
    providers_info = []
    
    for provider in multilayer_ocr.providers:
        provider_info = provider.get_provider_info()
        providers_info.append(provider_info)
    
    return {
        "providers": providers_info,
        "total_available": len(multilayer_ocr.get_available_providers())
    }


@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process document with multilayer OCR"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create document entry
    new_document = {
        "id": len(documents) + 1,
        "filename": file.filename,
        "type": file.content_type,
        "status": "processing",
        "accuracy": None,
        "created_at": datetime.now().isoformat(),
        "processed_at": None,
        "size": f"{file.size / (1024*1024):.1f} MB" if file.size else "0 MB",
        "pages": 1,
        "file_path": file_path,
        "multilayer_result": None,
        "confidence": None
    }

    documents.append(new_document)

    # Start background processing with multilayer OCR
    asyncio.create_task(process_document_multilayer(new_document["id"], file_path, file.content_type, file.filename))

    return {
        "id": new_document["id"],
        "filename": new_document["filename"],
        "status": "processing",
        "message": "Document uploaded and multilayer OCR processing started"
    }


async def process_document_multilayer(doc_id: int, file_path: str, file_type: str, filename: str):
    """Process document using multilayer OCR system"""
    try:
        logger.info(f"🔄 Processing document {filename} with multilayer OCR...")

        # Find document
        document = next((d for d in documents if d["id"] == doc_id), None)
        if not document:
            return

        # Convert PDF to image if needed
        image_path = file_path
        if file_type == 'application/pdf':
            # For PDF files, we need to convert to image first
            # This is a simplified approach - in production you might want to process all pages
            try:
                import pdf2image
                images = pdf2image.convert_from_path(file_path, first_page=1, last_page=1)
                if images:
                    temp_image_path = file_path.replace('.pdf', '_page1.png')
                    images[0].save(temp_image_path, 'PNG')
                    image_path = temp_image_path
            except Exception as e:
                logger.error(f"PDF conversion failed: {e}")
                document["status"] = "error"
                document["error_message"] = f"PDF conversion failed: {str(e)}"
                return

        # Process with multilayer OCR
        logger.info(f"🤖 Running multilayer OCR on {filename}...")
        
        # Define processing methods to try
        processing_methods = [ProcessingMethod.BASIC, ProcessingMethod.GENTLE]
        
        # Process document
        multilayer_result: MultilayerOCRResult = await multilayer_ocr.process_document(
            image_path=image_path,
            processing_methods=processing_methods
        )

        # Store results
        document["multilayer_result"] = multilayer_result.to_dict()
        document["confidence"] = multilayer_result.final_confidence
        
        # Extract key information for compatibility
        best_result = multilayer_result.best_result
        document["raw_text"] = best_result.text
        document["extracted_data"] = {
            "document_type": best_result.structured_data.document_type,
            "vendor": best_result.structured_data.vendor,
            "amount": best_result.structured_data.amount,
            "currency": best_result.structured_data.currency,
            "date": best_result.structured_data.date,
            "invoice_number": best_result.structured_data.invoice_number,
            "confidence": best_result.confidence
        }

        # Calculate accuracy based on multilayer results
        accuracy = calculate_multilayer_accuracy(multilayer_result)
        document["accuracy"] = accuracy

        # Mark as completed
        document["status"] = "completed"
        document["processed_at"] = datetime.now().isoformat()

        logger.info(f"✅ Multilayer OCR completed for {filename}!")
        logger.info(f"   Best provider: {best_result.provider.value}")
        logger.info(f"   Final confidence: {multilayer_result.final_confidence:.3f}")
        logger.info(f"   Accuracy: {accuracy}%")
        logger.info(f"   Fusion applied: {multilayer_result.fusion_applied}")

        # Clean up temporary files
        if image_path != file_path and os.path.exists(image_path):
            os.remove(image_path)

    except Exception as e:
        logger.error(f"❌ Multilayer OCR processing failed for {filename}: {e}")
        # Mark as error
        document = next((d for d in documents if d["id"] == doc_id), None)
        if document:
            document["status"] = "error"
            document["error_message"] = str(e)
            document["processed_at"] = datetime.now().isoformat()


def calculate_multilayer_accuracy(multilayer_result: MultilayerOCRResult) -> float:
    """Calculate accuracy based on multilayer OCR results"""
    best_result = multilayer_result.best_result
    
    # Base accuracy from confidence
    base_accuracy = best_result.confidence * 100
    
    # Bonus for multiple providers agreeing
    if len(multilayer_result.all_results) > 1:
        successful_results = [r for r in multilayer_result.all_results if r.success]
        if len(successful_results) > 1:
            # Boost accuracy if multiple providers succeeded
            agreement_bonus = min(10, len(successful_results) * 2)
            base_accuracy += agreement_bonus
    
    # Bonus for fusion being applied successfully
    if multilayer_result.fusion_applied:
        base_accuracy += 5
    
    # Bonus for high-quality structured data
    structured_data = best_result.structured_data
    structured_fields = [
        structured_data.vendor,
        structured_data.amount,
        structured_data.currency,
        structured_data.date,
        structured_data.invoice_number
    ]
    
    filled_fields = sum(1 for field in structured_fields if field is not None and str(field).strip())
    structured_bonus = (filled_fields / len(structured_fields)) * 10
    base_accuracy += structured_bonus
    
    # Cap at reasonable maximum
    return min(95.0, max(0.0, base_accuracy))


@app.post("/test-multilayer-ocr")
async def test_multilayer_ocr(file: UploadFile = File(...)):
    """Test endpoint for multilayer OCR processing"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Save temporary file
    temp_path = f"temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process with multilayer OCR
        multilayer_result = await multilayer_ocr.process_document(
            image_path=temp_path,
            processing_methods=[ProcessingMethod.BASIC, ProcessingMethod.GENTLE, ProcessingMethod.AGGRESSIVE]
        )

        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Convert to dict and clean NaN values
        result_dict = multilayer_result.to_dict()

        # Use custom JSON encoder to handle NaN values
        response_data = {
            "status": "success",
            "result": result_dict
        }

        # Serialize with custom encoder
        json_str = json.dumps(response_data, cls=NaNSafeJSONEncoder)

        return Response(
            content=json_str,
            media_type="application/json"
        )

    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        raise HTTPException(status_code=500, detail=f"Multilayer OCR processing failed: {str(e)}")


# Include all other endpoints from the original API
@app.post("/auth/login")
async def login(email: str = Form(...), password: str = Form(...)):
    """Login endpoint"""
    user = next((u for u in users if u["email"] == email), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": "token_123",
        "token_type": "bearer",
        "user": user
    }


@app.post("/auth/register")
async def register(email: str = Form(...), password: str = Form(...), name: str = Form(...)):
    """Register endpoint"""
    if any(u["email"] == email for u in users):
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = {
        "id": len(users) + 1,
        "email": email,
        "name": name,
        "credits": 50
    }
    users.append(new_user)

    return {
        "access_token": "token_123",
        "token_type": "bearer",
        "user": new_user
    }


@app.get("/auth/me")
async def get_current_user():
    """Get current user endpoint"""
    if not users:
        raise HTTPException(status_code=401, detail="No user logged in")
    return users[0]


@app.get("/documents/{document_id}/status")
async def get_document_status(document_id: int):
    """Get processing status of document"""
    document = next((d for d in documents if d["id"] == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "id": document["id"],
        "filename": document["filename"],
        "status": document["status"],
        "accuracy": document.get("accuracy"),
        "confidence": document.get("confidence"),
        "progress": get_processing_progress(document["status"]),
        "error_message": document.get("error_message")
    }


def get_processing_progress(status: str) -> int:
    """Get processing progress percentage"""
    if status == "processing":
        return 50
    elif status == "completed":
        return 100
    elif status == "error":
        return 0
    else:
        return 0


@app.get("/documents/{document_id}/preview")
async def get_document_preview(document_id: int):
    """Get document file for preview"""
    document = next((doc for doc in documents if doc["id"] == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = document.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document file not found")

    with open(file_path, "rb") as file:
        content = file.read()

    headers = {
        "Content-Disposition": "inline; filename=" + document["filename"]
    }

    return Response(
        content=content,
        media_type=document["type"],
        headers=headers
    )


@app.get("/documents")
async def get_documents():
    """Get all documents"""
    return documents


@app.get("/documents/{document_id}")
async def get_document(document_id: int):
    """Get specific document"""
    document = next((d for d in documents if d["id"] == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@app.get("/credits")
async def get_credits():
    """Get user credits"""
    if not users:
        raise HTTPException(status_code=401, detail="No user logged in")
    return {
        "credits": users[0]["credits"],
        "user_id": users[0]["id"]
    }


@app.post("/credits/purchase")
async def purchase_credits(amount: int = Form(...)):
    """Credit purchase"""
    if not users:
        raise HTTPException(status_code=401, detail="No user logged in")
    users[0]["credits"] += amount
    return {
        "message": f"Successfully purchased {amount} credits",
        "new_balance": users[0]["credits"]
    }


@app.get("/integrations")
async def get_integrations():
    """Get available integrations"""
    return {
        "integrations": [
            {
                "name": "Pohoda",
                "status": "available",
                "description": "Export do účetního systému Pohoda"
            },
            {
                "name": "FlexiBee",
                "status": "available", 
                "description": "Export do účetního systému FlexiBee"
            },
            {
                "name": "Excel",
                "status": "available",
                "description": "Export do Excel souboru"
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    print("🚀 Spouštím Askelio API s Multilayer OCR systémem...")
    print("📚 API dokumentace: http://localhost:8000/docs")
    print("🌐 Frontend: http://localhost:3000")
    print(f"🤖 OCR Providers: {multilayer_ocr.get_available_providers()}")
    
    uvicorn.run(
        "main_multilayer:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
