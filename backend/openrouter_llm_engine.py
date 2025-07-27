"""
OpenRouter LLM Engine for OCR Data Completion
Unified access to multiple LLM providers through OpenRouter API
Cost-effective with transparent pricing
"""
import os
import logging
import json
import time
import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from dotenv import load_dotenv
from llm_cache import llm_cache

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class LLMResult:
    """Result from LLM processing"""
    success: bool
    extracted_data: Dict[str, Any]  # Changed from structured_data
    confidence_score: float
    model_used: str  # Changed from provider_used
    processing_time: float
    cost_usd: float  # Changed from cost_estimate
    reasoning: str = ""
    validation_notes: List[str] = None
    error_message: Optional[str] = None

    def __post_init__(self):
        if self.validation_notes is None:
            self.validation_notes = []

class OpenRouterLLMEngine:
    """
    OpenRouter LLM Engine with cost-effective model selection
    Provides access to multiple LLM providers through unified API
    """
    
    def __init__(self):
        logger.info("🚀 Initializing OpenRouter LLM Engine...")
        
        # OpenRouter configuration
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.base_url = "https://openrouter.ai/api/v1"
        self.app_name = "Askelio Document Processor"
        
        if not self.api_key:
            logger.warning("⚠️ OPENROUTER_API_KEY not found")
            self.available = False
        else:
            self.available = True
            logger.info("✅ OpenRouter API key configured")
        
        # 🚀 POWERFUL MODELS HIERARCHY - Deep Understanding & Context Awareness
        self.models = {
            # 🎯 FLAGSHIP - Claude 3.5 Sonnet (Best reasoning & Czech support)
            "flagship": {
                "model": "anthropic/claude-3.5-sonnet",
                "name": "Claude 3.5 Sonnet (Flagship)",
                "input_cost": 3.0,    # $3.00 per 1M tokens
                "output_cost": 15.0,  # $15.00 per 1M tokens
                "accuracy": 0.98,     # Exceptional accuracy
                "speed": 0.75,        # Slower but worth it
                "reasoning": 0.98,    # Best reasoning capabilities
                "czech_support": 0.95, # Excellent Czech understanding
                "avg_response_time": 4.0,
                "context_window": 200000  # 200k tokens
            },
            # 🧠 PREMIUM - GPT-4o (Full version, not mini)
            "premium": {
                "model": "openai/gpt-4o",
                "name": "GPT-4o (Premium)",
                "input_cost": 5.0,    # $5.00 per 1M tokens
                "output_cost": 15.0,  # $15.00 per 1M tokens
                "accuracy": 0.96,
                "speed": 0.80,
                "reasoning": 0.96,
                "czech_support": 0.92,
                "avg_response_time": 3.5,
                "context_window": 128000  # 128k tokens
            },
            # ⚡ OPTIMAL - Claude 3 Haiku (Fast + Smart)
            "optimal": {
                "model": "anthropic/claude-3-haiku",
                "name": "Claude 3 Haiku (Optimal)",
                "input_cost": 0.25,   # $0.25 per 1M tokens
                "output_cost": 1.25,  # $1.25 per 1M tokens
                "accuracy": 0.94,
                "speed": 0.90,
                "reasoning": 0.92,
                "czech_support": 0.90,
                "avg_response_time": 2.0,
                "context_window": 200000  # 200k tokens
            },
            # 🔥 REASONING - GPT-4 Turbo (Strong reasoning)
            "reasoning": {
                "model": "openai/gpt-4-turbo",
                "name": "GPT-4 Turbo (Reasoning)",
                "input_cost": 10.0,   # $10.00 per 1M tokens
                "output_cost": 30.0,  # $30.00 per 1M tokens
                "accuracy": 0.97,
                "speed": 0.70,
                "reasoning": 0.97,
                "czech_support": 0.93,
                "avg_response_time": 5.0,
                "context_window": 128000  # 128k tokens
            },
            # 💰 BUDGET - GPT-4o Mini (Backup option)
            "budget": {
                "model": "openai/gpt-4o-mini",
                "name": "GPT-4o Mini (Budget)",
                "input_cost": 0.15,   # $0.15 per 1M tokens
                "output_cost": 0.60,  # $0.60 per 1M tokens
                "accuracy": 0.92,
                "speed": 0.85,
                "reasoning": 0.90,
                "czech_support": 0.88,
                "avg_response_time": 2.5,
                "context_window": 128000  # 128k tokens
            },
            # 🆓 FREE - Llama 3.1 70B (Strong free option)
            "free": {
                "model": "meta-llama/llama-3.1-70b-instruct:free",
                "name": "Llama 3.1 70B (Free)",
                "input_cost": 0.0,    # FREE
                "output_cost": 0.0,   # FREE
                "accuracy": 0.89,
                "speed": 0.75,
                "reasoning": 0.87,
                "czech_support": 0.82,
                "avg_response_time": 3.0,
                "context_window": 131072  # 131k tokens
            },
            # 🔄 LEGACY - Llama 3.2 3B (Last resort)
            "legacy": {
                "model": "meta-llama/llama-3.2-3b-instruct:free",
                "name": "Llama 3.2 3B (Legacy)",
                "input_cost": 0.0,    # Free tier
                "output_cost": 0.0,   # Free tier
                "accuracy": 0.82,
                "speed": 0.95,
                "reasoning": 0.75,
                "czech_support": 0.78,
                "avg_response_time": 1.5,
                "context_window": 131072  # 131k tokens
            },
            # ⚠️ EMERGENCY - Regex fallback (avoid if possible)
            "emergency": {
                "model": "local_regex",
                "name": "Regex Parser",
                "input_cost": 0.0,
                "output_cost": 0.0,
                "accuracy": 0.60,
                "speed": 1.0,
                "reasoning": 0.30,
                "czech_support": 0.70,
                "avg_response_time": 0.1,
                "context_window": 0
            }
        }

        # 💰 COST TRACKING - Higher limits for powerful models
        self.cost_tracking = {
            "daily_limit_czk": 500.0,    # 🚀 Increased for Claude/GPT-4o usage
            "monthly_limit_czk": 5000.0, # 🚀 Increased for production usage
            "current_daily_czk": 0.0,
            "current_monthly_czk": 0.0,
            "usd_to_czk_rate": 23.5  # Approximate rate
        }

        # Performance metrics for adaptive selection with SPEED FOCUS
        self.performance_metrics = {
            "success_rate": {},
            "avg_response_time": {},
            "cost_per_request": {},
            "accuracy_scores": {},
            "czech_performance": {},
            "speed_targets": {
                "invoice_target": 3.0,      # 3s target for invoices
                "receipt_target": 2.5,      # 2.5s target for receipts
                "contract_target": 5.0      # 5s target for contracts
            }
        }
        
        # Usage statistics
        self.stats = {
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
            "total_cost_usd": 0.0,
            "model_usage": {},
            "fallback_triggers": 0
        }
        
        logger.info(f"✅ OpenRouter LLM Engine initialized (Available: {self.available})")
    
    def select_optimal_model(self, text: str, complexity: str = "simple",
                           max_cost_usd: float = 0.01, document_type: str = "invoice",
                           language: str = "auto", speed_priority: bool = True) -> str:
        """
        SPEED-OPTIMIZED model selection for 3s processing target:
        - Speed priority for invoices (target: <3s)
        - Document complexity and type
        - Language (Czech support important)
        - Cost constraints
        - Performance history
        - Required reasoning level
        """
        text_length = len(text)

        # Detect language if auto
        if language == "auto":
            language = self._detect_language(text)

        # Assess reasoning requirements
        reasoning_required = self._assess_reasoning_needs(text, document_type, complexity)

        # Calculate scores for each model
        model_scores = {}
        for tier, model_info in self.models.items():
            if tier == "emergency":  # Skip emergency model in selection
                continue

            score = self._calculate_model_score(
                model_info, text_length, complexity, max_cost_usd,
                language, reasoning_required, document_type, speed_priority
            )
            model_scores[tier] = score

        # Select best model
        best_tier = max(model_scores.keys(), key=lambda k: model_scores[k])

        logger.info(f"🎯 Selected {self.models[best_tier]['name']} "
                   f"(score: {model_scores[best_tier]:.3f}) for {complexity} {document_type} "
                   f"in {language}, reasoning: {reasoning_required}")

        return best_tier
    
    def estimate_cost(self, text: str, model_tier: str) -> float:
        """Estimate processing cost for given text and model"""
        if not self.available:
            return 0.0
        
        model_info = self.models[model_tier]
        
        # Estimate tokens (rough approximation: 1 token ≈ 4 characters)
        input_tokens = len(text) / 4
        output_tokens = 300  # Estimated structured output
        
        input_cost = (input_tokens / 1_000_000) * model_info["input_cost"]
        output_cost = (output_tokens / 1_000_000) * model_info["output_cost"]
        
        return input_cost + output_cost
    
    def structure_invoice_data(self, text: str, filename: str = "",
                             complexity: str = "auto",
                             max_cost_usd: float = 0.01) -> LLMResult:
        """
        Structure OCR text data using OpenRouter with intelligent complexity assessment
        """
        start_time = time.time()

        if not self.available:
            return LLMResult(
                success=False,
                extracted_data={},
                confidence_score=0.0,
                model_used="unavailable",
                processing_time=time.time() - start_time,
                cost_usd=0.0,
                reasoning="OpenRouter API not available",
                validation_notes=[],
                error_message="OpenRouter API key not configured"
            )

        try:
            # Detect document type and language
            document_type = self._detect_document_type(text, filename)

            # 🧠 INTELLIGENT COMPLEXITY ASSESSMENT
            if complexity == "auto":
                complexity = self._assess_invoice_complexity(text)
                logger.info(f"🎯 Auto-detected complexity: {complexity}")

            # 🚀 SPEED OPTIMIZATION: Check cache first
            cached_response = llm_cache.get_cached_response(text, document_type, complexity)
            if cached_response:
                logger.info(f"⚡ Cache HIT - Processing time: {cached_response['processing_time']:.2f}s")

                # Convert to LLMResult format
                result = LLMResult(
                    success=cached_response["success"],
                    extracted_data=cached_response["extracted_data"],
                    confidence_score=cached_response["confidence_score"],
                    model_used=cached_response["model_used"],
                    processing_time=cached_response["processing_time"],
                    cost_usd=cached_response["cost_usd"],
                    reasoning=cached_response["reasoning"],
                    validation_notes=cached_response.get("validation_notes", [])
                )

                # Update statistics for cache hit
                self._update_statistics(result, result.processing_time)
                return result

            # Select optimal model with SPEED PRIORITY for invoices
            speed_priority = document_type in ["invoice", "receipt"]
            model_tier = self.select_optimal_model(
                text=text,
                complexity=complexity,
                max_cost_usd=max_cost_usd,
                document_type=document_type,
                language="auto",
                speed_priority=speed_priority
            )
            model_info = self.models[model_tier]

            logger.info(f"📋 Using {model_info['name']} for {document_type} processing")

            # Try selected model with adaptive prompt
            result = self._process_with_openrouter(text, model_tier, complexity)

            # Intelligent fallback chain
            if not result.success:
                result = self._intelligent_fallback(text, model_tier, start_time, complexity)

            # Emergency fallback to regex
            if not result.success:
                logger.warning("⚠️ All OpenRouter models failed, using regex fallback...")
                result = self._fallback_to_regex(text, start_time)
            
            # Update statistics with speed monitoring
            processing_time = time.time() - start_time
            self._update_statistics(result, processing_time)
            result.processing_time = processing_time

            # Speed performance logging
            target_time = self.performance_metrics["speed_targets"].get(f"{document_type}_target", 5.0)
            if processing_time <= target_time:
                logger.info(f"🚀 Speed target MET: {processing_time:.2f}s <= {target_time}s for {document_type}")
            else:
                logger.warning(f"⏱️ Speed target MISSED: {processing_time:.2f}s > {target_time}s for {document_type}")

            # 💾 CACHE successful responses for future speed optimization
            if result.success and result.confidence_score >= 0.8:
                llm_cache.cache_response(
                    text=text,
                    response_data=result.extracted_data,
                    model_used=result.model_used,
                    confidence_score=result.confidence_score,
                    document_type=document_type,
                    complexity=complexity,
                    language=self._detect_language(text)
                )

            # 🔍 INTELLIGENT VALIDATION & POST-PROCESSING
            if result.success:
                result = self._validate_and_enhance_data(result, text)

            return result

        except Exception as e:
            logger.error(f"❌ OpenRouter processing failed: {e}")
            return LLMResult(
                success=False,
                extracted_data={},
                confidence_score=0.0,
                model_used="failed",
                processing_time=time.time() - start_time,
                cost_usd=0.0,
                reasoning=f"Processing failed: {str(e)}",
                validation_notes=[],
                error_message=str(e)
            )
    
    def _process_with_openrouter(self, text: str, model_tier: str, complexity: str = "simple") -> LLMResult:
        """Process text with OpenRouter API using adaptive prompts"""
        model_info = self.models[model_tier]

        if model_tier == "emergency":
            return self._fallback_to_regex(text, time.time())
        
        try:
            # Create adaptive prompt based on complexity
            prompt = self._create_invoice_prompt(text, complexity)
            
            # Prepare request
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://askelio.com",
                "X-Title": self.app_name
            }
            
            # SPEED-OPTIMIZED payload
            data = {
                "model": model_info["model"],
                "messages": [
                    {
                        "role": "user",
                        "content": prompt  # Removed system message for speed
                    }
                ],
                "temperature": 0.0,  # Deterministic for speed
                "max_tokens": 300,   # Reduced for speed
                "top_p": 0.1        # More focused responses
            }
            
            # Make request
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")
            
            result_data = response.json()
            
            # Extract response
            if "choices" not in result_data or not result_data["choices"]:
                raise Exception("No response from OpenRouter")
            
            content = result_data["choices"][0]["message"]["content"]
            
            # Calculate cost
            usage = result_data.get("usage", {})
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)
            
            cost = (
                (input_tokens / 1_000_000) * model_info["input_cost"] +
                (output_tokens / 1_000_000) * model_info["output_cost"]
            )
            
            # 🔧 ROBUST JSON PARSING with multiple fallback strategies
            extracted_data = self._robust_json_parse(content)

            return LLMResult(
                success=True,
                extracted_data=extracted_data,
                confidence_score=model_info["accuracy"],
                model_used=f"openrouter:{model_info['name']}",
                processing_time=0.0,  # Will be set by caller
                cost_usd=cost,
                reasoning=f"Processed with {model_info['name']} via OpenRouter",
                validation_notes=[]
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing failed for {model_info['name']}: {e}")
            logger.error(f"Raw content (first 500 chars): {content[:500]}")
            logger.error(f"Raw content (last 200 chars): {content[-200:]}")
            return LLMResult(
                success=False,
                extracted_data={},
                confidence_score=0.0,
                model_used=f"openrouter:{model_info['name']}",
                processing_time=0.0,
                cost_usd=0.001,
                reasoning=f"JSON parsing failed: {str(e)}",
                validation_notes=[],
                error_message=str(e)
            )
        except Exception as e:
            logger.error(f"❌ OpenRouter {model_info['name']} failed: {e}")
            return LLMResult(
                success=False,
                extracted_data={},
                confidence_score=0.0,
                model_used=f"openrouter:{model_info['name']}",
                processing_time=0.0,
                cost_usd=0.001,
                reasoning=f"Processing failed: {str(e)}",
                validation_notes=[],
                error_message=str(e)
            )
    
    def _create_invoice_prompt(self, text: str, complexity: str = "simple") -> str:
        """Create INTELLIGENT prompt for Czech invoice processing with adaptive complexity"""
        # Assess text length and adjust truncation
        max_length = 4000 if complexity == "complex" else 2500 if complexity == "medium" else 2000
        truncated_text = text[:max_length] if len(text) > max_length else text

        # Get appropriate schema based on complexity
        schema = self._get_adaptive_schema(complexity)
        instructions = self._get_adaptive_instructions(complexity)

        return f"""Extract data from this Czech invoice. Return ONLY this JSON format with actual values:

{{
  "document_type": "faktura",
  "invoice_number": "put_actual_invoice_number_here",
  "date": "put_actual_date_here",
  "due_date": "put_actual_due_date_here",
  "vendor": {{
    "name": "put_actual_vendor_name_here",
    "ico": "put_actual_vendor_ico_here",
    "dic": "put_actual_vendor_dic_here"
  }},
  "customer": {{
    "name": "put_actual_customer_name_here",
    "ico": "put_actual_customer_ico_here",
    "dic": "put_actual_customer_dic_here"
  }},
  "totals": {{
    "total": put_actual_total_number_here,
    "vat_amount": put_actual_vat_number_here
  }},
  "currency": "CZK",
  "variable_symbol": "put_actual_variable_symbol_here",
  "bank_account": "put_actual_bank_account_here"
}}

Invoice text:
{truncated_text}

JSON:"""

    def _get_adaptive_schema(self, complexity: str) -> dict:
        """Get simplified JSON schema for reliable extraction"""
        # Use same simple schema for all complexities to avoid JSON parsing issues
        return {
            "document_type": "faktura",
            "invoice_number": None,
            "date": None,
            "due_date": None,
            "vendor": {
                "name": None,
                "ico": None,
                "dic": None
            },
            "customer": {
                "name": None,
                "ico": None,
                "dic": None
            },
            "totals": {
                "total": 0.0,
                "vat_amount": 0.0
            },
            "currency": "CZK",
            "variable_symbol": None,
            "bank_account": None
        }

    def _get_adaptive_instructions(self, complexity: str) -> str:
        """Get processing instructions adapted to document complexity"""
        return """Extract invoice data from Czech text. Return ONLY valid JSON with these exact field names.
Use null for missing values. Do not add explanations or markdown."""

    def _fallback_to_regex(self, text: str, start_time: float, error_msg: str = None) -> LLMResult:
        """🚀 INTELLIGENT regex-based data extraction with comprehensive pattern matching"""
        import re
        from datetime import datetime

        # Initialize comprehensive data structure
        extracted_data = {
            "document_type": "faktura",
            "extracted_at": datetime.now().isoformat(),
            "extraction_method": "intelligent_regex_fallback"
        }

        # 🧠 INTELLIGENT PATTERN MATCHING

        # 📋 INVOICE NUMBER PATTERNS (multiple variations)
        invoice_patterns = [
            r"faktura\s*(?:č\.?|číslo)\s*:?\s*([A-Z0-9\-/]+)",
            r"invoice\s*(?:no\.?|number)\s*:?\s*([A-Z0-9\-/]+)",
            r"č\.\s*faktury\s*:?\s*([A-Z0-9\-/]+)",
            r"(?:^|\s)(\d{4,}[-/]\d+)(?:\s|$)",  # 2025-001 format
            r"(?:^|\s)(\d{6,})(?:\s|$)"  # Simple number format
        ]

        for pattern in invoice_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                extracted_data["invoice_number"] = match.group(1).strip()
                break

        # 📅 DATE PATTERNS (Czech formats)
        date_patterns = [
            (r"datum\s*vystavení\s*:?\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})", "date"),
            (r"datum\s*splatnosti\s*:?\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})", "due_date"),
            (r"datum\s*uskutečnění\s*:?\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})", "completion_date"),
            (r"issued\s*:?\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})", "date"),
            (r"due\s*:?\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})", "due_date")
        ]

        for pattern, field_name in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                extracted_data[field_name] = match.group(1)

        # 🏢 VENDOR INFORMATION
        vendor_data = {}

        # Company name (before IČO/DIČ)
        company_patterns = [
            r"([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\s]+(?:s\.r\.o\.|a\.s\.|spol\.|corp\.|ltd\.|inc\.))",
            r"dodavatel\s*:?\s*([^\n]+?)(?:\s*IČ|$)",
        ]

        for pattern in company_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                vendor_data["name"] = match.group(1).strip()
                break

        # IČO patterns
        ico_patterns = [
            r"IČO?\s*:?\s*(\d{8})",
            r"IČ\s*:?\s*(\d{8})",
            r"company\s*id\s*:?\s*(\d{8})"
        ]

        for pattern in ico_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                vendor_data["ico"] = match.group(1)
                break

        # DIČ patterns
        dic_patterns = [
            r"DIČ\s*:?\s*(CZ\d{8,10})",
            r"tax\s*id\s*:?\s*(CZ\d{8,10})",
            r"VAT\s*:?\s*(CZ\d{8,10})"
        ]

        for pattern in dic_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                vendor_data["dic"] = match.group(1)
                break

        if vendor_data:
            extracted_data["vendor"] = vendor_data

        # 👤 CUSTOMER INFORMATION
        customer_data = {}

        # Customer name patterns
        customer_patterns = [
            r"odběratel\s*:?\s*([^\n]+?)(?:\s*IČ|$)",
            r"customer\s*:?\s*([^\n]+?)(?:\s*IČ|$)",
            r"bill\s*to\s*:?\s*([^\n]+?)(?:\s*IČ|$)"
        ]

        for pattern in customer_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                customer_data["name"] = match.group(1).strip()
                break

        if customer_data:
            extracted_data["customer"] = customer_data

        # 💰 FINANCIAL INFORMATION
        totals_data = {}

        # Amount patterns (Czech number format)
        amount_patterns = [
            (r"celkem\s*k\s*úhradě\s*:?\s*([\d\s,]+[,.]?\d*)\s*(?:kč|czk)", "total"),
            (r"total\s*:?\s*([\d\s,]+[,.]?\d*)\s*(?:kč|czk)", "total"),
            (r"dph\s*(?:\d+%)?\s*:?\s*([\d\s,]+[,.]?\d*)\s*(?:kč|czk)", "vat_amount"),
            (r"vat\s*:?\s*([\d\s,]+[,.]?\d*)\s*(?:kč|czk)", "vat_amount"),
            (r"celkem\s*bez\s*dph\s*:?\s*([\d\s,]+[,.]?\d*)\s*(?:kč|czk)", "subtotal")
        ]

        for pattern, field_name in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Clean and convert Czech number format
                amount_str = match.group(1).replace(" ", "").replace(",", ".")
                try:
                    totals_data[field_name] = float(amount_str)
                except ValueError:
                    continue

        if totals_data:
            extracted_data["totals"] = totals_data

        # 💳 PAYMENT INFORMATION
        payment_data = {}

        # Bank account patterns
        bank_patterns = [
            r"číslo\s*účtu\s*:?\s*([\d/]+)",
            r"account\s*:?\s*([\d/]+)",
            r"účet\s*:?\s*([\d/]+)"
        ]

        for pattern in bank_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                payment_data["bank_account"] = match.group(1)
                break

        # Variable symbol (enhanced patterns)
        vs_patterns = [
            r"variabilní\s*symbol\s*:?\s*(\d+)",
            r"variable\s*symbol\s*:?\s*(\d+)",
            r"VS\s*:?\s*(\d+)",
            r"var\.?\s*symbol\s*:?\s*(\d+)",
            r"symbol\s*:?\s*(\d+)",  # Generic symbol pattern
            r"(?:^|\s)(\d{6,})(?:\s|$)"  # Long number that could be VS
        ]

        for pattern in vs_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                payment_data["variable_symbol"] = match.group(1)
                break

        if payment_data:
            extracted_data["payment"] = payment_data

        # 💱 CURRENCY
        if re.search(r"(?:kč|czk)", text, re.IGNORECASE):
            extracted_data["currency"] = "CZK"
        elif re.search(r"eur", text, re.IGNORECASE):
            extracted_data["currency"] = "EUR"
        else:
            extracted_data["currency"] = "CZK"  # Default for Czech invoices

        # 📊 CALCULATE CONFIDENCE based on extracted fields
        field_count = len([v for v in extracted_data.values() if v is not None and v != ""])
        confidence = min(0.85, 0.3 + (field_count * 0.05))  # Max 0.85 for regex

        return LLMResult(
            success=True,
            extracted_data=extracted_data,
            confidence_score=confidence,
            model_used="intelligent_regex_fallback",
            processing_time=time.time() - start_time,
            cost_usd=0.0,
            reasoning=f"Intelligent regex fallback extracted {field_count} fields{': ' + error_msg if error_msg else ''}",
            validation_notes=[f"Regex fallback - extracted {field_count} fields with {confidence:.2f} confidence"]
        )

    def _update_statistics(self, result: LLMResult, processing_time: float):
        """Update processing statistics"""
        self.stats["total_processed"] += 1

        if result.success:
            self.stats["successful"] += 1
        else:
            self.stats["failed"] += 1

        self.stats["total_cost_usd"] += result.cost_usd

        # Update model usage
        provider = result.model_used
        self.stats["model_usage"][provider] = self.stats["model_usage"].get(provider, 0) + 1

    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive processing statistics"""
        success_rate = (
            (self.stats["successful"] / self.stats["total_processed"] * 100)
            if self.stats["total_processed"] > 0 else 0
        )

        avg_cost = (
            self.stats["total_cost_usd"] / self.stats["total_processed"]
            if self.stats["total_processed"] > 0 else 0
        )

        return {
            "total_processed": self.stats["total_processed"],
            "successful": self.stats["successful"],
            "failed": self.stats["failed"],
            "success_rate_percent": round(success_rate, 1),
            "costs": {
                "total_usd": round(self.stats["total_cost_usd"], 6),
                "total_czk": round(self.stats["total_cost_usd"] * 24, 2),
                "avg_per_document_usd": round(avg_cost, 6),
                "avg_per_document_czk": round(avg_cost * 24, 3)
            },
            "model_usage": self.stats["model_usage"],
            "fallback_triggers": self.stats["fallback_triggers"]
        }

    def get_system_status(self) -> Dict[str, Any]:
        """Get system status and capabilities"""
        return {
            "available": self.available,
            "api_configured": self.api_key is not None,
            "models": {
                tier: {
                    "name": info["name"],
                    "cost_per_1m_tokens": f"${info['input_cost']:.3f} input, ${info['output_cost']:.3f} output",
                    "accuracy": info["accuracy"],
                    "speed": info["speed"]
                }
                for tier, info in self.models.items()
            },
            "strategy": "cost_effective_openrouter",
            "primary_model": self.models["primary"]["name"],
            "fallback_model": self.models["fallback"]["name"],
            "statistics": self.get_statistics()
        }

    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        return [info["name"] for info in self.models.values()]

    def _assess_invoice_complexity(self, text: str) -> str:
        """🧠 INTELLIGENT complexity assessment for optimal model selection"""
        import re

        complexity_score = 0
        text_lower = text.lower()

        # 📊 LINE ITEMS ANALYSIS (most important factor)
        line_patterns = [
            r'\d+\.\s+.*?=.*?(?:kč|czk)',  # "1. Item = 1000 Kč"
            r'\d+\s*×\s*\d+.*?=.*?(?:kč|czk)',  # "5 × 200 = 1000 Kč"
            r'.*?\s+\d+[,.]?\d*\s+(?:kč|czk)',  # "Item 1000 Kč"
        ]

        total_items = 0
        for pattern in line_patterns:
            items = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            total_items += len(items)

        if total_items <= 2:
            complexity_score += 0  # Simple
        elif total_items <= 5:
            complexity_score += 2  # Medium
        else:
            complexity_score += 4  # Complex

        # 💰 VAT RATES ANALYSIS
        vat_patterns = [
            r'dph\s*(\d+)%',
            r'(\d+)%\s*dph',
            r'sazba\s*(\d+)%'
        ]

        vat_rates = set()
        for pattern in vat_patterns:
            rates = re.findall(pattern, text_lower)
            vat_rates.update(rates)

        if len(vat_rates) <= 1:
            complexity_score += 0
        elif len(vat_rates) == 2:
            complexity_score += 2
        else:
            complexity_score += 3

        # 🏢 ADDRESS COMPLEXITY
        address_indicators = ['ulice', 'street', 'náměstí', 'třída', 'nám.', 'ul.']
        if any(indicator in text_lower for indicator in address_indicators):
            complexity_score += 1

        # 💳 PAYMENT COMPLEXITY
        payment_indicators = ['variabilní', 'konstantní', 'specifický', 'swift', 'iban']
        payment_count = sum(1 for indicator in payment_indicators if indicator in text_lower)
        if payment_count >= 3:
            complexity_score += 2
        elif payment_count >= 1:
            complexity_score += 1

        # 📋 SPECIAL CASES
        special_cases = ['sleva', 'discount', 'přirážka', 'záloha', 'advance', 'opravná', 'correction']
        if any(case in text_lower for case in special_cases):
            complexity_score += 3

        # 📏 TEXT LENGTH FACTOR
        if len(text) > 3000:
            complexity_score += 2
        elif len(text) > 1500:
            complexity_score += 1

        # 🎯 FINAL CLASSIFICATION
        if complexity_score <= 2:
            return "simple"
        elif complexity_score <= 6:
            return "medium"
        else:
            return "complex"

    def _detect_language(self, text: str) -> str:
        """Detect if text is Czech or English"""
        czech_indicators = ['č', 'ř', 'ž', 'ý', 'á', 'í', 'é', 'ú', 'ů', 'ň', 'ť', 'ď', 'ě', 'š']
        text_lower = text.lower()
        czech_score = sum(1 for char in czech_indicators if char in text_lower) / len(text_lower) * 100
        return 'cs' if czech_score > 0.5 else 'en'

    def _assess_reasoning_needs(self, text: str, document_type: str, complexity: str) -> bool:
        """Assess if document requires advanced reasoning"""
        reasoning_indicators = [
            'smlouva', 'contract', 'právní', 'legal', 'analýza', 'analysis',
            'výpočet', 'calculation', 'složitý', 'complex', 'technický', 'technical'
        ]

        text_lower = text.lower()
        reasoning_score = sum(1 for indicator in reasoning_indicators if indicator in text_lower)

        # Complex documents or contracts usually need reasoning
        return (complexity == "complex" or
                document_type in ["contract", "legal", "technical"] or
                reasoning_score > 2)

    def _calculate_model_score(self, model_info: dict, text_length: int, complexity: str,
                             max_cost_usd: float, language: str, reasoning_required: bool,
                             document_type: str, speed_priority: bool = True) -> float:
        """🚀 POWERFUL MODEL SCORING - Prioritize Deep Understanding & Context Awareness"""
        score = 0.0

        # 🧠 ACCURACY & REASONING FIRST (60% weight total)
        # Accuracy is the most important factor (40% weight)
        score += model_info["accuracy"] * 0.40

        # Reasoning capability (20% weight) - Critical for complex documents
        if reasoning_required or complexity == "complex":
            score += model_info["reasoning"] * 0.20
        else:
            score += model_info["reasoning"] * 0.15  # Still important for simple docs

        # 💰 COST EFFICIENCY (20% weight) - More generous for powerful models
        estimated_cost = self._estimate_cost_internal(model_info, text_length)
        if estimated_cost <= max_cost_usd:
            # Reward models that use budget efficiently
            cost_score = max(0, 1 - (estimated_cost / max_cost_usd))
            score += cost_score * 0.20
        elif estimated_cost <= max_cost_usd * 1.5:  # Allow 50% budget overage for quality
            # Small penalty for slightly over budget
            score += 0.10
        else:
            # Larger penalty for significantly over budget
            score -= 0.15

        # 🌍 LANGUAGE SUPPORT (15% weight) - Critical for Czech documents
        if language == 'cs':
            score += model_info["czech_support"] * 0.15
        else:
            score += 0.15  # Full points for English

        # ⚡ SPEED BONUS (5% weight) - Nice to have, but not critical
        if speed_priority and document_type in ["invoice", "receipt"]:
            score += model_info["speed"] * 0.05

        # 🎯 FLAGSHIP MODEL BONUS - Prefer Claude 3.5 Sonnet and GPT-4o
        model_name = model_info.get("name", "")
        if "Claude 3.5 Sonnet" in model_name:
            score += 0.10  # Bonus for flagship model
        elif "GPT-4o" in model_name and "Mini" not in model_name:
            score += 0.08  # Bonus for full GPT-4o
        elif "Claude 3 Haiku" in model_name:
            score += 0.05  # Bonus for fast Claude

        return max(0.0, min(1.2, score))  # Allow scores > 1.0 for flagship models

    def _validate_and_enhance_data(self, result: LLMResult, original_text: str) -> LLMResult:
        """🔍 INTELLIGENT validation and enhancement of extracted data"""
        import re

        data = result.extracted_data
        validation_notes = result.validation_notes.copy()
        confidence_adjustments = 0.0

        # 🏢 VALIDATE IČO (Czech company ID)
        if data.get("vendor", {}).get("ico"):
            ico = data["vendor"]["ico"]
            if self._validate_ico(ico):
                confidence_adjustments += 0.05
                validation_notes.append("✅ Valid IČO format")
            else:
                confidence_adjustments -= 0.10
                validation_notes.append("⚠️ Invalid IČO format")

        # 🆔 VALIDATE DIČ (Czech tax ID)
        if data.get("vendor", {}).get("dic"):
            dic = data["vendor"]["dic"]
            if self._validate_dic(dic):
                confidence_adjustments += 0.05
                validation_notes.append("✅ Valid DIČ format")
            else:
                confidence_adjustments -= 0.10
                validation_notes.append("⚠️ Invalid DIČ format")

        # 💰 VALIDATE MATHEMATICAL CONSISTENCY
        if data.get("line_items") and data.get("totals"):
            math_validation = self._validate_math_consistency(data)
            confidence_adjustments += math_validation["confidence_adjustment"]
            validation_notes.extend(math_validation["notes"])

        # 📅 VALIDATE DATE FORMATS
        date_fields = ["date", "due_date", "completion_date"]
        if "dates" in data:
            date_fields = ["issued", "due", "completion", "tax_point"]
            date_container = data["dates"]
        else:
            date_container = data

        for field in date_fields:
            if date_container.get(field):
                if self._validate_date_format(date_container[field]):
                    confidence_adjustments += 0.02
                else:
                    confidence_adjustments -= 0.05
                    validation_notes.append(f"⚠️ Invalid date format in {field}")

        # 🔢 VALIDATE BANK ACCOUNT FORMAT
        if data.get("payment", {}).get("bank_account"):
            account = data["payment"]["bank_account"]
            if self._validate_bank_account(account):
                confidence_adjustments += 0.03
                validation_notes.append("✅ Valid bank account format")
            else:
                confidence_adjustments -= 0.05
                validation_notes.append("⚠️ Invalid bank account format")

        # 📊 CROSS-REFERENCE WITH ORIGINAL TEXT
        cross_ref_score = self._cross_reference_validation(data, original_text)
        confidence_adjustments += cross_ref_score

        # 🎯 APPLY CONFIDENCE ADJUSTMENTS
        new_confidence = max(0.0, min(1.0, result.confidence_score + confidence_adjustments))

        # 🔧 ENHANCE DATA QUALITY
        enhanced_data = self._enhance_data_quality(data)

        return LLMResult(
            success=result.success,
            extracted_data=enhanced_data,
            confidence_score=new_confidence,
            model_used=result.model_used,
            processing_time=result.processing_time,
            cost_usd=result.cost_usd,
            reasoning=f"{result.reasoning} | Validated & enhanced (confidence: {confidence_adjustments:+.3f})",
            validation_notes=validation_notes
        )

    def _validate_ico(self, ico: str) -> bool:
        """Validate Czech IČO (company ID) format and checksum"""
        if not ico or not ico.isdigit() or len(ico) != 8:
            return False

        # IČO checksum validation
        weights = [8, 7, 6, 5, 4, 3, 2]
        checksum = sum(int(ico[i]) * weights[i] for i in range(7))
        remainder = checksum % 11

        if remainder < 2:
            expected_check = remainder
        else:
            expected_check = 11 - remainder

        return int(ico[7]) == expected_check

    def _validate_dic(self, dic: str) -> bool:
        """Validate Czech DIČ (tax ID) format"""
        if not dic:
            return False

        # Basic format: CZ + 8-10 digits
        import re
        pattern = r'^CZ\d{8,10}$'
        return bool(re.match(pattern, dic))

    def _validate_date_format(self, date_str: str) -> bool:
        """Validate date format (Czech DD.MM.YYYY or ISO YYYY-MM-DD)"""
        if not date_str:
            return False

        import re
        # Czech format: DD.MM.YYYY or DD/MM/YYYY
        czech_pattern = r'^\d{1,2}[./]\d{1,2}[./]\d{4}$'
        # ISO format: YYYY-MM-DD
        iso_pattern = r'^\d{4}-\d{2}-\d{2}$'

        return bool(re.match(czech_pattern, date_str) or re.match(iso_pattern, date_str))

    def _validate_bank_account(self, account: str) -> bool:
        """Validate Czech bank account format (XXXXXX/YYYY)"""
        if not account:
            return False

        import re
        # Czech format: account_number/bank_code
        pattern = r'^\d{1,16}/\d{4}$'
        return bool(re.match(pattern, account))

    def _validate_math_consistency(self, data: dict) -> dict:
        """Validate mathematical consistency of invoice calculations"""
        validation_result = {
            "confidence_adjustment": 0.0,
            "notes": []
        }

        line_items = data.get("line_items", [])
        totals = data.get("totals", {})

        if not line_items or not totals:
            return validation_result

        # Calculate sum of line items
        calculated_subtotal = 0.0
        for item in line_items:
            if isinstance(item, dict) and "total_price" in item:
                try:
                    calculated_subtotal += float(item["total_price"])
                except (ValueError, TypeError):
                    continue

        # Compare with declared subtotal
        declared_subtotal = totals.get("subtotal", 0.0)
        if declared_subtotal > 0:
            difference = abs(calculated_subtotal - declared_subtotal)
            if difference <= 0.01:  # Allow 1 cent difference for rounding
                validation_result["confidence_adjustment"] += 0.10
                validation_result["notes"].append("✅ Line items sum matches subtotal")
            elif difference <= declared_subtotal * 0.05:  # Allow 5% difference
                validation_result["confidence_adjustment"] += 0.05
                validation_result["notes"].append("⚠️ Minor discrepancy in line items sum")
            else:
                validation_result["confidence_adjustment"] -= 0.15
                validation_result["notes"].append("❌ Significant discrepancy in line items sum")

        return validation_result

    def _cross_reference_validation(self, data: dict, original_text: str) -> float:
        """Cross-reference extracted data with original text for validation"""
        confidence_bonus = 0.0
        text_lower = original_text.lower()

        # Check if invoice number appears in text
        invoice_number = data.get("invoice_number")
        if invoice_number and invoice_number.lower() in text_lower:
            confidence_bonus += 0.05

        # Check if vendor name appears in text
        vendor_name = data.get("vendor", {}).get("name")
        if vendor_name and vendor_name.lower() in text_lower:
            confidence_bonus += 0.05

        # Check if amounts appear in text (with Czech formatting)
        total_amount = data.get("totals", {}).get("total")
        if total_amount:
            # Convert to Czech format for searching
            czech_format = f"{total_amount:,.0f}".replace(",", " ")
            if czech_format in text_lower or str(int(total_amount)) in text_lower:
                confidence_bonus += 0.05

        return min(0.15, confidence_bonus)  # Cap at 0.15

    def _enhance_data_quality(self, data: dict) -> dict:
        """Enhance data quality through intelligent post-processing"""
        enhanced = data.copy()

        # 🔧 STANDARDIZE DATE FORMATS
        date_fields = ["date", "due_date", "completion_date"]
        if "dates" in enhanced:
            date_container = enhanced["dates"]
            date_fields = ["issued", "due", "completion", "tax_point"]
        else:
            date_container = enhanced

        for field in date_fields:
            if date_container.get(field):
                standardized_date = self._standardize_date_format(date_container[field])
                if standardized_date:
                    date_container[field] = standardized_date

        # 🔧 CLEAN NUMERIC VALUES
        if "totals" in enhanced:
            for key, value in enhanced["totals"].items():
                if isinstance(value, str):
                    try:
                        # Clean Czech number format
                        cleaned = value.replace(" ", "").replace(",", ".")
                        enhanced["totals"][key] = float(cleaned)
                    except (ValueError, TypeError):
                        pass

        # 🔧 STANDARDIZE COMPANY NAMES
        if enhanced.get("vendor", {}).get("name"):
            enhanced["vendor"]["name"] = self._standardize_company_name(enhanced["vendor"]["name"])

        if enhanced.get("customer", {}).get("name"):
            enhanced["customer"]["name"] = self._standardize_company_name(enhanced["customer"]["name"])

        return enhanced

    def _standardize_date_format(self, date_str: str) -> str:
        """Convert date to ISO format (YYYY-MM-DD)"""
        if not date_str:
            return date_str

        import re
        from datetime import datetime

        # If already in ISO format, return as is
        if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
            return date_str

        # Try to parse Czech format DD.MM.YYYY or DD/MM/YYYY
        czech_match = re.match(r'^(\d{1,2})[./](\d{1,2})[./](\d{4})$', date_str)
        if czech_match:
            day, month, year = czech_match.groups()
            try:
                # Validate and format
                date_obj = datetime(int(year), int(month), int(day))
                return date_obj.strftime('%Y-%m-%d')
            except ValueError:
                pass

        return date_str  # Return original if can't parse

    def _standardize_company_name(self, name: str) -> str:
        """Standardize company name format"""
        if not name:
            return name

        # Remove extra whitespace
        cleaned = ' '.join(name.split())

        # Standardize common suffixes
        suffixes = {
            's.r.o.': 's.r.o.',
            'sro': 's.r.o.',
            'a.s.': 'a.s.',
            'as': 'a.s.',
            'spol. s r.o.': 'spol. s r.o.'
        }

        for old_suffix, new_suffix in suffixes.items():
            if cleaned.lower().endswith(old_suffix.lower()):
                cleaned = cleaned[:-len(old_suffix)].strip() + ' ' + new_suffix
                break

        return cleaned

    def _robust_json_parse(self, content: str) -> dict:
        """🔧 SIMPLE JSON parsing - either works or fails"""

        # Clean content
        json_text = content.strip()

        # Remove markdown code blocks
        if json_text.startswith('```json'):
            json_text = json_text[7:]
            if json_text.endswith('```'):
                json_text = json_text[:-3]
        elif json_text.startswith('```'):
            json_text = json_text[3:]
            if json_text.endswith('```'):
                json_text = json_text[:-3]

        json_text = json_text.strip()

        # Try parsing - if it fails, raise error to trigger fallback model
        try:
            parsed = json.loads(json_text)
            if isinstance(parsed, dict):
                return parsed
            else:
                raise json.JSONDecodeError("Not a JSON object", json_text, 0)
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing failed: {e}")
            raise  # Let the calling code handle the error

    def _fix_json_issues(self, json_text: str) -> str:
        """Fix common JSON formatting issues"""
        import re

        # Fix unterminated strings at end of lines
        lines = json_text.split('\n')
        fixed_lines = []

        for line in lines:
            # If line has opening quote but no closing quote, add one
            if line.count('"') % 2 == 1 and not line.strip().endswith(','):
                # Find the last quote and add closing quote before comma or end
                if ',' in line:
                    line = line.replace(',', '",')
                else:
                    line = line + '"'
            fixed_lines.append(line)

        fixed_text = '\n'.join(fixed_lines)

        # Fix trailing commas
        fixed_text = re.sub(r',(\s*[}\]])', r'\1', fixed_text)

        # Fix missing commas between objects
        fixed_text = re.sub(r'"\s*\n\s*"', '",\n  "', fixed_text)

        # Fix unescaped quotes in strings
        fixed_text = re.sub(r'(?<!\\)"(?![,:\[\]{}]|$)', r'\\"', fixed_text)

        return fixed_text

    def _build_minimal_json(self, content: str) -> dict:
        """Build comprehensive JSON from content using intelligent regex extraction"""
        import re

        # Use the intelligent regex fallback system
        fallback_result = self._fallback_to_regex(content, time.time())
        return fallback_result.extracted_data

    def _estimate_cost_internal(self, model_info: dict, text_length: int) -> float:
        """Internal cost estimation method"""
        # Rough estimation: 1 token ≈ 4 characters
        estimated_tokens = text_length / 4
        input_cost = (estimated_tokens / 1_000_000) * model_info["input_cost"]

        # Assume output is ~20% of input length
        output_tokens = estimated_tokens * 0.2
        output_cost = (output_tokens / 1_000_000) * model_info["output_cost"]

        return input_cost + output_cost

    def _detect_document_type(self, text: str, filename: str) -> str:
        """Detect document type from text and filename"""
        text_lower = text.lower()
        filename_lower = filename.lower()

        # Check filename first
        if any(word in filename_lower for word in ['invoice', 'faktura', 'účet']):
            return "invoice"
        elif any(word in filename_lower for word in ['receipt', 'účtenka', 'pokladní']):
            return "receipt"
        elif any(word in filename_lower for word in ['contract', 'smlouva']):
            return "contract"

        # Check text content
        if any(word in text_lower for word in ['faktura', 'invoice', 'daňový doklad']):
            return "invoice"
        elif any(word in text_lower for word in ['účtenka', 'receipt', 'pokladní doklad']):
            return "receipt"
        elif any(word in text_lower for word in ['smlouva', 'contract', 'dohoda']):
            return "contract"

        return "document"  # Generic fallback

    def _intelligent_fallback(self, text: str, failed_tier: str, start_time: float, complexity: str = "simple") -> 'LLMResult':
        """Intelligent fallback strategy based on failed model"""
        fallback_chain = self._get_fallback_chain(failed_tier)

        for tier in fallback_chain:
            logger.warning(f"⚠️ Trying fallback model: {self.models[tier]['name']}")
            self.stats["fallback_triggers"] += 1

            result = self._process_with_openrouter(text, tier, complexity)
            if result.success:
                return result

        # If all models fail, return failed result
        return self._create_failed_result("All models failed", start_time)

    def _get_fallback_chain(self, failed_tier: str) -> List[str]:
        """🚀 POWERFUL MODEL FALLBACK CHAIN - Intelligent degradation"""
        # Ordered by capability: flagship → premium → optimal → budget → free → legacy
        all_tiers = ["flagship", "premium", "reasoning", "optimal", "budget", "free", "legacy"]

        # Remove the failed tier
        if failed_tier in all_tiers:
            all_tiers.remove(failed_tier)

        # Intelligent fallback based on failed model
        if failed_tier == "flagship":  # Claude 3.5 Sonnet failed
            return ["premium", "reasoning", "optimal", "budget", "free", "legacy"]
        elif failed_tier == "premium":  # GPT-4o failed
            return ["flagship", "reasoning", "optimal", "budget", "free", "legacy"]
        elif failed_tier == "reasoning":  # GPT-4 Turbo failed
            return ["flagship", "premium", "optimal", "budget", "free", "legacy"]
        elif failed_tier == "optimal":  # Claude 3 Haiku failed
            return ["budget", "free", "legacy"]
        elif failed_tier == "budget":  # GPT-4o Mini failed
            return ["optimal", "free", "legacy"]
        elif failed_tier == "free":  # Llama 3.1 70B failed
            return ["budget", "optimal", "legacy"]
        else:  # legacy failed
            return ["budget", "free", "optimal"]

    def _create_failed_result(self, error_message: str, start_time: float) -> LLMResult:
        """Create a failed LLMResult"""
        return LLMResult(
            success=False,
            extracted_data={},
            confidence_score=0.0,
            processing_time=time.time() - start_time,
            model_used="none",
            cost_usd=0.0,
            error_message=error_message
        )
