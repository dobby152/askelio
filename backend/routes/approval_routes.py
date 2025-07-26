"""
Approval Routes - API endpoints pro schvalovací workflow
Document approval workflow API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging

from ..services.approval_service import ApprovalService
from ..middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/approvals", tags=["approvals"])
security = HTTPBearer()

# ===== PYDANTIC MODELS =====

class CreateApprovalRequest(BaseModel):
    document_id: str
    company_id: str
    priority: str = "normal"

class ApprovalActionRequest(BaseModel):
    notes: Optional[str] = None

# ===== APPROVAL WORKFLOW ENDPOINTS =====

@router.post("/")
async def create_approval_workflow(
    request: CreateApprovalRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Create approval workflow for document"""
    try:
        approval_service = ApprovalService()
        result = await approval_service.create_approval_workflow(
            document_id=request.document_id,
            company_id=request.company_id,
            creator_id=current_user["id"],
            priority=request.priority
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating approval workflow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/{approval_id}/approve")
async def approve_document(
    approval_id: str,
    request: ApprovalActionRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Approve document in workflow"""
    try:
        approval_service = ApprovalService()
        result = await approval_service.approve_document(
            approval_id=approval_id,
            approver_id=current_user["id"],
            notes=request.notes
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "Not authorized" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/{approval_id}/reject")
async def reject_document(
    approval_id: str,
    request: ApprovalActionRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Reject document in workflow"""
    try:
        if not request.notes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection reason is required"
            )
        
        approval_service = ApprovalService()
        result = await approval_service.reject_document(
            approval_id=approval_id,
            rejector_id=current_user["id"],
            notes=request.notes
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "Not authorized" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/pending")
async def get_pending_approvals(
    company_id: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Get pending approvals for current user"""
    try:
        approval_service = ApprovalService()
        result = await approval_service.get_pending_approvals(
            user_id=current_user["id"],
            company_id=company_id
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting pending approvals: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/document/{document_id}/history")
async def get_approval_history(
    document_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get approval history for document"""
    try:
        approval_service = ApprovalService()
        result = await approval_service.get_approval_history(
            document_id=document_id,
            user_id=current_user["id"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "Access denied" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting approval history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/company/{company_id}/stats")
async def get_company_approval_stats(
    company_id: str,
    days: int = 30,
    current_user: Dict = Depends(get_current_user)
):
    """Get approval statistics for company"""
    try:
        if days < 1 or days > 365:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Days must be between 1 and 365"
            )
        
        approval_service = ApprovalService()
        result = await approval_service.get_company_approvals_stats(
            company_id=company_id,
            user_id=current_user["id"],
            days=days
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "Access denied" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting approval stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
