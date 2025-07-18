# Zjednodušená verze Askelio API pro demo
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
import shutil
from datetime import datetime
import json

# Initialize FastAPI app
app = FastAPI(
    title="Askelio API - Demo",
    description="Demo verze API pro automatizované zpracování faktur a účtenek",
    version="1.0.0-demo"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mock data storage (in production would be database)
mock_documents = [
    {
        "id": 1,
        "filename": "Faktura_2024_001.pdf",
        "type": "application/pdf",
        "status": "completed",
        "accuracy": 98.5,
        "created_at": "2024-01-15T14:30:00",
        "processed_at": "2024-01-15T14:32:00",
        "size": "2.4 MB",
        "pages": 3
    },
    {
        "id": 2,
        "filename": "Smlouva_dodavatel.pdf",
        "type": "application/pdf",
        "status": "completed",
        "accuracy": 97.2,
        "created_at": "2024-01-15T13:45:00",
        "processed_at": "2024-01-15T13:47:00",
        "size": "1.8 MB",
        "pages": 5
    },
    {
        "id": 3,
        "filename": "Doklad_scan.jpg",
        "type": "image/jpeg",
        "status": "processing",
        "accuracy": None,
        "created_at": "2024-01-15T15:20:00",
        "processed_at": None,
        "size": "3.2 MB",
        "pages": 1
    },
    {
        "id": 4,
        "filename": "Certifikat_ISO.pdf",
        "type": "application/pdf",
        "status": "error",
        "accuracy": None,
        "created_at": "2024-01-15T12:15:00",
        "processed_at": None,
        "size": "5.1 MB",
        "pages": 8
    },
    {
        "id": 5,
        "filename": "Objednavka_2024.pdf",
        "type": "application/pdf",
        "status": "completed",
        "accuracy": 99.1,
        "created_at": "2024-01-15T11:30:00",
        "processed_at": "2024-01-15T11:32:00",
        "size": "1.2 MB",
        "pages": 2
    }
]

mock_users = [
    {
        "id": 1,
        "email": "askelatest@gmail.com",
        "name": "Askelio Test User",
        "credits": 100
    }
]

@app.get("/")
async def root():
    return {
        "message": "Askelio API v1.0.0 - Demo Mode",
        "status": "running",
        "features": [
            "File Upload",
            "Document Processing (Mock)",
            "User Management (Mock)",
            "Health Check"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "mode": "demo",
        "database": "mock",
        "services": {
            "api": "running",
            "uploads": "available",
            "processing": "mock"
        }
    }

@app.post("/auth/login")
async def login(email: str = Form(...), password: str = Form(...)):
    """Mock login endpoint"""
    user = next((u for u in mock_users if u["email"] == email), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "access_token": "mock_token_123",
        "token_type": "bearer",
        "user": user
    }

@app.post("/auth/register")
async def register(
    email: str = Form(...), 
    password: str = Form(...),
    name: str = Form(...)
):
    """Mock register endpoint"""
    # Check if user exists
    if any(u["email"] == email for u in mock_users):
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = {
        "id": len(mock_users) + 1,
        "email": email,
        "name": name,
        "credits": 50
    }
    mock_users.append(new_user)
    
    return {
        "access_token": "mock_token_123",
        "token_type": "bearer",
        "user": new_user
    }

@app.get("/auth/me")
async def get_current_user():
    """Mock current user endpoint"""
    return mock_users[0]  # Return first user as demo

@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process document"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create new document entry
    new_document = {
        "id": len(mock_documents) + 1,
        "filename": file.filename,
        "type": file.content_type,
        "status": "completed",
        "accuracy": 96.8,
        "created_at": datetime.now().isoformat(),
        "processed_at": datetime.now().isoformat(),
        "size": f"{file.size / (1024*1024):.1f} MB" if file.size else "0 MB",
        "pages": 1,
        "extracted_data": {
            "document_type": "faktura",
            "vendor": "Demo Dodavatel s.r.o.",
            "amount": 1250.50,
            "currency": "CZK",
            "date": "2025-01-17",
            "invoice_number": "2025001",
            "items": [
                {
                    "description": "Služby IT podpory",
                    "quantity": 1,
                    "unit_price": 1250.50,
                    "total": 1250.50
                }
            ]
        },
        "confidence": 0.968
    }

    mock_documents.append(new_document)

    return {
        "id": new_document["id"],
        "filename": new_document["filename"],
        "status": "uploaded",
        "message": "Document uploaded and processing started"
    }

@app.get("/documents")
async def get_documents():
    """Get all documents"""
    return mock_documents

@app.get("/documents/{document_id}")
async def get_document(document_id: int):
    """Get specific document"""
    document = next((d for d in mock_documents if d["id"] == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.get("/credits")
async def get_credits():
    """Get user credits"""
    return {
        "credits": mock_users[0]["credits"],
        "user_id": mock_users[0]["id"]
    }

@app.post("/credits/purchase")
async def purchase_credits(amount: int = Form(...)):
    """Mock credit purchase"""
    mock_users[0]["credits"] += amount
    return {
        "message": f"Successfully purchased {amount} credits",
        "new_balance": mock_users[0]["credits"]
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
    print("🚀 Spouštím Askelio API v demo módu...")
    print("📚 API dokumentace: http://localhost:8000/docs")
    print("🌐 Frontend: http://localhost:3000")
    
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
