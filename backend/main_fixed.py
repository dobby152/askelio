# Fixed FastAPI backend with SQLite support
import os
import sys
import tempfile
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse, Response
    from sqlalchemy.orm import Session
    import uvicorn
    
    # Local imports
    from database_sqlite import get_db, init_db
    from models_sqlite import Document, ExtractedField
    
    print("✅ All imports successful")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Initialize database
try:
    init_db()
    print("✅ Database initialized")
except Exception as e:
    print(f"❌ Database initialization failed: {e}")

# Create FastAPI app
app = FastAPI(
    title="Askelio Invoice Processing API - Fixed",
    description="Fixed API for invoice/receipt processing with SQLite",
    version="3.0.0"
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

@app.get("/")
async def root():
    return {
        "message": "Askelio Invoice Processing API - Fixed Version",
        "status": "running",
        "version": "3.0.0",
        "database": "SQLite"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/documents")
async def get_documents(db: Session = Depends(get_db)):
    """Get all documents from database"""
    try:
        documents = db.query(Document).order_by(Document.created_at.desc()).all()
        
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
        
        print(f"📄 Returning {len(result)} documents from database")
        return result
        
    except Exception as e:
        print(f"❌ Error getting documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}")
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get specific document with extracted fields"""
    try:
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
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def init_demo_data_if_empty(db: Session):
    """Initialize demo data if database is empty"""
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
        
    except Exception as e:
        print(f"❌ Error initializing demo data: {e}")
        db.rollback()

# Initialize demo data on startup
@app.on_event("startup")
async def startup_event():
    from database_sqlite import SessionLocal
    db = SessionLocal()
    try:
        init_demo_data_if_empty(db)
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting Fixed Backend...")
    uvicorn.run(app, host="0.0.0.0", port=8004, log_level="info")
