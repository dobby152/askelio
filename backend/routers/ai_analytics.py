#!/usr/bin/env python3
"""
AI Analytics Router - Advanced analytics endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta

from middleware.auth_middleware import get_current_user
from services.ai_analytics_service import ai_analytics_service
from routers.dashboard import get_user_financial_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-analytics", tags=["AI Analytics"])

@router.get("/predictions/{prediction_type}")
async def get_prediction(
    prediction_type: str,
    period_days: int = Query(30, description="Prediction period in days"),
    current_user: dict = Depends(get_current_user)
):
    """Get AI prediction for specific metric"""
    try:
        logger.info(f"🔮 AI Analytics: Generating {prediction_type} prediction for user {current_user['id']}")
        
        # Get user's financial data
        financial_data = await get_user_financial_data(current_user['id'])
        
        # Generate prediction
        prediction = await ai_analytics_service.generate_predictive_analysis(
            financial_data, prediction_type, period_days
        )
        
        return {
            "success": True,
            "data": {
                "prediction_type": prediction_type,
                "period_days": period_days,
                "predicted_value": prediction.value,
                "confidence": prediction.confidence,
                "trend": prediction.trend,
                "factors": prediction.factors,
                "generated_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/widgets/{widget_type}/data")
async def get_widget_data(
    widget_type: str,
    config: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Get data for analytics widget"""
    try:
        logger.info(f"📊 AI Analytics: Generating widget data for {widget_type}")
        
        # Get user's financial data
        financial_data = await get_user_financial_data(current_user['id'])
        
        # Generate widget data
        widget_data = await ai_analytics_service.generate_widget_data(
            widget_type, config, financial_data
        )
        
        return {
            "success": True,
            "data": widget_data,
            "widget_type": widget_type,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating widget data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare-periods")
async def compare_periods(
    period_a_start: str,
    period_a_end: str,
    period_b_start: str,
    period_b_end: str,
    current_user: dict = Depends(get_current_user)
):
    """Compare two time periods"""
    try:
        logger.info(f"📊 AI Analytics: Comparing periods for user {current_user['id']}")
        
        # For now, use current financial data as both periods
        # In production, fetch actual historical data for the specified periods
        financial_data = await get_user_financial_data(current_user['id'])
        
        # Simulate period A (current) and period B (previous with some variation)
        period_a_data = financial_data
        period_b_data = {
            'totalIncome': financial_data.get('totalIncome', 0) * 0.9,  # 10% lower
            'totalExpenses': financial_data.get('totalExpenses', 0) * 1.05,  # 5% higher
            'netProfit': financial_data.get('netProfit', 0) * 0.85  # 15% lower
        }
        
        # Compare periods
        comparison = await ai_analytics_service.compare_periods(period_a_data, period_b_data)
        
        return {
            "success": True,
            "data": {
                "period_a": {
                    "start": period_a_start,
                    "end": period_a_end,
                    "data": period_a_data
                },
                "period_b": {
                    "start": period_b_start,
                    "end": period_b_end,
                    "data": period_b_data
                },
                "comparison": comparison,
                "generated_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error comparing periods: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights/advanced")
async def get_advanced_insights(
    current_user: dict = Depends(get_current_user)
):
    """Get advanced AI insights and recommendations"""
    try:
        logger.info(f"🤖 AI Analytics: Generating advanced insights for user {current_user['id']}")
        
        # Get user's financial data
        financial_data = await get_user_financial_data(current_user['id'])
        
        # Generate multiple predictions
        revenue_prediction = await ai_analytics_service.generate_predictive_analysis(
            financial_data, "revenue", 30
        )
        expense_prediction = await ai_analytics_service.generate_predictive_analysis(
            financial_data, "expenses", 30
        )
        cashflow_prediction = await ai_analytics_service.generate_predictive_analysis(
            financial_data, "cashflow", 30
        )
        
        # Generate insights widget data
        insights_data = await ai_analytics_service.generate_widget_data(
            "ai-insights", {"aiAnalysis": True}, financial_data
        )
        
        return {
            "success": True,
            "data": {
                "predictions": {
                    "revenue": {
                        "value": revenue_prediction.value,
                        "confidence": revenue_prediction.confidence,
                        "trend": revenue_prediction.trend,
                        "factors": revenue_prediction.factors
                    },
                    "expenses": {
                        "value": expense_prediction.value,
                        "confidence": expense_prediction.confidence,
                        "trend": expense_prediction.trend,
                        "factors": expense_prediction.factors
                    },
                    "cashflow": {
                        "value": cashflow_prediction.value,
                        "confidence": cashflow_prediction.confidence,
                        "trend": cashflow_prediction.trend,
                        "factors": cashflow_prediction.factors
                    }
                },
                "insights": insights_data.get("insights", []),
                "summary": insights_data.get("summary", ""),
                "generated_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating advanced insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/financial-metrics")
async def get_financial_metrics(
    current_user: dict = Depends(get_current_user)
):
    """Get financial metrics analysis"""
    try:
        logger.info(f"📊 AI Analytics: Generating financial metrics for user {current_user['id']}")

        # Get user's financial data
        financial_data = await get_user_financial_data(current_user['id'])

        # Calculate realistic financial metrics
        income = financial_data.get('totalIncome', 0)
        expenses = financial_data.get('totalExpenses', 0)
        profit = financial_data.get('netProfit', 0)

        profit_margin = (profit / income * 100) if income > 0 else 0
        expense_ratio = (expenses / income * 100) if income > 0 else 0

        # Determine financial health
        if profit_margin > 15:
            health_status = "excellent"
            health_description = "Výborná finanční kondice"
        elif profit_margin > 5:
            health_status = "good"
            health_description = "Dobrá finanční kondice"
        elif profit_margin > 0:
            health_status = "fair"
            health_description = "Přijatelná finanční kondice"
        else:
            health_status = "poor"
            health_description = "Slabá finanční kondice"

        return {
            "success": True,
            "data": {
                "profit_margin": profit_margin,
                "expense_ratio": expense_ratio,
                "health_status": health_status,
                "health_description": health_description,
                "recommendations": [
                    "Sledujte měsíční trendy ziskovosti",
                    "Optimalizujte největší nákladové položky",
                    "Diverzifikujte zdroje příjmů"
                ],
                "generated_at": datetime.now().isoformat()
            }
        }

    except Exception as e:
        logger.error(f"❌ Error generating financial metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/risk-analysis")
async def get_risk_analysis(
    current_user: dict = Depends(get_current_user)
):
    """Get risk analysis and factors"""
    try:
        logger.info(f"⚠️ AI Analytics: Generating risk analysis for user {current_user['id']}")
        
        # Get user's financial data
        financial_data = await get_user_financial_data(current_user['id'])
        
        # Calculate risk factors
        income = financial_data.get('totalIncome', 0)
        expenses = financial_data.get('totalExpenses', 0)
        profit = financial_data.get('netProfit', 0)
        
        # Risk assessment
        risk_factors = []
        
        # Cash flow risk
        if expenses > income * 0.9:
            risk_factors.append({
                "type": "cash_flow",
                "level": "high",
                "description": "Vysoký poměr výdajů k příjmům",
                "impact": "Riziko cash flow problémů"
            })
        
        # Profitability risk
        if profit < income * 0.1:
            risk_factors.append({
                "type": "profitability", 
                "level": "medium",
                "description": "Nízká ziskovost",
                "impact": "Omezená finanční rezerva"
            })
        
        # Mock additional risk factors
        risk_factors.extend([
            {
                "type": "late_payments",
                "level": "high",
                "description": "Pozdní platby zákazníků",
                "impact": "Narušení cash flow"
            },
            {
                "type": "seasonality",
                "level": "medium", 
                "description": "Sezónní výkyvy",
                "impact": "Nepředvídatelné příjmy"
            },
            {
                "type": "competition",
                "level": "low",
                "description": "Konkurenční tlak",
                "impact": "Možný pokles marží"
            }
        ])
        
        # Overall risk score
        high_risks = len([r for r in risk_factors if r["level"] == "high"])
        medium_risks = len([r for r in risk_factors if r["level"] == "medium"])
        
        overall_risk = "high" if high_risks >= 2 else "medium" if high_risks >= 1 or medium_risks >= 2 else "low"
        
        return {
            "success": True,
            "data": {
                "overall_risk": overall_risk,
                "risk_score": high_risks * 3 + medium_risks * 2,
                "risk_factors": risk_factors,
                "recommendations": [
                    "Diverzifikujte zdroje příjmů",
                    "Vytvořte finanční rezervu",
                    "Implementujte systém včasných plateb",
                    "Monitorujte klíčové metriky pravidelně"
                ],
                "generated_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating risk analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reports/save")
async def save_custom_report(
    report_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Save custom analytics report"""
    try:
        logger.info(f"💾 AI Analytics: Saving custom report for user {current_user['id']}")
        
        # In production, save to database
        # For now, return success with mock data
        
        report_id = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        return {
            "success": True,
            "data": {
                "report_id": report_id,
                "name": report_data.get("name", "Nová sestava"),
                "widgets": report_data.get("widgets", []),
                "filters": report_data.get("filters", {}),
                "saved_at": datetime.now().isoformat(),
                "user_id": current_user['id']
            },
            "message": "Sestava byla úspěšně uložena"
        }
        
    except Exception as e:
        logger.error(f"❌ Error saving custom report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/list")
async def list_saved_reports(
    current_user: dict = Depends(get_current_user)
):
    """List saved analytics reports"""
    try:
        logger.info(f"📋 AI Analytics: Listing saved reports for user {current_user['id']}")
        
        # Mock saved reports
        saved_reports = [
            {
                "id": "report_20250115_143022",
                "name": "Měsíční přehled",
                "description": "Kompletní měsíční analýza",
                "widgets_count": 4,
                "saved_at": "2025-01-15T14:30:22",
                "last_accessed": "2025-01-20T09:15:00"
            },
            {
                "id": "report_20250110_091545", 
                "name": "Kvartální analýza",
                "description": "Detailní kvartální přehled",
                "widgets_count": 6,
                "saved_at": "2025-01-10T09:15:45",
                "last_accessed": "2025-01-18T16:22:00"
            }
        ]
        
        return {
            "success": True,
            "data": {
                "reports": saved_reports,
                "total_count": len(saved_reports)
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error listing saved reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))
