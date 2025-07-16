# Integrations router
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import hashlib
import secrets
import string

from database import get_db
from models import User, Document, ApiKey, DocumentStatus
from auth_utils import get_current_user
from erp_exports import erp_export_service

router = APIRouter()

# Pydantic models
class ApiKeyCreate(BaseModel):
    description: Optional[str] = None

class ApiKeyResponse(BaseModel):
    id: str
    key_prefix: str
    description: Optional[str]
    is_active: bool
    created_at: str
    last_used_at: Optional[str]

    class Config:
        from_attributes = True

class ApiKeyCreateResponse(BaseModel):
    key: str
    key_info: ApiKeyResponse

class DocumentExportResponse(BaseModel):
    id: str
    file_name: str
    status: str
    final_extracted_data: Optional[dict]
    created_at: str

def generate_api_key() -> tuple[str, str, str]:
    """Generate a new API key with prefix and hash."""
    # Generate random key
    alphabet = string.ascii_letters + string.digits
    key = ''.join(secrets.choice(alphabet) for _ in range(32))

    # Create prefix (first 8 characters)
    prefix = key[:8]

    # Hash the full key
    hashed_key = hashlib.sha256(key.encode()).hexdigest()

    return key, prefix, hashed_key

def verify_api_key(api_key: str, db: Session) -> Optional[User]:
    """Verify an API key and return the associated user."""
    if not api_key or len(api_key) < 8:
        return None

    prefix = api_key[:8]
    hashed_key = hashlib.sha256(api_key.encode()).hexdigest()

    # Find the API key
    db_key = db.query(ApiKey).filter(
        ApiKey.key_prefix == prefix,
        ApiKey.hashed_key == hashed_key,
        ApiKey.is_active == True
    ).first()

    if not db_key:
        return None

    # Update last used timestamp
    from datetime import datetime
    db_key.last_used_at = datetime.utcnow()
    db.commit()

    return db_key.user

async def get_api_user(
    x_api_key: str = Header(...),
    db: Session = Depends(get_db)
) -> User:
    """Get user from API key."""
    user = verify_api_key(x_api_key, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return user

@router.post("/api-keys", response_model=ApiKeyCreateResponse)
async def create_api_key(
    request: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new API key."""
    key, prefix, hashed_key = generate_api_key()

    api_key = ApiKey(
        user_id=current_user.id,
        key_prefix=prefix,
        hashed_key=hashed_key,
        description=request.description,
        is_active=True
    )

    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return ApiKeyCreateResponse(
        key=key,
        key_info=api_key
    )

@router.get("/api-keys", response_model=List[ApiKeyResponse])
async def get_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all API keys for the current user."""
    keys = db.query(ApiKey).filter(ApiKey.user_id == current_user.id).all()
    return keys

@router.delete("/api-keys/{key_id}")
async def deactivate_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate an API key."""
    api_key = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.user_id == current_user.id
    ).first()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    api_key.is_active = False
    db.commit()

    return {"message": "API key deactivated"}

@router.get("/documents", response_model=List[DocumentExportResponse])
async def get_documents_for_export(
    exported: Optional[bool] = None,
    api_user: User = Depends(get_api_user),
    db: Session = Depends(get_db)
):
    """Get documents for export via API."""
    query = db.query(Document).filter(
        Document.user_id == api_user.id,
        Document.status == DocumentStatus.completed
    )

    if exported is not None:
        if exported:
            query = query.filter(Document.status == DocumentStatus.exported)
        else:
            query = query.filter(Document.status != DocumentStatus.exported)

    documents = query.all()
    return documents

@router.get("/documents/{document_id}/export")
async def export_document(
    document_id: str,
    format: str = "json",
    api_user: User = Depends(get_api_user),
    db: Session = Depends(get_db)
):
    """Export a specific document in the requested format."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == api_user.id,
        Document.status == DocumentStatus.completed
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or not ready for export"
        )

    if format == "json":
        # Mark as exported
        document.status = DocumentStatus.exported
        db.commit()

        return {
            "document_id": str(document.id),
            "file_name": document.file_name,
            "extracted_data": document.final_extracted_data,
            "confidence_score": float(document.confidence_score) if document.confidence_score else None,
            "processed_at": document.completed_at.isoformat() if document.completed_at else None
        }

    elif format in ["isdoc", "pohoda_xml"]:
        try:
            # Prepare document info
            document_info = {
                "id": str(document.id),
                "file_name": document.file_name,
                "processed_at": document.completed_at.isoformat() if document.completed_at else None,
                "confidence_score": float(document.confidence_score) if document.confidence_score else None
            }

            # Export to requested format
            xml_content = erp_export_service.export_document(
                extracted_data=document.final_extracted_data or {},
                document_info=document_info,
                format_type=format
            )

            # Mark as exported
            document.status = DocumentStatus.exported
            db.commit()

            # Return XML content with appropriate content type
            from fastapi.responses import Response
            content_type = "application/xml"
            filename = f"{document.file_name}_{format}.xml"

            return Response(
                content=xml_content,
                media_type=content_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating {format} export: {str(e)}"
            )

    else:
        supported_formats = erp_export_service.get_supported_formats()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format. Available: {', '.join(supported_formats)}"
        )

@router.get("/formats")
async def get_supported_formats(api_user: User = Depends(get_api_user)):
    """Get list of supported export formats."""
    return {
        "supported_formats": erp_export_service.get_supported_formats(),
        "format_descriptions": {
            "json": "Raw JSON data extracted from the document",
            "isdoc": "ISDOC XML format (Czech electronic invoice standard)",
            "pohoda_xml": "Pohoda XML format for import into Pohoda accounting software"
        }
    }
