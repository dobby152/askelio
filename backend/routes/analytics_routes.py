from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional
from services.analytics_service import AnalyticsService
from middleware.auth_middleware import get_current_user
from services.company_service import CompanyService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/companies/{company_id}")
async def get_company_analytics(
    company_id: str,
    start_date: Optional[datetime] = Query(None, description="Start date for analytics period"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics period"),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive analytics for a company"""
    try:
        # Verify user has access to company
        company_service = CompanyService()
        company = await company_service.get_company(company_id, current_user["id"])
        
        if not company["success"]:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check if user has analytics permissions
        user_role = company["data"].get("user_role", {})
        if not user_role.get("can_view_analytics", False):
            raise HTTPException(status_code=403, detail="Insufficient permissions to view analytics")
        
        # Get analytics
        analytics_service = AnalyticsService()
        result = await analytics_service.get_company_analytics(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting company analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/companies/{company_id}/overview")
async def get_company_overview(
    company_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get quick overview metrics for a company"""
    try:
        # Verify user has access to company
        company_service = CompanyService()
        company = await company_service.get_company(company_id, current_user["id"])
        
        if not company["success"]:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Get last 30 days analytics
        analytics_service = AnalyticsService()
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        result = await analytics_service.get_company_analytics(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Return only overview metrics
        return {
            "success": True,
            "data": result["data"]["overview"],
            "period": result["period"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting company overview: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/companies/{company_id}/documents")
async def get_document_analytics(
    company_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get document-specific analytics for a company"""
    try:
        # Verify user has access to company
        company_service = CompanyService()
        company = await company_service.get_company(company_id, current_user["id"])
        
        if not company["success"]:
            raise HTTPException(status_code=404, detail="Company not found")
        
        analytics_service = AnalyticsService()
        result = await analytics_service.get_company_analytics(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "data": result["data"]["documents"],
            "period": result["period"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/companies/{company_id}/approvals")
async def get_approval_analytics(
    company_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get approval workflow analytics for a company"""
    try:
        # Verify user has access to company
        company_service = CompanyService()
        company = await company_service.get_company(company_id, current_user["id"])
        
        if not company["success"]:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check if user has approval permissions
        user_role = company["data"].get("user_role", {})
        if not user_role.get("can_view_analytics", False):
            raise HTTPException(status_code=403, detail="Insufficient permissions to view approval analytics")
        
        analytics_service = AnalyticsService()
        result = await analytics_service.get_company_analytics(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "data": result["data"]["approvals"],
            "period": result["period"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting approval analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/companies/{company_id}/users")
async def get_user_analytics(
    company_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get user activity analytics for a company"""
    try:
        # Verify user has access to company
        company_service = CompanyService()
        company = await company_service.get_company(company_id, current_user["id"])
        
        if not company["success"]:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check if user can manage users or view analytics
        user_role = company["data"].get("user_role", {})
        if not (user_role.get("can_manage_users", False) or user_role.get("can_view_analytics", False)):
            raise HTTPException(status_code=403, detail="Insufficient permissions to view user analytics")
        
        analytics_service = AnalyticsService()
        result = await analytics_service.get_company_analytics(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "data": result["data"]["users"],
            "period": result["period"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/companies/{company_id}/storage")
async def get_storage_analytics(
    company_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get storage usage analytics for a company"""
    try:
        # Verify user has access to company
        company_service = CompanyService()
        company = await company_service.get_company(company_id, current_user["id"])
        
        if not company["success"]:
            raise HTTPException(status_code=404, detail="Company not found")
        
        analytics_service = AnalyticsService()
        result = await analytics_service.get_company_analytics(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "data": result["data"]["storage"],
            "period": result["period"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting storage analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/companies/{company_id}/trends")
async def get_trend_analytics(
    company_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get trend analysis for a company"""
    try:
        # Verify user has access to company
        company_service = CompanyService()
        company = await company_service.get_company(company_id, current_user["id"])
        
        if not company["success"]:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check if user has analytics permissions
        user_role = company["data"].get("user_role", {})
        if not user_role.get("can_view_analytics", False):
            raise HTTPException(status_code=403, detail="Insufficient permissions to view trend analytics")
        
        analytics_service = AnalyticsService()
        result = await analytics_service.get_company_analytics(
            company_id=company_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "data": result["data"]["trends"],
            "period": result["period"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trend analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/companies/{company_id}/export")
async def export_analytics(
    company_id: str,
    format: str = Query("csv", description="Export format: csv or json"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Export analytics data in specified format"""
    try:
        # Verify user has access to company
        company_service = CompanyService()
        company = await company_service.get_company(company_id, current_user["id"])
        
        if not company["success"]:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check if user can export data
        user_role = company["data"].get("user_role", {})
        if not user_role.get("can_export_data", False):
            raise HTTPException(status_code=403, detail="Insufficient permissions to export analytics")
        
        # Validate format
        if format.lower() not in ["csv", "json"]:
            raise HTTPException(status_code=400, detail="Invalid export format. Use 'csv' or 'json'")
        
        analytics_service = AnalyticsService()
        result = await analytics_service.export_analytics(
            company_id=company_id,
            format=format,
            start_date=start_date,
            end_date=end_date
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/system")
async def get_system_analytics(
    current_user: dict = Depends(get_current_user)
):
    """Get system-wide analytics (admin only)"""
    try:
        # Check if user is system admin
        if not current_user.get("is_admin", False):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        analytics_service = AnalyticsService()
        result = await analytics_service.get_system_analytics()
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting system analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/companies/{company_id}/realtime")
async def get_realtime_metrics(
    company_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get real-time metrics for dashboard"""
    try:
        # Verify user has access to company
        company_service = CompanyService()
        company = await company_service.get_company(company_id, current_user["id"])
        
        if not company["success"]:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Get today's metrics
        analytics_service = AnalyticsService()
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        result = await analytics_service.get_company_analytics(
            company_id=company_id,
            start_date=today,
            end_date=tomorrow
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Return simplified real-time metrics
        overview = result["data"]["overview"]
        return {
            "success": True,
            "data": {
                "documents_today": overview.get("documents_this_period", 0),
                "pending_approvals": overview.get("pending_approvals", 0),
                "active_users": overview.get("active_users", 0),
                "storage_used_gb": overview.get("total_storage_gb", 0),
                "last_updated": datetime.now().isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting realtime metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
