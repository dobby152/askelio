"""
Advanced Multi-LLM Engine for OCR Data Completion
Supports Claude 3.5 Sonnet, GPT-4o, GPT-4o-mini, and Gemini with intelligent routing
"""
import os
import logging
import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMProvider(Enum):
    CLAUDE_35_SONNET = "claude-3-5-sonnet-20241022"
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    GEMINI_FLASH = "gemini-1.5-flash"

@dataclass
class LLMResult:
    """Result from LLM processing"""
    success: bool
    structured_data: Dict[str, Any]
    confidence_score: float
    provider_used: str
    processing_time: float
    cost_estimate: float
    reasoning: str
    validation_notes: List[str]
    error_message: Optional[str] = None

@dataclass
class DocumentClassification:
    """Document type classification"""
    document_type: str  # invoice, receipt, contract, etc.
    complexity: str     # simple, medium, complex
    language: str       # cs, en, etc.
    confidence: float

class AdvancedLLMEngine:
    """
    Advanced Multi-LLM Engine with intelligent routing and fallback
    Optimizes for accuracy, speed, and cost based on document characteristics
    """
    
    def __init__(self):
        logger.info("🚀 Initializing Advanced Multi-LLM Engine...")
        
        # Initialize providers
        self.providers = {}
        self._init_claude()
        self._init_openai()
        self._init_gemini()
        
        # Cost per 1K tokens (approximate)
        self.cost_per_1k_tokens = {
            LLMProvider.CLAUDE_35_SONNET: 0.003,
            LLMProvider.GPT_4O: 0.005,
            LLMProvider.GPT_4O_MINI: 0.0001,
            LLMProvider.GEMINI_FLASH: 0.0001
        }
        
        # Provider capabilities
        self.provider_strengths = {
            LLMProvider.CLAUDE_35_SONNET: {
                "accuracy": 0.95,
                "czech_support": 0.95,
                "complex_reasoning": 0.95,
                "speed": 0.7
            },
            LLMProvider.GPT_4O: {
                "accuracy": 0.93,
                "czech_support": 0.85,
                "complex_reasoning": 0.93,
                "speed": 0.8
            },
            LLMProvider.GPT_4O_MINI: {
                "accuracy": 0.88,
                "czech_support": 0.80,
                "complex_reasoning": 0.80,
                "speed": 0.95
            },
            LLMProvider.GEMINI_FLASH: {
                "accuracy": 0.80,
                "czech_support": 0.70,
                "complex_reasoning": 0.70,
                "speed": 0.95
            }
        }
        
        available_providers = [p.value for p in self.providers.keys()]
        logger.info(f"✅ Advanced LLM Engine initialized with providers: {available_providers}")
    
    def _init_claude(self):
        """Initialize Claude 3.5 Sonnet"""
        try:
            import anthropic
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if api_key:
                client = anthropic.Anthropic(api_key=api_key)
                self.providers[LLMProvider.CLAUDE_35_SONNET] = client
                logger.info("✅ Claude 3.5 Sonnet initialized")
            else:
                logger.warning("⚠️ ANTHROPIC_API_KEY not found")
        except ImportError:
            logger.warning("⚠️ Anthropic library not installed")
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize Claude: {e}")
    
    def _init_openai(self):
        """Initialize OpenAI GPT models"""
        try:
            import openai
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                client = openai.OpenAI(api_key=api_key)
                self.providers[LLMProvider.GPT_4O] = client
                self.providers[LLMProvider.GPT_4O_MINI] = client
                logger.info("✅ OpenAI GPT models initialized")
            else:
                logger.warning("⚠️ OPENAI_API_KEY not found")
        except ImportError:
            logger.warning("⚠️ OpenAI library not installed")
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize OpenAI: {e}")
    
    def _init_gemini(self):
        """Initialize Gemini"""
        try:
            import google.generativeai as genai
            api_key = os.getenv('GOOGLE_API_KEY')
            if api_key:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                self.providers[LLMProvider.GEMINI_FLASH] = model
                logger.info("✅ Gemini Flash initialized")
            else:
                logger.warning("⚠️ GOOGLE_API_KEY not found")
        except ImportError:
            logger.warning("⚠️ Google Generative AI library not installed")
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize Gemini: {e}")
    
    def classify_document(self, text: str, filename: str = "") -> DocumentClassification:
        """
        Classify document type and complexity for optimal LLM routing
        """
        text_lower = text.lower()
        filename_lower = filename.lower()
        
        # Document type detection
        if any(word in text_lower for word in ['faktura', 'invoice', 'účet']):
            doc_type = 'invoice'
        elif any(word in text_lower for word in ['účtenka', 'receipt', 'pokladní']):
            doc_type = 'receipt'
        elif any(word in text_lower for word in ['smlouva', 'contract', 'dohoda']):
            doc_type = 'contract'
        else:
            doc_type = 'document'
        
        # Complexity assessment
        complexity_indicators = [
            len(text) > 2000,  # Long text
            text.count('\n') > 50,  # Many lines
            any(word in text_lower for word in ['dph', 'vat', 'tax', 'sleva', 'discount']),  # Tax info
            any(word in text_lower for word in ['položka', 'item', 'služba', 'service']),  # Line items
        ]
        
        complexity_score = sum(complexity_indicators) / len(complexity_indicators)
        if complexity_score > 0.6:
            complexity = 'complex'
        elif complexity_score > 0.3:
            complexity = 'medium'
        else:
            complexity = 'simple'
        
        # Language detection (simple heuristic)
        czech_indicators = ['č', 'ř', 'ž', 'ý', 'á', 'í', 'é', 'ú', 'ů', 'ň', 'ť', 'ď']
        czech_score = sum(1 for char in czech_indicators if char in text_lower) / len(text_lower) * 100
        language = 'cs' if czech_score > 0.5 else 'en'
        
        return DocumentClassification(
            document_type=doc_type,
            complexity=complexity,
            language=language,
            confidence=0.8  # Simple heuristic confidence
        )
    
    def select_optimal_provider(self, classification: DocumentClassification, 
                              prefer_speed: bool = False, 
                              max_cost: float = 0.01) -> LLMProvider:
        """
        Select optimal LLM provider based on document characteristics and constraints
        """
        available_providers = list(self.providers.keys())
        if not available_providers:
            raise Exception("No LLM providers available")
        
        scores = {}
        
        for provider in available_providers:
            strengths = self.provider_strengths[provider]
            cost = self.cost_per_1k_tokens[provider]
            
            # Base score calculation
            score = 0.0
            
            # Accuracy weight (higher for complex documents)
            accuracy_weight = 0.4 if classification.complexity == 'complex' else 0.3
            score += strengths['accuracy'] * accuracy_weight
            
            # Czech support weight
            czech_weight = 0.3 if classification.language == 'cs' else 0.1
            score += strengths['czech_support'] * czech_weight
            
            # Speed weight
            speed_weight = 0.4 if prefer_speed else 0.2
            score += strengths['speed'] * speed_weight
            
            # Cost penalty
            if cost > max_cost:
                score *= 0.5  # Penalize expensive providers
            
            # Complexity bonus for advanced models
            if classification.complexity == 'complex':
                if provider in [LLMProvider.CLAUDE_35_SONNET, LLMProvider.GPT_4O]:
                    score *= 1.2
            
            scores[provider] = score
        
        # Select provider with highest score
        best_provider = max(scores.keys(), key=lambda p: scores[p])
        
        logger.info(f"🎯 Selected {best_provider.value} for {classification.document_type} "
                   f"({classification.complexity}, {classification.language}) - Score: {scores[best_provider]:.3f}")
        
        return best_provider
    
    def get_available_providers(self) -> List[str]:
        """Get list of available LLM providers"""
        return [provider.value for provider in self.providers.keys()]
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status"""
        return {
            "available_providers": self.get_available_providers(),
            "total_providers": len(self.providers),
            "provider_capabilities": {
                provider.value: strengths 
                for provider, strengths in self.provider_strengths.items()
                if provider in self.providers
            },
            "cost_per_1k_tokens": {
                provider.value: cost 
                for provider, cost in self.cost_per_1k_tokens.items()
                if provider in self.providers
            }
        }
