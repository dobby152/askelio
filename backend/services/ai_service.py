"""
Cost-Effective AI Service
Provides simple AI insights using the cheapest OpenRouter models
"""

import json
import logging
import aiohttp
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)

class CostEffectiveAIService:
    """
    Simple AI service optimized for cost efficiency
    Uses Gemini 2.5 Flash-Lite for minimal costs
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        
        # Use cheapest model for cost efficiency
        self.model = "google/gemini-2.5-flash-lite"
        self.max_tokens = 150  # Keep responses short
        self.temperature = 0.1  # More deterministic
        
        # Simple cache for repeated queries
        self._cache = {}
        
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY not found - AI features will be disabled")
    
    def _get_cache_key(self, prompt: str, context: Dict = None) -> str:
        """Generate cache key for prompt"""
        content = f"{prompt}_{json.dumps(context, sort_keys=True) if context else ''}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def _make_openrouter_request(self, prompt: str, context: Dict = None) -> Optional[str]:
        """Make cost-optimized request to OpenRouter"""
        if not self.api_key:
            return None
            
        # Check cache first
        cache_key = self._get_cache_key(prompt, context)
        if cache_key in self._cache:
            logger.info("Using cached AI response")
            return self._cache[cache_key]
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://askelio.com",
                "X-Title": "Askelio AI Assistant"
            }

            data = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": self.temperature,
                "max_tokens": self.max_tokens
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=15)
                ) as response:

                    if response.status == 200:
                        result = await response.json()
                        content = result["choices"][0]["message"]["content"]

                        # Cache the response
                        self._cache[cache_key] = content

                        logger.info(f"AI request successful, cost: ~${result.get('usage', {}).get('total_tokens', 0) * 0.00001:.6f}")
                        return content
                    else:
                        logger.error(f"OpenRouter API error: {response.status}")
                        return None
                
        except Exception as e:
            logger.error(f"AI request failed: {e}")
            return None
    
    async def generate_insights(self, financial_data: Dict) -> List[Dict]:
        """Generate cost-effective financial insights"""
        
        # Prepare minimal data for prompt
        total_income = financial_data.get('totalIncome', 0)
        total_expenses = financial_data.get('totalExpenses', 0)
        net_profit = total_income - total_expenses
        
        prompt = f"""Analyzuj finanční data a vrať 3 krátké insights jako JSON array:
Příjmy: {total_income:,.0f} CZK
Výdaje: {total_expenses:,.0f} CZK
Zisk: {net_profit:,.0f} CZK

Formát odpovědi:
[
  {{"type": "positive/warning/info", "title": "Krátký titulek", "description": "Stručný popis"}},
  {{"type": "positive/warning/info", "title": "Krátký titulek", "description": "Stručný popis"}},
  {{"type": "positive/warning/info", "title": "Krátký titulek", "description": "Stručný popis"}}
]"""

        response = await self._make_openrouter_request(prompt)
        
        if response:
            try:
                # Try to parse JSON response
                insights = json.loads(response)
                if isinstance(insights, list):
                    return insights
            except json.JSONDecodeError:
                logger.warning("Failed to parse AI insights JSON")
        
        # Fallback to simple rule-based insights
        return self._generate_fallback_insights(financial_data)
    
    def _generate_fallback_insights(self, financial_data: Dict) -> List[Dict]:
        """Fallback insights when AI is unavailable"""
        total_income = financial_data.get('totalIncome', 0)
        total_expenses = financial_data.get('totalExpenses', 0)
        net_profit = total_income - total_expenses
        
        insights = []
        
        if net_profit > 0:
            insights.append({
                "type": "positive",
                "title": "Pozitivní zisk",
                "description": f"Váš zisk je {net_profit:,.0f} CZK"
            })
        else:
            insights.append({
                "type": "warning", 
                "title": "Záporný zisk",
                "description": f"Ztráta {abs(net_profit):,.0f} CZK"
            })
        
        if total_expenses > 0:
            expense_ratio = (total_expenses / total_income * 100) if total_income > 0 else 0
            insights.append({
                "type": "info",
                "title": "Poměr výdajů",
                "description": f"Výdaje tvoří {expense_ratio:.1f}% příjmů"
            })
        
        insights.append({
            "type": "info",
            "title": "Celkové příjmy",
            "description": f"Za období {total_income:,.0f} CZK"
        })
        
        return insights[:3]  # Limit to 3 insights
    
    async def chat_response(self, message: str, financial_context: Dict = None) -> str:
        """Generate simple chat response about financial data"""
        
        # Limit message length for cost efficiency
        message = message[:200]
        
        context_str = ""
        if financial_context:
            context_str = f"""
Kontext:
- Příjmy: {financial_context.get('totalIncome', 0):,.0f} CZK
- Výdaje: {financial_context.get('totalExpenses', 0):,.0f} CZK
- Zisk: {financial_context.get('totalIncome', 0) - financial_context.get('totalExpenses', 0):,.0f} CZK"""
        
        prompt = f"""Odpověz stručně (max 100 slov) na otázku o financích:
{message}
{context_str}

Odpověz v češtině, buď konkrétní a užitečný."""

        response = await self._make_openrouter_request(prompt, financial_context)
        
        if response:
            return response
        
        # Fallback response
        return f"Rozumím vaší otázce '{message}'. Momentálně zpracovávám finanční data. Můžete se zeptat na příjmy, výdaje, zisk nebo trendy."
    
    async def analyze_trends(self, current_data: Dict, previous_data: Dict = None) -> Dict:
        """Simple trend analysis"""
        
        if not previous_data:
            return {
                "trend": "neutral",
                "message": "Nemám historická data pro porovnání",
                "change_percent": 0
            }
        
        current_income = current_data.get('totalIncome', 0)
        previous_income = previous_data.get('totalIncome', 0)
        
        if previous_income > 0:
            change_percent = ((current_income - previous_income) / previous_income) * 100
            
            if change_percent > 5:
                trend = "positive"
                message = f"Příjmy rostou o {change_percent:.1f}%"
            elif change_percent < -5:
                trend = "negative" 
                message = f"Příjmy klesají o {abs(change_percent):.1f}%"
            else:
                trend = "neutral"
                message = f"Příjmy stabilní ({change_percent:+.1f}%)"
            
            return {
                "trend": trend,
                "message": message,
                "change_percent": change_percent
            }
        
        return {
            "trend": "neutral",
            "message": "Nedostatek dat pro analýzu trendu",
            "change_percent": 0
        }

# Global instance
ai_service = CostEffectiveAIService()
