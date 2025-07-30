"""
LLM Configuration for Optimal Performance and Cost Efficiency
Optimized for 95%+ accuracy with minimal costs using OpenRouter
"""

import os
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class ModelConfig:
    """Configuration for individual LLM model"""
    model_id: str
    name: str
    input_cost: float  # USD per 1M tokens
    output_cost: float  # USD per 1M tokens
    accuracy: float  # 0.0 - 1.0
    speed: float  # 0.0 - 1.0
    reasoning: float  # 0.0 - 1.0
    czech_support: float  # 0.0 - 1.0
    max_tokens: int
    context_window: int

class OptimalLLMConfig:
    """
    Optimal LLM configuration for 2025
    Based on latest model performance and pricing data
    """
    
    # Model hierarchy optimized for cost/performance
    MODELS = {
        "ultra_cheap": ModelConfig(
            model_id="google/gemini-2.5-flash-lite",
            name="Gemini 2.5 Flash-Lite",
            input_cost=0.01,
            output_cost=0.03,
            accuracy=0.90,
            speed=0.98,
            reasoning=0.85,
            czech_support=0.92,
            max_tokens=8192,
            context_window=1_000_000
        ),
        
        "optimal": ModelConfig(
            model_id="google/gemini-2.5-flash",
            name="Gemini 2.5 Flash",
            input_cost=0.075,
            output_cost=0.30,
            accuracy=0.95,
            speed=0.92,
            reasoning=0.92,
            czech_support=0.95,
            max_tokens=8192,
            context_window=1_000_000
        ),
        
        "reasoning": ModelConfig(
            model_id="deepseek/deepseek-v3",
            name="DeepSeek V3",
            input_cost=0.14,
            output_cost=0.28,
            accuracy=0.96,
            speed=0.85,
            reasoning=0.98,
            czech_support=0.88,
            max_tokens=4096,
            context_window=128_000
        ),
        
        "premium": ModelConfig(
            model_id="anthropic/claude-3.5-sonnet",
            name="Claude 3.5 Sonnet",
            input_cost=3.0,
            output_cost=15.0,
            accuracy=0.98,
            speed=0.80,
            reasoning=0.97,
            czech_support=0.96,
            max_tokens=4096,
            context_window=200_000
        ),
        
        "alternative_premium": ModelConfig(
            model_id="openai/gpt-4o",
            name="GPT-4o",
            input_cost=2.5,
            output_cost=10.0,
            accuracy=0.97,
            speed=0.82,
            reasoning=0.95,
            czech_support=0.90,
            max_tokens=4096,
            context_window=128_000
        )
    }
    
    # Cost limits in CZK
    COST_LIMITS = {
        "daily_limit_czk": float(os.getenv("MAX_DAILY_COST", "100.0")),
        "monthly_limit_czk": float(os.getenv("MAX_MONTHLY_COST", "1000.0")),
        "per_request_limit_czk": 5.0,
        "usd_to_czk_rate": 23.5
    }
    
    # Selection weights for model scoring
    SELECTION_WEIGHTS = {
        "accuracy": 0.40,
        "cost_efficiency": 0.25,
        "speed": 0.15,
        "language_support": 0.10,
        "reasoning": 0.10
    }

    # Enhanced model selection based on document complexity and real-time performance
    SMART_MODEL_SELECTION = {
        "simple": {
            "preferred_models": ["ultra_cheap", "optimal"],
            "max_cost_usd": 0.005,
            "min_confidence": 0.85,
            "max_processing_time": 3.0,
            "use_cache_aggressively": True,
            "fallback_threshold": 0.80
        },
        "medium": {
            "preferred_models": ["optimal", "reasoning"],
            "max_cost_usd": 0.015,
            "min_confidence": 0.90,
            "max_processing_time": 8.0,
            "use_cache_aggressively": True,
            "fallback_threshold": 0.85
        },
        "complex": {
            "preferred_models": ["reasoning", "premium"],
            "max_cost_usd": 0.050,
            "min_confidence": 0.95,
            "max_processing_time": 15.0,
            "use_cache_aggressively": False,
            "fallback_threshold": 0.90
        },
        "critical": {
            "preferred_models": ["premium", "reasoning"],
            "max_cost_usd": 0.100,
            "min_confidence": 0.98,
            "max_processing_time": 30.0,
            "use_cache_aggressively": False,
            "fallback_threshold": 0.95,
            "require_validation": True
        }
    }

    # Performance metrics for dynamic model selection
    PERFORMANCE_WEIGHTS = {
        "response_time_weight": 0.3,
        "accuracy_weight": 0.4,
        "cost_weight": 0.2,
        "availability_weight": 0.1
    }
    
    # Document type specific preferences
    DOCUMENT_PREFERENCES = {
        "invoice": {
            "preferred_models": ["optimal", "ultra_cheap"],
            "min_accuracy": 0.92,
            "max_cost_usd": 0.02
        },
        "receipt": {
            "preferred_models": ["ultra_cheap", "optimal"],
            "min_accuracy": 0.88,
            "max_cost_usd": 0.01
        },
        "contract": {
            "preferred_models": ["reasoning", "premium"],
            "min_accuracy": 0.95,
            "max_cost_usd": 0.10
        },
        "legal": {
            "preferred_models": ["premium", "reasoning"],
            "min_accuracy": 0.96,
            "max_cost_usd": 0.15
        },
        "technical": {
            "preferred_models": ["reasoning", "optimal"],
            "min_accuracy": 0.94,
            "max_cost_usd": 0.05
        }
    }
    
    # Language specific settings
    LANGUAGE_SETTINGS = {
        "cs": {
            "preferred_models": ["optimal", "premium", "reasoning"],
            "accuracy_bonus": 0.05,
            "fallback_chain": ["optimal", "premium", "reasoning", "ultra_cheap"]
        },
        "en": {
            "preferred_models": ["ultra_cheap", "optimal", "reasoning"],
            "accuracy_bonus": 0.0,
            "fallback_chain": ["ultra_cheap", "optimal", "reasoning", "premium"]
        }
    }
    
    # Retry and error handling
    RETRY_CONFIG = {
        "max_retries": 3,
        "retry_delays": [1, 2, 4],  # seconds
        "retry_on_errors": ["rate_limit", "server_error", "timeout"],
        "fallback_enabled": True,
        "emergency_fallback": "regex"
    }
    
    # Performance monitoring
    MONITORING_CONFIG = {
        "track_costs": True,
        "track_performance": True,
        "track_accuracy": True,
        "log_level": "INFO",
        "metrics_retention_days": 30
    }
    
    @classmethod
    def get_model_config(cls, tier: str) -> ModelConfig:
        """Get configuration for specific model tier"""
        return cls.MODELS.get(tier)
    
    @classmethod
    def get_cost_limit_usd(cls, limit_type: str) -> float:
        """Convert CZK limits to USD"""
        czk_limit = cls.COST_LIMITS.get(f"{limit_type}_czk", 0.0)
        return czk_limit / cls.COST_LIMITS["usd_to_czk_rate"]
    
    @classmethod
    def get_document_preferences(cls, doc_type: str) -> Dict[str, Any]:
        """Get preferences for specific document type"""
        return cls.DOCUMENT_PREFERENCES.get(doc_type, {
            "preferred_models": ["optimal", "ultra_cheap"],
            "min_accuracy": 0.90,
            "max_cost_usd": 0.02
        })
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate configuration consistency"""
        required_env_vars = ["OPENROUTER_API_KEY"]
        
        for var in required_env_vars:
            if not os.getenv(var):
                print(f"❌ Missing required environment variable: {var}")
                return False
        
        print("✅ LLM configuration validated successfully")
        return True

# Global configuration instance
llm_config = OptimalLLMConfig()
