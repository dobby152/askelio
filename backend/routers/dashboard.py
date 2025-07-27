"""
Dashboard API Router
API endpointy pro dashboard data
"""

import logging
from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import Dict, Any
from decimal import Decimal
from datetime import datetime, date, timedelta
import random
import json

from middleware.auth_middleware import get_current_user
from services.document_service import document_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/test")
async def test_dashboard_endpoint():
    """Simple test endpoint for dashboard router"""
    logger.info("🧪 Dashboard test endpoint called")
    return {"success": True, "message": "Dashboard router is working!", "timestamp": datetime.now().isoformat()}


@router.get("/test-auth")
async def test_dashboard_auth_endpoint(current_user: dict = Depends(get_current_user)):
    """Test endpoint with authentication"""
    logger.info(f"🧪 Dashboard auth test endpoint called for user: {current_user['id']}")
    return {"success": True, "message": "Dashboard auth is working!", "user_id": current_user['id'], "timestamp": datetime.now().isoformat()}


@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Get dashboard statistics including financial metrics and trends for the current user
    """
    try:
        user_id = current_user['id']
        logger.info(f"📊 Router: Fetching dashboard stats for user: {user_id}")

        # Get user's companies
        from services.company_service import CompanyService
        from services.analytics_service import AnalyticsService

        company_service = CompanyService()
        companies_result = await company_service.get_user_companies(user_id)

        if not companies_result['success'] or not companies_result['data']:
            logger.warning(f"📊 Router: No companies found for user {user_id}")
            # Return empty stats if no company
            return {
                "success": True,
                "data": {
                    "totalIncome": 0,
                    "totalExpenses": 0,
                    "netProfit": 0,
                    "remainingCredits": 1000,
                    "processedDocuments": 0,
                    "trends": {
                        "income": 0,
                        "expenses": 0,
                        "profit": 0,
                        "credits": 0
                    }
                },
                "meta": {
                    "timestamp": datetime.now().isoformat(),
                    "currency": "CZK"
                }
            }

        # Get first company (for now, later we can support multiple companies)
        company = companies_result['data'][0]['companies']
        company_id = company['id']
        logger.info(f"📊 Router: Using company {company_id} for user {user_id}")

        # Get analytics data
        analytics_service = AnalyticsService()
        analytics_result = await analytics_service.get_company_analytics(company_id)

        if not analytics_result['success']:
            logger.error(f"📊 Router: Failed to get analytics: {analytics_result.get('error')}")
            raise HTTPException(status_code=500, detail="Failed to get analytics data")

        # Extract overview metrics
        overview = analytics_result['data']['overview']

        # Map analytics data to dashboard stats format
        stats = {
            "success": True,
            "data": {
                "totalIncome": overview.get('total_income', 0),
                "totalExpenses": overview.get('total_expenses', 0),
                "netProfit": overview.get('net_profit', 0),
                "remainingCredits": 1000,  # This would come from user service
                "processedDocuments": overview.get('total_documents', 0),
                "trends": {
                    "income": 0,  # Would need trend calculation
                    "expenses": 0,
                    "profit": 0,
                    "credits": 0
                }
            },
            "meta": {
                "timestamp": datetime.now().isoformat(),
                "currency": "CZK",
                "company_id": company_id,
                "company_name": company['name']
            }
        }

        logger.info(f"📊 Router: Returning real analytics data for user {user_id}")
        return stats

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get dashboard stats for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")


@router.get("/overview")
async def get_dashboard_overview():
    """
    Získá kompletní dashboard přehled
    Vrací mock data pro demonstraci
    """
    try:
        logger.info("Dashboard overview request")
        
        # Mock data pro demonstraci
        current_date = datetime.now()
        
        # Generujeme realistická mock data
        total_income = 450000 + random.randint(-50000, 100000)
        total_expenses = 320000 + random.randint(-30000, 50000)
        net_profit = total_income - total_expenses
        
        # Změny oproti minulému období
        income_change = random.uniform(-10, 25)
        expenses_change = random.uniform(-15, 20)
        profit_change = random.uniform(-20, 40)
        
        dashboard_data = {
            "financial_overview": {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "net_profit": net_profit,
                "income_change_percent": income_change,
                "expenses_change_percent": expenses_change,
                "profit_change_percent": profit_change
            },
            "quick_stats": {
                "pending_invoices_count": random.randint(3, 12),
                "overdue_invoices_count": random.randint(0, 5),
                "total_pending_amount": random.randint(50000, 200000),
                "total_overdue_amount": random.randint(0, 80000),
                "this_month_income": random.randint(80000, 150000),
                "this_month_expenses": random.randint(60000, 120000)
            },
            "recent_transactions": [
                {
                    "id": "1",
                    "type": "income",
                    "description": "Platba od ABC Corporation",
                    "amount": 85000,
                    "date": (current_date - timedelta(days=1)).isoformat(),
                    "status": "completed"
                },
                {
                    "id": "2", 
                    "type": "expense",
                    "description": "Nákup kancelářských potřeb",
                    "amount": 12500,
                    "date": (current_date - timedelta(days=2)).isoformat(),
                    "status": "completed"
                },
                {
                    "id": "3",
                    "type": "income", 
                    "description": "Konzultační služby",
                    "amount": 45000,
                    "date": (current_date - timedelta(days=3)).isoformat(),
                    "status": "pending"
                },
                {
                    "id": "4",
                    "type": "expense",
                    "description": "Marketingová kampaň",
                    "amount": 28000,
                    "date": (current_date - timedelta(days=4)).isoformat(),
                    "status": "completed"
                }
            ],
            "ai_insights": [
                {
                    "type": "positive",
                    "title": "Pozitivní trend",
                    "description": f"Příjmy rostou o {income_change:.1f}% oproti minulému období",
                    "icon": "trending-up"
                },
                {
                    "type": "warning",
                    "title": "Upozornění",
                    "description": "3 faktury s blížící se splatností",
                    "icon": "alert-triangle"
                },
                {
                    "type": "goal",
                    "title": "Cíl splněn",
                    "description": "Měsíční cíl zisku na 89%",
                    "icon": "target"
                }
            ],
            "chart_data": {
                "income_trend": [
                    {"date": "2025-01-01", "value": 120000},
                    {"date": "2025-01-02", "value": 135000},
                    {"date": "2025-01-03", "value": 128000},
                    {"date": "2025-01-04", "value": 142000},
                    {"date": "2025-01-05", "value": 155000},
                    {"date": "2025-01-06", "value": 148000},
                    {"date": "2025-01-07", "value": 162000}
                ],
                "expense_categories": [
                    {"category": "Kancelářské potřeby", "amount": 45000, "percentage": 25},
                    {"category": "Marketing", "amount": 36000, "percentage": 20},
                    {"category": "IT služby", "amount": 27000, "percentage": 15},
                    {"category": "Cestovné", "amount": 18000, "percentage": 10},
                    {"category": "Ostatní", "amount": 54000, "percentage": 30}
                ]
            }
        }
        
        return {
            "success": True,
            "message": "Dashboard data loaded successfully",
            "data": dashboard_data
        }
        
    except Exception as e:
        logger.error(f"Dashboard overview error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/financial-stats")
async def get_financial_stats(
    period_days: int = Query(30, ge=1, le=365, description="Number of days to analyze")
):
    """
    Získá finanční statistiky pro zadané období
    """
    try:
        logger.info(f"Financial stats request, period: {period_days} days")
        
        # Mock data založená na období
        base_income = 400000 * (period_days / 30)
        base_expenses = 280000 * (period_days / 30)
        
        total_income = base_income + random.randint(-50000, 100000)
        total_expenses = base_expenses + random.randint(-30000, 50000)
        net_profit = total_income - total_expenses
        
        return {
            "success": True,
            "message": "Financial statistics loaded successfully",
            "data": {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "net_profit": net_profit,
                "income_change_percent": random.uniform(-10, 25),
                "expenses_change_percent": random.uniform(-15, 20),
                "profit_change_percent": random.uniform(-20, 40),
                "period_days": period_days
            }
        }
        
    except Exception as e:
        logger.error(f"Financial stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/recent-activity")
async def get_recent_activity(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50, description="Number of activities to return")
):
    """
    Získá nedávnou aktivitu pro aktuálního uživatele
    """
    try:
        user_id = current_user['id']
        logger.info(f"📋 Router: Recent activity request for user {user_id}, limit: {limit}")

        # Get recent documents using Supabase service
        result = await document_service.get_recent_documents(str(user_id), limit=limit)

        if not result['success']:
            logger.error(f"📋 Router: Failed to get recent documents: {result.get('error')}")
            return {
                "success": True,
                "message": "Recent activity loaded successfully",
                "data": []
            }

        recent_docs = result['data'] or []
        activities = []

        for doc in recent_docs:
            # Extract supplier name and amount from extracted fields
            supplier_name = "Neznámý dodavatel"
            amount = None

            # Get extracted fields for this document
            if doc.get('extracted_fields'):
                for field in doc['extracted_fields']:
                    if field.get('field_name') == "supplier_name" and field.get('field_value'):
                        supplier_name = field['field_value']
                    elif field.get('field_name') == "total_amount" and field.get('field_value'):
                        amount = field['field_value']

            # Calculate time difference
            created_at_str = doc.get('created_at')
            if created_at_str:
                try:
                    # Parse ISO datetime string
                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                    time_diff = datetime.now() - created_at.replace(tzinfo=None)

                    if time_diff.days > 0:
                        time_desc = f"před {time_diff.days} dny"
                    elif time_diff.seconds > 3600:
                        hours = time_diff.seconds // 3600
                        time_desc = f"před {hours} hodinami"
                    else:
                        minutes = max(1, time_diff.seconds // 60)
                        time_desc = f"před {minutes} minutami"
                except:
                    time_desc = "nedávno"
            else:
                time_desc = "nedávno"

            activities.append({
                "id": str(doc.get('id')),
                "type": "invoice",
                "title": f"Nová faktura od {supplier_name}",
                "description": time_desc,
                "amount": f"{amount} CZK" if amount else None,
                "time": time_desc,
                "icon": "FileText",
                "color": "blue"
            })

        logger.info(f"📋 Router: Found {len(activities)} real activities for user {user_id}")

        # Return activities (empty array if no documents)
        return {
            "success": True,
            "message": "Recent activity loaded successfully",
            "data": activities
        }

    except Exception as e:
        logger.error(f"📋 Router: Recent activity error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/ai-insights")
async def get_ai_insights(current_user: dict = Depends(get_current_user)):
    """
    Získá AI doporučení a insights pomocí skutečného AI
    """
    try:
        logger.info("AI insights request")

        # Get user's actual financial data
        stats_response = await get_dashboard_stats(current_user)
        stats_data = stats_response['data']
        user_stats = {
            'totalIncome': stats_data['totalIncome'],
            'totalExpenses': stats_data['totalExpenses'],
            'netProfit': stats_data['netProfit']
        }

        # Generate fallback insights based on actual data
        insights = []

        net_profit = user_stats['netProfit']
        total_income = user_stats['totalIncome']
        total_expenses = user_stats['totalExpenses']

        if net_profit > 0:
            insights.append({
                "type": "positive",
                "title": "Pozitivní zisk",
                "description": f"Váš zisk je {net_profit:,.0f} CZK",
                "icon": "trending-up",
                "priority": "high"
            })
        elif net_profit < 0:
            insights.append({
                "type": "warning",
                "title": "Záporný zisk",
                "description": f"Ztráta {abs(net_profit):,.0f} CZK - doporučujeme snížit výdaje",
                "icon": "trending-down",
                "priority": "high"
            })
        else:
            insights.append({
                "type": "info",
                "title": "Vyrovnaný rozpočet",
                "description": "Příjmy a výdaje jsou vyrovnané",
                "icon": "bar-chart",
                "priority": "medium"
            })

        if total_expenses > 0 and total_income > 0:
            expense_ratio = (total_expenses / total_income * 100)
            if expense_ratio > 80:
                insights.append({
                    "type": "warning",
                    "title": "Vysoké výdaje",
                    "description": f"Výdaje tvoří {expense_ratio:.1f}% příjmů - zvažte optimalizaci",
                    "icon": "alert-triangle",
                    "priority": "medium"
                })
            else:
                insights.append({
                    "type": "positive",
                    "title": "Zdravý poměr výdajů",
                    "description": f"Výdaje tvoří {expense_ratio:.1f}% příjmů",
                    "icon": "check-circle",
                    "priority": "low"
                })

        if total_income > 0:
            insights.append({
                "type": "info",
                "title": "Celkové příjmy",
                "description": f"Za období {total_income:,.0f} CZK",
                "icon": "dollar-sign",
                "priority": "low"
            })

        # Limit to 4 insights
        insights = insights[:4]

        return {
            "success": True,
            "message": "AI insights loaded successfully",
            "data": insights
        }

    except Exception as e:
        logger.error(f"AI insights error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

def _get_icon_for_type(insight_type: str) -> str:
    """Get appropriate icon for insight type"""
    icon_map = {
        "positive": "trending-up",
        "warning": "alert-triangle",
        "negative": "trending-down",
        "info": "lightbulb",
        "goal": "target"
    }
    return icon_map.get(insight_type, "lightbulb")

@router.get("/ai-insights-demo")
async def get_ai_insights_demo():
    """
    Demo AI insights bez autentizace
    """
    try:
        logger.info("Demo AI insights request")

        # Import AI service
        from services.ai_service import ai_service

        # Use demo financial data
        demo_stats = {
            'totalIncome': 150000,
            'totalExpenses': 120000,
            'netProfit': 30000
        }

        # Generate AI insights
        ai_insights = await ai_service.generate_insights(demo_stats)

        # Convert AI insights to expected format
        insights = []
        for insight in ai_insights:
            insights.append({
                "type": insight.get("type", "info"),
                "title": insight.get("title", "AI Doporučení"),
                "description": insight.get("description", "Analýza finančních dat"),
                "icon": _get_icon_for_type(insight.get("type", "info")),
                "priority": "medium"
            })

        return {
            "success": True,
            "message": "AI insights loaded successfully",
            "data": insights[:4]  # Limit to 4 insights
        }

    except Exception as e:
        logger.error(f"Demo AI insights error: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@router.post("/ai-chat")
async def ai_chat(request: dict, current_user: dict = Depends(get_current_user)):
    """
    AI chat endpoint pro finanční dotazy
    """
    try:
        message = request.get("message", "")
        if not message:
            return {"success": False, "error": "Message is required"}

        # Import AI service
        from services.ai_service import ai_service

        # Get user's actual financial context
        stats_response = await get_dashboard_stats(current_user)
        stats_data = stats_response['data']
        financial_context = {
            'totalIncome': stats_data['totalIncome'],
            'totalExpenses': stats_data['totalExpenses']
        }

        # Generate AI response
        ai_response = await ai_service.chat_response(message, financial_context)

        return {
            "success": True,
            "data": {
                "response": ai_response,
                "timestamp": datetime.now().isoformat()
            }
        }

    except Exception as e:
        logger.error(f"Error in AI chat: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@router.get("/documents")
async def get_user_documents(current_user: dict = Depends(get_current_user)):
    """
    Get documents for the current user
    """
    try:
        logger.info(f"Getting documents for user {current_user['id']}")

        # Import document service
        from services.document_service import document_service

        # Get user documents
        result = await document_service.get_user_documents(str(current_user['id']))

        if result['success']:
            return result['data']
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result['error']
            )

    except Exception as e:
        logger.error(f"Error getting user documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get documents: {str(e)}"
        )


@router.get("/documents/{document_id}")
async def get_user_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get specific document for the current user
    """
    try:
        logger.info(f"Getting document {document_id} for user {current_user['id']}")

        # Import document service
        from services.document_service import document_service

        # Get document
        result = await document_service.get_document_by_id(document_id, str(current_user['id']))

        if not result['success']:
            if 'not found' in result['error'].lower():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Document not found"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=result['error']
                )

        return result['data']

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document {document_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get document: {str(e)}"
        )


@router.delete("/documents/{document_id}")
async def delete_user_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete specific document for the current user
    """
    try:
        logger.info(f"Deleting document {document_id} for user {current_user['id']}")

        # Import document service
        from services.document_service import document_service

        # Delete document
        result = await document_service.delete_document(document_id, str(current_user['id']))

        if not result['success']:
            if 'not found' in result['error'].lower():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Document not found"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=result['error']
                )

        return {"success": True, "message": "Document deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )


@router.get("/monthly-data")
async def get_monthly_data(current_user: dict = Depends(get_current_user)):
    """
    Get monthly financial data for charts based on real analytics data
    """
    try:
        user_id = current_user['id']
        logger.info(f"Getting monthly data for user {user_id}")

        # Get user's companies
        from services.company_service import CompanyService
        from services.analytics_service import AnalyticsService

        company_service = CompanyService()
        companies_result = await company_service.get_user_companies(user_id)

        if not companies_result['success'] or not companies_result['data']:
            logger.warning(f"No companies found for user {user_id}")
            return {
                "success": True,
                "data": [],
                "meta": {
                    "timestamp": datetime.now().isoformat(),
                    "currency": "CZK"
                }
            }

        # Get first company
        company = companies_result['data'][0]['companies']
        company_id = company['id']

        # Get analytics data
        analytics_service = AnalyticsService()
        analytics_result = await analytics_service.get_company_analytics(company_id)

        if not analytics_result['success']:
            logger.error(f"Failed to get analytics: {analytics_result.get('error')}")
            return {
                "success": True,
                "data": [],
                "meta": {
                    "timestamp": datetime.now().isoformat(),
                    "currency": "CZK"
                }
            }

        # Extract monthly data from trends
        trends = analytics_result['data']['trends']
        monthly_data = trends.get('monthly_data', [])

        return {
            "success": True,
            "data": monthly_data,
            "meta": {
                "timestamp": datetime.now().isoformat(),
                "currency": "CZK",
                "company_id": company_id,
                "company_name": company['name']
            }
        }

    except Exception as e:
        logger.error(f"Error getting monthly data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get monthly data: {str(e)}"
        )


@router.get("/expense-categories")
async def get_expense_categories(current_user: dict = Depends(get_current_user)):
    """
    Get expense categories for pie chart based on real analytics data
    """
    try:
        user_id = current_user['id']
        logger.info(f"Getting expense categories for user {user_id}")

        # Get user's companies
        from services.company_service import CompanyService
        from services.analytics_service import AnalyticsService

        company_service = CompanyService()
        companies_result = await company_service.get_user_companies(user_id)

        if not companies_result['success'] or not companies_result['data']:
            logger.warning(f"No companies found for user {user_id}")
            return {
                "success": True,
                "data": [],
                "meta": {
                    "timestamp": datetime.now().isoformat()
                }
            }

        # Get first company
        company = companies_result['data'][0]['companies']
        company_id = company['id']

        # Get analytics data
        analytics_service = AnalyticsService()
        analytics_result = await analytics_service.get_company_analytics(company_id)

        if not analytics_result['success']:
            logger.error(f"Failed to get analytics: {analytics_result.get('error')}")
            return {
                "success": True,
                "data": [],
                "meta": {
                    "timestamp": datetime.now().isoformat()
                }
            }

        # Extract expense categories from trends
        trends = analytics_result['data']['trends']
        expense_categories = trends.get('expense_categories', [])

        # Convert to expected format
        categories = []
        for category in expense_categories:
            categories.append({
                "name": category.get('category', 'Unknown'),
                "value": category.get('percentage', 0),
                "color": category.get('color', '#3b82f6')
            })

        return {
            "success": True,
            "data": categories,
            "meta": {
                "timestamp": datetime.now().isoformat(),
                "company_id": company_id,
                "company_name": company['name']
            }
        }

    except Exception as e:
        logger.error(f"Error getting expense categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get expense categories: {str(e)}"
        )
