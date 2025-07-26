"""
Company Routes - API endpoints pro správu firem
Company management API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging

from services.company_service import CompanyService
from services.approval_service import ApprovalService
from middleware.auth_middleware import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/companies", tags=["companies"])
security = HTTPBearer()

# ===== PYDANTIC MODELS =====

class CreateCompanyRequest(BaseModel):
    name: str
    legal_name: Optional[str] = None
    registration_number: Optional[str] = None
    tax_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "CZ"
    billing_email: Optional[str] = None

class UpdateCompanyRequest(BaseModel):
    name: Optional[str] = None
    legal_name: Optional[str] = None
    registration_number: Optional[str] = None
    tax_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    billing_email: Optional[str] = None
    approval_workflow_enabled: Optional[bool] = None

class InviteUserRequest(BaseModel):
    email: str
    role_name: str

class UpdateUserRoleRequest(BaseModel):
    role_name: str

class UpgradePlanRequest(BaseModel):
    plan_name: str

class ApprovalActionRequest(BaseModel):
    notes: Optional[str] = None

# ===== COMPANY ENDPOINTS =====

@router.post("/")
async def create_company(
    request: CreateCompanyRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Create new company"""
    try:
        company_service = CompanyService()
        result = await company_service.create_company(
            user_id=current_user["id"],
            company_data=request.dict()
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
        logger.error(f"Error creating company: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/")
async def get_user_companies(
    current_user: Dict = Depends(get_current_user)
):
    """Get all companies for current user"""
    try:
        company_service = CompanyService()
        result = await company_service.get_user_companies(current_user["id"])
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user companies: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{company_id}")
async def get_company_details(
    company_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get detailed company information"""
    try:
        company_service = CompanyService()
        result = await company_service.get_company_details(company_id, current_user["id"])
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "Access denied" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting company details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.put("/{company_id}")
async def update_company(
    company_id: str,
    request: UpdateCompanyRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Update company information"""
    try:
        company_service = CompanyService()
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        
        result = await company_service.update_company(company_id, current_user["id"], update_data)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "Permission denied" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating company: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# ===== PLAN ENDPOINTS =====

@router.get("/plans/available")
async def get_available_plans():
    """Get all available company plans"""
    try:
        company_service = CompanyService()
        result = await company_service.get_available_plans()
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting plans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/{company_id}/upgrade-plan")
async def upgrade_company_plan(
    company_id: str,
    request: UpgradePlanRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Upgrade company plan"""
    try:
        company_service = CompanyService()
        result = await company_service.upgrade_company_plan(
            company_id, current_user["id"], request.plan_name
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "Permission denied" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upgrading plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{company_id}/limits/{limit_type}")
async def check_company_limits(
    company_id: str,
    limit_type: str,
    current_user: Dict = Depends(get_current_user)
):
    """Check company usage limits"""
    try:
        if limit_type not in ['users', 'documents', 'storage']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid limit type"
            )
        
        company_service = CompanyService()
        result = await company_service.check_company_limits(company_id, limit_type)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking limits: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# ===== USER MANAGEMENT ENDPOINTS =====

@router.post("/{company_id}/users/invite")
async def invite_user(
    company_id: str,
    request: InviteUserRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Invite user to company"""
    try:
        company_service = CompanyService()
        result = await company_service.invite_user(
            company_id, current_user["id"], request.email, request.role_name
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "Permission denied" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inviting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.delete("/{company_id}/users/{user_id}")
async def remove_user(
    company_id: str,
    user_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Remove user from company"""
    try:
        company_service = CompanyService()
        result = await company_service.remove_user(company_id, current_user["id"], user_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "Permission denied" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.put("/{company_id}/users/{user_id}/role")
async def update_user_role(
    company_id: str,
    user_id: str,
    request: UpdateUserRoleRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Update user role in company"""
    try:
        company_service = CompanyService()
        result = await company_service.update_user_role(
            company_id, current_user["id"], user_id, request.role_name
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN if "Permission denied" in result["error"] else status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user role: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
