#!/usr/bin/env python3
"""
AI Analytics Service - Advanced analytics and predictions
"""
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
import asyncio

logger = logging.getLogger(__name__)

@dataclass
class PredictionResult:
    """Prediction result structure"""
    value: float
    confidence: float
    trend: str  # 'up', 'down', 'stable'
    period_days: int
    factors: List[str]

@dataclass
class AnalyticsWidget:
    """Analytics widget structure"""
    id: str
    type: str  # 'chart', 'metric', 'insight', 'forecast'
    title: str
    data: Dict[str, Any]
    config: Dict[str, Any]
    last_updated: datetime

class AIAnalyticsService:
    """Advanced AI Analytics Service"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.prediction_cache = {}
        self.widget_cache = {}
        
    async def generate_predictive_analysis(self, 
                                         financial_data: Dict[str, Any], 
                                         prediction_type: str = "revenue",
                                         period_days: int = 30) -> PredictionResult:
        """Generate AI-powered predictive analysis"""
        try:
            self.logger.info(f"🔮 Generating {prediction_type} prediction for {period_days} days")
            
            # Extract historical data
            current_value = financial_data.get('totalIncome', 0) if prediction_type == 'revenue' else financial_data.get('totalExpenses', 0)
            
            # Simple trend analysis (in production, use ML models)
            trend_factor = self._calculate_trend_factor(financial_data, prediction_type)
            seasonal_factor = self._calculate_seasonal_factor()
            market_factor = self._calculate_market_factor()
            
            # Predict future value
            base_prediction = current_value * (1 + trend_factor)
            seasonal_adjustment = base_prediction * seasonal_factor
            final_prediction = seasonal_adjustment * market_factor
            
            # Calculate confidence based on data quality
            confidence = self._calculate_confidence(financial_data, prediction_type)
            
            # Determine trend direction
            trend = "up" if trend_factor > 0.02 else "down" if trend_factor < -0.02 else "stable"
            
            # Identify key factors
            factors = self._identify_key_factors(trend_factor, seasonal_factor, market_factor)
            
            result = PredictionResult(
                value=final_prediction,
                confidence=confidence,
                trend=trend,
                period_days=period_days,
                factors=factors
            )
            
            self.logger.info(f"✅ Prediction generated: {final_prediction:.0f} CZK ({confidence:.1%} confidence)")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Error generating prediction: {e}")
            # Return fallback prediction
            return PredictionResult(
                value=current_value * 1.05,  # 5% growth fallback
                confidence=0.6,
                trend="stable",
                period_days=period_days,
                factors=["Základní trend", "Historická data"]
            )
    
    def _calculate_trend_factor(self, financial_data: Dict, prediction_type: str) -> float:
        """Calculate trend factor from historical data"""
        # Realistic financial trend analysis based on actual data

        income = financial_data.get('totalIncome', 0)
        expenses = financial_data.get('totalExpenses', 0)

        if prediction_type == 'revenue':
            # Conservative revenue growth based on current performance
            if income > expenses * 1.3:  # Strong profitability
                return 0.08  # 8% growth
            elif income > expenses * 1.1:  # Moderate profitability
                return 0.05  # 5% growth
            else:  # Low profitability
                return 0.02  # 2% growth

        elif prediction_type == 'expenses':
            # Expenses typically grow with inflation and business expansion
            if income > expenses * 1.2:  # Room for growth
                return 0.04  # 4% expense growth
            else:  # Need cost control
                return 0.02  # 2% expense growth

        elif prediction_type == 'cashflow':
            # Cash flow prediction based on income-expense dynamics
            ratio = income / max(expenses, 1)
            if ratio > 1.4:  # Strong cash flow
                return 0.10  # 10% improvement
            elif ratio > 1.1:  # Moderate cash flow
                return 0.05  # 5% improvement
            else:  # Weak cash flow
                return 0.01  # 1% improvement
        else:
            return 0.03  # Default conservative growth
    
    def _calculate_seasonal_factor(self) -> float:
        """Calculate seasonal adjustment factor"""
        current_month = datetime.now().month
        
        # Q4 typically stronger for B2B
        if current_month in [10, 11, 12]:
            return 1.15
        # Q1 typically slower
        elif current_month in [1, 2, 3]:
            return 0.95
        # Q2, Q3 stable
        else:
            return 1.0
    
    def _calculate_market_factor(self) -> float:
        """Calculate market conditions factor"""
        # In production, integrate with economic indicators
        # For now, assume stable market
        return 1.02  # 2% market growth
    
    def _calculate_confidence(self, financial_data: Dict, prediction_type: str) -> float:
        """Calculate prediction confidence based on data quality"""
        base_confidence = 0.75
        
        # Adjust based on data completeness
        if financial_data.get('totalIncome', 0) > 0:
            base_confidence += 0.1
        if financial_data.get('totalExpenses', 0) > 0:
            base_confidence += 0.1
        if financial_data.get('netProfit', 0) != 0:
            base_confidence += 0.05
            
        return min(base_confidence, 0.95)
    
    def _identify_key_factors(self, trend_factor: float, seasonal_factor: float, market_factor: float) -> List[str]:
        """Identify key factors affecting prediction"""
        factors = []

        # Realistic financial factors
        if trend_factor > 0.06:
            factors.append("Rostoucí historický výkon")
        elif trend_factor > 0.03:
            factors.append("Mírný růstový trend")
        elif trend_factor < 0.01:
            factors.append("Stagnující výkonnost")

        if seasonal_factor > 1.05:
            factors.append("Sezónní nárůst (Q4)")
        elif seasonal_factor < 0.98:
            factors.append("Sezónní pokles (Q1)")
        else:
            factors.append("Stabilní sezónní vzorec")

        # Add realistic business factors
        factors.append("Inflační tlaky")
        factors.append("Aktuální tržní podmínky")

        return factors
    
    async def generate_widget_data(self, widget_type: str, config: Dict[str, Any], financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate data for analytics widgets"""
        try:
            self.logger.info(f"📊 Generating widget data for type: {widget_type}")
            
            if widget_type == 'revenue-trend':
                return await self._generate_revenue_trend_data(config, financial_data)
            elif widget_type == 'expense-breakdown':
                return await self._generate_expense_breakdown_data(config, financial_data)
            elif widget_type == 'cash-flow':
                return await self._generate_cashflow_data(config, financial_data)
            elif widget_type == 'ai-insights':
                return await self._generate_ai_insights_data(config, financial_data)
            elif widget_type == 'forecast':
                return await self._generate_forecast_data(config, financial_data)
            else:
                return {"error": f"Unknown widget type: {widget_type}"}
                
        except Exception as e:
            self.logger.error(f"❌ Error generating widget data: {e}")
            return {"error": str(e)}
    
    async def _generate_revenue_trend_data(self, config: Dict, financial_data: Dict) -> Dict[str, Any]:
        """Generate revenue trend chart data"""
        # Generate mock historical data for demo
        months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen']
        current_revenue = financial_data.get('totalIncome', 50000)
        
        # Generate trend data
        base_values = [current_revenue * (0.8 + i * 0.05) for i in range(6)]
        
        # Add AI prediction if enabled
        if config.get('aiAnalysis', False):
            prediction = await self.generate_predictive_analysis(financial_data, 'revenue', 30)
            months.append('Predikce')
            base_values.append(prediction.value)
        
        return {
            "labels": months,
            "datasets": [
                {
                    "label": "Příjmy",
                    "data": base_values,
                    "borderColor": "rgb(59, 130, 246)",
                    "backgroundColor": "rgba(59, 130, 246, 0.1)",
                    "tension": 0.4
                }
            ],
            "options": {
                "responsive": True,
                "plugins": {
                    "title": {
                        "display": True,
                        "text": "Trendy příjmů s AI predikcí"
                    }
                }
            }
        }
    
    async def _generate_expense_breakdown_data(self, config: Dict, financial_data: Dict) -> Dict[str, Any]:
        """Generate expense breakdown pie chart data"""
        total_expenses = financial_data.get('totalExpenses', 25000)
        
        # Breakdown by categories
        categories = {
            'Provozní náklady': total_expenses * 0.4,
            'Mzdy': total_expenses * 0.3,
            'Marketing': total_expenses * 0.15,
            'IT služby': total_expenses * 0.1,
            'Ostatní': total_expenses * 0.05
        }
        
        return {
            "labels": list(categories.keys()),
            "datasets": [
                {
                    "data": list(categories.values()),
                    "backgroundColor": [
                        "#FF6384",
                        "#36A2EB", 
                        "#FFCE56",
                        "#4BC0C0",
                        "#9966FF"
                    ]
                }
            ],
            "options": {
                "responsive": True,
                "plugins": {
                    "title": {
                        "display": True,
                        "text": "Rozložení výdajů podle kategorií"
                    }
                }
            }
        }
    
    async def _generate_cashflow_data(self, config: Dict, financial_data: Dict) -> Dict[str, Any]:
        """Generate cash flow bar chart data"""
        months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen']
        
        income_data = [45000, 52000, 48000, 55000, 50000, 58000]
        expense_data = [30000, 28000, 32000, 29000, 25000, 27000]
        
        return {
            "labels": months,
            "datasets": [
                {
                    "label": "Příjmy",
                    "data": income_data,
                    "backgroundColor": "rgba(34, 197, 94, 0.8)"
                },
                {
                    "label": "Výdaje", 
                    "data": expense_data,
                    "backgroundColor": "rgba(239, 68, 68, 0.8)"
                }
            ],
            "options": {
                "responsive": True,
                "plugins": {
                    "title": {
                        "display": True,
                        "text": "Cash Flow - Příjmy vs Výdaje"
                    }
                }
            }
        }
    
    async def _generate_ai_insights_data(self, config: Dict, financial_data: Dict) -> Dict[str, Any]:
        """Generate AI insights widget data"""
        insights = []

        income = financial_data.get('totalIncome', 0)
        expenses = financial_data.get('totalExpenses', 0)
        profit = financial_data.get('netProfit', 0)

        # Realistic financial insights based on actual ratios
        profit_margin = (profit / income * 100) if income > 0 else 0
        expense_ratio = (expenses / income * 100) if income > 0 else 0

        if profit_margin > 15:
            insights.append({
                "type": "positive",
                "title": "Výborná ziskovost",
                "description": f"Zisková marže {profit_margin:.1f}% je nad průměrem. Udržujte současnou strategii."
            })
        elif profit_margin > 5:
            insights.append({
                "type": "success",
                "title": "Zdravá ziskovost",
                "description": f"Zisková marže {profit_margin:.1f}% je přijatelná. Hledejte možnosti optimalizace."
            })
        elif profit_margin > 0:
            insights.append({
                "type": "warning",
                "title": "Nízká ziskovost",
                "description": f"Zisková marže {profit_margin:.1f}% je pod doporučením. Zvažte snížení nákladů."
            })
        else:
            insights.append({
                "type": "warning",
                "title": "Ztráta",
                "description": "Firma je ve ztrátě. Urgentně analyzujte náklady a příjmy."
            })

        if expense_ratio < 70:
            insights.append({
                "type": "positive",
                "title": "Efektivní nákladová struktura",
                "description": f"Výdaje tvoří {expense_ratio:.1f}% příjmů. Dobrá kontrola nákladů."
            })
        elif expense_ratio < 85:
            insights.append({
                "type": "success",
                "title": "Přijatelné náklady",
                "description": f"Výdaje tvoří {expense_ratio:.1f}% příjmů. Sledujte vývoj nákladů."
            })
        else:
            insights.append({
                "type": "warning",
                "title": "Vysoké náklady",
                "description": f"Výdaje tvoří {expense_ratio:.1f}% příjmů. Doporučujeme optimalizaci."
            })

        return {
            "insights": insights,
            "summary": f"Finanční analýza - {len(insights)} klíčových pozorování"
        }
    
    async def _generate_forecast_data(self, config: Dict, financial_data: Dict) -> Dict[str, Any]:
        """Generate forecast widget data"""
        forecast_period = config.get('forecastPeriod', 90)
        data_source = config.get('dataSource', 'revenue')
        
        prediction = await self.generate_predictive_analysis(financial_data, data_source, forecast_period)
        
        return {
            "prediction": {
                "value": prediction.value,
                "confidence": prediction.confidence,
                "trend": prediction.trend,
                "period": forecast_period
            },
            "factors": prediction.factors,
            "recommendation": self._generate_recommendation(prediction)
        }
    
    def _generate_recommendation(self, prediction: PredictionResult) -> str:
        """Generate recommendation based on prediction"""
        if prediction.trend == "up" and prediction.confidence > 0.8:
            return "Silný růstový trend. Doporučujeme investovat do expanze."
        elif prediction.trend == "down" and prediction.confidence > 0.7:
            return "Klesající trend. Zaměřte se na optimalizaci nákladů."
        elif prediction.confidence < 0.6:
            return "Nejistá predikce. Doporučujeme sběr více dat."
        else:
            return "Stabilní vývoj. Pokračujte v současné strategii."
    
    async def compare_periods(self, period_a: Dict[str, Any], period_b: Dict[str, Any]) -> Dict[str, Any]:
        """Compare two time periods"""
        try:
            self.logger.info("📊 Comparing periods for analytics")
            
            # Calculate changes
            income_change = self._calculate_percentage_change(
                period_a.get('totalIncome', 0), 
                period_b.get('totalIncome', 0)
            )
            
            expense_change = self._calculate_percentage_change(
                period_a.get('totalExpenses', 0),
                period_b.get('totalExpenses', 0) 
            )
            
            profit_change = self._calculate_percentage_change(
                period_a.get('netProfit', 0),
                period_b.get('netProfit', 0)
            )
            
            return {
                "income_change": income_change,
                "expense_change": expense_change, 
                "profit_change": profit_change,
                "summary": self._generate_comparison_summary(income_change, expense_change, profit_change)
            }
            
        except Exception as e:
            self.logger.error(f"❌ Error comparing periods: {e}")
            return {"error": str(e)}
    
    def _calculate_percentage_change(self, current: float, previous: float) -> Dict[str, Any]:
        """Calculate percentage change between two values"""
        if previous == 0:
            return {"value": 0, "percentage": 0, "trend": "stable"}
        
        change = current - previous
        percentage = (change / previous) * 100
        trend = "up" if percentage > 2 else "down" if percentage < -2 else "stable"
        
        return {
            "value": change,
            "percentage": percentage,
            "trend": trend
        }
    
    def _generate_comparison_summary(self, income_change: Dict, expense_change: Dict, profit_change: Dict) -> str:
        """Generate summary of period comparison"""
        if profit_change["trend"] == "up":
            return f"Zisk vzrostl o {profit_change['percentage']:.1f}%. Pozitivní vývoj."
        elif profit_change["trend"] == "down":
            return f"Zisk klesl o {abs(profit_change['percentage']):.1f}%. Doporučujeme analýzu."
        else:
            return "Stabilní finanční výkonnost bez výrazných změn."

# Global instance
ai_analytics_service = AIAnalyticsService()
