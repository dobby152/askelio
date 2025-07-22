# Minimal working backend for testing
import os
import sys
import json
import tempfile
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

try:
    from fastapi import FastAPI, HTTPException, UploadFile, File, Form
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    import uvicorn
    print("✅ FastAPI imports successful")
except ImportError as e:
    print(f"❌ FastAPI import error: {e}")
    sys.exit(1)

# Create FastAPI app
app = FastAPI(
    title="Askelio Minimal Backend",
    description="Minimal backend for testing upload functionality",
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

# Create uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory storage for demo
documents_storage = [
    {
        "id": 1,
        "filename": "demo_faktura.pdf",
        "file_name": "demo_faktura.pdf",
        "status": "completed",
        "type": "application/pdf",
        "size": "1.2 MB",
        "pages": 2,
        "accuracy": "95%",
        "created_at": "2025-07-21T14:30:00.000000",
        "processed_at": "2025-07-21T14:30:15.000000",
        "processing_time": 2.45,
        "confidence": 0.95,
        "extracted_text": "ZÁLOHOVÁ FAKTURA č. 250800001\nDatum: 21.07.2024\nCelkem k úhradě: 25 678,90 Kč",
        "provider_used": "google_vision",
        "data_source": "gemini",
        "structured_data": {
            "document_type": "faktura",
            "vendor": "Demo Dodavatel s.r.o.",
            "amount": 25678.90,
            "currency": "CZK",
            "date": "2024-07-21",
            "invoice_number": "250800001",
            "ico": "12345678",
            "dic": "CZ12345678"
        },
        "extracted_fields": [
            {"field_name": "document_type", "field_value": "faktura", "confidence": 0.95, "data_type": "string"},
            {"field_name": "vendor", "field_value": "Demo Dodavatel s.r.o.", "confidence": 0.92, "data_type": "string"},
            {"field_name": "amount", "field_value": "25678.90", "confidence": 0.98, "data_type": "float"},
            {"field_name": "currency", "field_value": "CZK", "confidence": 0.99, "data_type": "string"},
            {"field_name": "date", "field_value": "2024-07-21", "confidence": 0.95, "data_type": "string"},
            {"field_name": "invoice_number", "field_value": "250800001", "confidence": 0.97, "data_type": "string"},
        ]
    }
]

@app.get("/")
async def root():
    return {
        "message": "Askelio Minimal Backend",
        "status": "running",
        "version": "1.0.0",
        "endpoints": ["/documents", "/documents/{id}", "/documents/upload"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/documents")
async def get_documents():
    """Get all documents"""
    print(f"📄 Returning {len(documents_storage)} documents")
    return documents_storage

@app.get("/documents/{document_id}")
async def get_document(document_id: int):
    """Get specific document with extracted fields"""
    document = next((doc for doc in documents_storage if doc["id"] == document_id), None)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    print(f"📄 Returning document details for: {document_id}")
    return document

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process document"""
    print(f"📤 Uploading file: {file.filename}")
    
    try:
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        print(f"💾 File saved to: {file_path}")
        
        # Mock OCR processing
        extracted_text = mock_ocr_processing(file.filename, content)
        structured_data = mock_structure_extraction(file.filename)
        
        # Create new document
        new_id = max([doc["id"] for doc in documents_storage], default=0) + 1
        
        new_document = {
            "id": new_id,
            "filename": file.filename,
            "file_name": file.filename,
            "status": "completed",
            "type": file.content_type,
            "size": f"{len(content) / (1024*1024):.1f} MB",
            "pages": 1,
            "accuracy": "95%",
            "created_at": datetime.now().isoformat(),
            "processed_at": datetime.now().isoformat(),
            "processing_time": 2.1,
            "confidence": 0.95,
            "extracted_text": extracted_text,
            "provider_used": "google_vision",
            "data_source": "gemini",
            "structured_data": structured_data,
            "extracted_fields": [
                {"field_name": key, "field_value": str(value), "confidence": 0.95, "data_type": type(value).__name__}
                for key, value in structured_data.items()
            ]
        }
        
        documents_storage.insert(0, new_document)  # Add to beginning
        
        print(f"✅ Document processed successfully: {new_id}")
        
        return {
            "status": "success",
            "id": new_id,
            "file_name": file.filename,
            "processing_time": 2.1,
            "confidence": 0.95,
            "extracted_text": extracted_text,
            "provider_used": "google_vision",
            "structured_data": structured_data,
            "data_source": {
                "method": "gemini",
                "gemini_used": True,
                "gemini_confidence": 0.95
            },
            "message": "Document processed successfully using gemini structuring"
        }
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

def mock_ocr_processing(filename: str, content: bytes) -> str:
    """Mock OCR processing"""
    name = filename.lower()
    
    if name.endswith('.txt'):
        # If it's a text file, read the content
        try:
            return content.decode('utf-8')
        except:
            return "Text file content could not be decoded"
    
    if 'faktura' in name or 'invoice' in name:
        return "ZÁLOHOVÁ FAKTURA\nČíslo faktury: 2024-001\nDatum vystavení: 21.07.2024\nDodavatel: Demo Dodavatel s.r.o.\nCelkem k úhradě: 15125 Kč"
    elif 'receipt' in name or 'účtenka' in name:
        return "TESCO\nDatum: 21.07.2024\nCelkem: 456,78 Kč"
    else:
        return f"Dokument {filename} byl úspěšně zpracován\nDatum: 21.07.2024"

def mock_structure_extraction(filename: str) -> dict:
    """Mock structured data extraction"""
    name = filename.lower()
    
    if 'faktura' in name or 'invoice' in name:
        return {
            "document_type": "faktura",
            "vendor": "Demo Dodavatel s.r.o.",
            "amount": 15125.00,
            "currency": "CZK",
            "date": "2024-07-21",
            "invoice_number": "2024-001",
            "ico": "12345678",
            "dic": "CZ12345678"
        }
    elif 'receipt' in name or 'účtenka' in name:
        return {
            "document_type": "účtenka",
            "vendor": "TESCO",
            "amount": 456.78,
            "currency": "CZK",
            "date": "2024-07-21"
        }
    else:
        return {
            "document_type": "dokument",
            "filename": filename,
            "processed_date": "2024-07-21"
        }

if __name__ == "__main__":
    print("🚀 Starting Minimal Backend on port 8005...")
    uvicorn.run(app, host="0.0.0.0", port=8005, log_level="info")
