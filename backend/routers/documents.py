# Documents router
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
from datetime import datetime

from database import get_db
from models import User, Document, DocumentStatus
from auth_utils import get_current_user
from ocr_processor import process_document_async

router = APIRouter()

# Pydantic models
class DocumentResponse(BaseModel):
    id: str
    file_name: str
    status: str
    mime_type: str
    final_extracted_data: Optional[dict] = None
    confidence_score: Optional[float] = None
    processing_cost: Optional[float] = None
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentUploadResponse(BaseModel):
    id: str
    file_name: str
    status: str
    message: str

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a document for processing."""

    # Validate file type
    allowed_types = [
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "image/gif", "image/bmp", "image/tiff"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type"
        )

    # Validate file size (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large (max 10MB)"
        )

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Create document record
    document = Document(
        user_id=current_user.id,
        file_name=file.filename,
        storage_path=f"uploads/{unique_filename}",
        status=DocumentStatus.processing,
        mime_type=file.content_type
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # Save file to storage (in production, use cloud storage)
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # Start async processing
    process_document_async.delay(str(document.id), file_path)

    return DocumentUploadResponse(
        id=str(document.id),
        file_name=file.filename,
        status=document.status.value,
        message="Document uploaded successfully and processing started"
    )

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all documents for the current user."""
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific document."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return document
