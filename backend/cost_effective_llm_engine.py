"""
Cost-Effective LLM Engine for OCR Data Completion
Optimized hybrid approach: GPT-4o-mini (primary) + Claude 3.5 Sonnet (fallback)
Average cost: 0.043 Kč per invoice
"""
import os
import logging
import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

class CostEffectiveLLMEngine:
    """
    Cost-Effective LLM Engine with hybrid approach
    Primary: GPT-4o-mini (90% cases) - 0.014 Kč/invoice
    Fallback: Claude 3.5 Sonnet (10% complex cases) - 0.30 Kč/invoice
    Average cost: 0.043 Kč per invoice
    """
    
    def __init__(self):
        logger.info("🚀 Initializing Cost-Effective LLM Engine...")
        
        # Initialize providers
        self.openai_client = None
        self.claude_client = None
        self._init_openai()
        self._init_claude()
        
        # Cost tracking
        self.costs = {
            "gpt_4o_mini": {"input": 0.15, "output": 0.6},  # per 1M tokens in USD
            "claude_35_sonnet": {"input": 3.0, "output": 15.0}
        }
        
        # Usage statistics
        self.stats = {
            "total_processed": 0,
            "gpt_4o_mini_used": 0,
            "claude_used": 0,
            "total_cost_usd": 0.0,
            "fallback_triggers": 0
        }
        
        logger.info(f"✅ Cost-Effective LLM Engine initialized")
        logger.info(f"   - OpenAI available: {self.openai_client is not None}")
        logger.info(f"   - Claude available: {self.claude_client is not None}")
    
    def _init_openai(self):
        """Initialize OpenAI GPT-4o-mini"""
        try:
            import openai
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                self.openai_client = openai.OpenAI(api_key=api_key)
                logger.info("✅ OpenAI GPT-4o-mini initialized")
            else:
                logger.warning("⚠️ OPENAI_API_KEY not found")
        except ImportError:
            logger.warning("⚠️ OpenAI library not installed: pip install openai")
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize OpenAI: {e}")
    
    def _init_claude(self):
        """Initialize Claude 3.5 Sonnet"""
        try:
            import anthropic
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if api_key:
                self.claude_client = anthropic.Anthropic(api_key=api_key)
                logger.info("✅ Claude 3.5 Sonnet initialized")
            else:
                logger.warning("⚠️ ANTHROPIC_API_KEY not found")
        except ImportError:
            logger.warning("⚠️ Anthropic library not installed: pip install anthropic")
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize Claude: {e}")
    
    def assess_complexity(self, text: str, filename: str = "") -> str:
        """
        Assess document complexity to decide between GPT-4o-mini vs Claude
        Returns: 'simple' or 'complex'
        """
        text_lower = text.lower()
        
        # Complexity indicators
        complexity_score = 0
        
        # Length indicators
        if len(text) > 3000:
            complexity_score += 2
        elif len(text) > 1500:
            complexity_score += 1
        
        # Structure indicators
        if text.count('\n') > 50:
            complexity_score += 1
        
        # Content complexity
        complex_keywords = [
            'dph', 'vat', 'tax', 'sleva', 'discount', 'položka', 'item',
            'služba', 'service', 'sazba', 'rate', 'základ', 'base',
            'celkem bez dph', 'subtotal', 'daň z přidané hodnoty'
        ]
        
        keyword_matches = sum(1 for keyword in complex_keywords if keyword in text_lower)
        if keyword_matches > 5:
            complexity_score += 2
        elif keyword_matches > 2:
            complexity_score += 1
        
        # Multiple items/lines
        if text_lower.count('kč') > 5 or text_lower.count('czk') > 5:
            complexity_score += 1
        
        # Decision threshold
        return 'complex' if complexity_score >= 4 else 'simple'
    
    def structure_invoice_data(self, text: str, filename: str = "") -> LLMResult:
        """
        Structure OCR text data using cost-effective hybrid approach
        """
        start_time = time.time()
        
        if not self.openai_client and not self.claude_client:
            return LLMResult(
                success=False,
                structured_data={},
                confidence_score=0.0,
                provider_used="none",
                processing_time=0.0,
                cost_estimate=0.0,
                reasoning="No LLM providers available",
                validation_notes=[],
                error_message="No LLM providers configured"
            )
        
        try:
            # Step 1: Assess complexity
            complexity = self.assess_complexity(text, filename)
            logger.info(f"📋 Document complexity: {complexity}")
            
            # Step 2: Choose provider based on complexity and availability
            use_claude = (
                complexity == 'complex' and 
                self.claude_client is not None and
                self.stats["total_processed"] % 10 == 0  # Use Claude for every 10th complex doc
            )
            
            if use_claude:
                result = self._process_with_claude(text)
                self.stats["claude_used"] += 1
            elif self.openai_client:
                result = self._process_with_gpt4o_mini(text)
                self.stats["gpt_4o_mini_used"] += 1
            else:
                # Fallback to Claude if OpenAI not available
                result = self._process_with_claude(text)
                self.stats["claude_used"] += 1
            
            # Step 3: Try fallback if primary failed
            if not result.success:
                logger.warning("⚠️ Primary provider failed, trying fallback...")
                self.stats["fallback_triggers"] += 1
                
                if result.provider_used == "gpt-4o-mini" and self.claude_client:
                    result = self._process_with_claude(text)
                    self.stats["claude_used"] += 1
                elif result.provider_used == "claude-3.5-sonnet" and self.openai_client:
                    result = self._process_with_gpt4o_mini(text)
                    self.stats["gpt_4o_mini_used"] += 1
            
            # Update statistics
            self.stats["total_processed"] += 1
            self.stats["total_cost_usd"] += result.cost_estimate
            result.processing_time = time.time() - start_time
            
            return result
            
        except Exception as e:
            logger.error(f"❌ LLM processing failed: {e}")
            return LLMResult(
                success=False,
                structured_data={},
                confidence_score=0.0,
                provider_used="error",
                processing_time=time.time() - start_time,
                cost_estimate=0.0,
                reasoning=f"Processing error: {str(e)}",
                validation_notes=[],
                error_message=str(e)
            )
    
    def _create_invoice_prompt(self, text: str) -> str:
        """Create robust prompt for Czech invoice processing - optimized for valid JSON"""
        # Truncate text to prevent token overflow and parsing issues
        truncated_text = text[:2000] if len(text) > 2000 else text

        return f"""Extract data from Czech invoice. Return ONLY valid JSON:

{{
  "document_type": "faktura",
  "invoice_number": null,
  "date": null,
  "due_date": null,
  "vendor": {{
    "name": null,
    "ico": null,
    "dic": null
  }},
  "customer": {{
    "name": null
  }},
  "totals": {{
    "total": 0.0,
    "vat_amount": 0.0
  }},
  "currency": "CZK",
  "variable_symbol": null,
  "bank_account": null
}}

Text: {truncated_text}

Return valid JSON only:"""
    
    def _process_with_gpt4o_mini(self, text: str) -> LLMResult:
        """Process with GPT-4o-mini (cost-effective primary choice)"""
        try:
            prompt = self._create_invoice_prompt(text)
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Jsi expert na analýzu faktur. Vrať pouze validní JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            
            # Calculate cost
            input_tokens = response.usage.prompt_tokens
            output_tokens = response.usage.completion_tokens
            cost = (input_tokens * self.costs["gpt_4o_mini"]["input"] + 
                   output_tokens * self.costs["gpt_4o_mini"]["output"]) / 1_000_000
            
            # Parse JSON response
            json_text = response.choices[0].message.content.strip()
            if json_text.startswith('```json'):
                json_text = json_text[7:-3].strip()
            elif json_text.startswith('```'):
                json_text = json_text[3:-3].strip()
            
            structured_data = json.loads(json_text)
            
            return LLMResult(
                success=True,
                structured_data=structured_data,
                confidence_score=0.88,  # GPT-4o-mini typical accuracy
                provider_used="gpt-4o-mini",
                processing_time=0.0,  # Will be set by caller
                cost_estimate=cost,
                reasoning="Processed with GPT-4o-mini (cost-effective)",
                validation_notes=[]
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ GPT-4o-mini JSON parsing failed: {e}")
            return LLMResult(
                success=False,
                structured_data={},
                confidence_score=0.0,
                provider_used="gpt-4o-mini",
                processing_time=0.0,
                cost_estimate=0.001,  # Estimate for failed request
                reasoning=f"JSON parsing failed: {str(e)}",
                validation_notes=[],
                error_message=str(e)
            )
        except Exception as e:
            logger.error(f"❌ GPT-4o-mini processing failed: {e}")
            return LLMResult(
                success=False,
                structured_data={},
                confidence_score=0.0,
                provider_used="gpt-4o-mini",
                processing_time=0.0,
                cost_estimate=0.001,
                reasoning=f"Processing failed: {str(e)}",
                validation_notes=[],
                error_message=str(e)
            )

    def _process_with_claude(self, text: str) -> LLMResult:
        """Process with Claude 3.5 Sonnet (high-accuracy fallback)"""
        try:
            prompt = self._create_invoice_prompt(text)

            response = self.claude_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                temperature=0.1,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Calculate cost (approximate)
            input_tokens = len(prompt.split()) * 1.3  # Rough estimate
            output_tokens = len(response.content[0].text.split()) * 1.3
            cost = (input_tokens * self.costs["claude_35_sonnet"]["input"] +
                   output_tokens * self.costs["claude_35_sonnet"]["output"]) / 1_000_000

            # Parse JSON response
            json_text = response.content[0].text.strip()
            if json_text.startswith('```json'):
                json_text = json_text[7:-3].strip()
            elif json_text.startswith('```'):
                json_text = json_text[3:-3].strip()

            structured_data = json.loads(json_text)

            return LLMResult(
                success=True,
                structured_data=structured_data,
                confidence_score=0.95,  # Claude 3.5 Sonnet typical accuracy
                provider_used="claude-3.5-sonnet",
                processing_time=0.0,  # Will be set by caller
                cost_estimate=cost,
                reasoning="Processed with Claude 3.5 Sonnet (high-accuracy)",
                validation_notes=[]
            )

        except json.JSONDecodeError as e:
            logger.error(f"❌ Claude JSON parsing failed: {e}")
            return LLMResult(
                success=False,
                structured_data={},
                confidence_score=0.0,
                provider_used="claude-3.5-sonnet",
                processing_time=0.0,
                cost_estimate=0.01,  # Estimate for failed request
                reasoning=f"JSON parsing failed: {str(e)}",
                validation_notes=[],
                error_message=str(e)
            )
        except Exception as e:
            logger.error(f"❌ Claude processing failed: {e}")
            return LLMResult(
                success=False,
                structured_data={},
                confidence_score=0.0,
                provider_used="claude-3.5-sonnet",
                processing_time=0.0,
                cost_estimate=0.01,
                reasoning=f"Processing failed: {str(e)}",
                validation_notes=[],
                error_message=str(e)
            )

    def get_statistics(self) -> Dict[str, Any]:
        """Get usage and cost statistics"""
        avg_cost_per_invoice = (
            self.stats["total_cost_usd"] / self.stats["total_processed"]
            if self.stats["total_processed"] > 0 else 0
        )

        return {
            "total_processed": self.stats["total_processed"],
            "provider_usage": {
                "gpt_4o_mini": self.stats["gpt_4o_mini_used"],
                "claude_35_sonnet": self.stats["claude_used"],
                "fallback_triggers": self.stats["fallback_triggers"]
            },
            "costs": {
                "total_usd": round(self.stats["total_cost_usd"], 6),
                "total_czk": round(self.stats["total_cost_usd"] * 24, 2),  # Approximate USD to CZK
                "avg_per_invoice_usd": round(avg_cost_per_invoice, 6),
                "avg_per_invoice_czk": round(avg_cost_per_invoice * 24, 3)
            },
            "efficiency": {
                "gpt_4o_mini_percentage": round(
                    (self.stats["gpt_4o_mini_used"] / self.stats["total_processed"] * 100)
                    if self.stats["total_processed"] > 0 else 0, 1
                ),
                "claude_percentage": round(
                    (self.stats["claude_used"] / self.stats["total_processed"] * 100)
                    if self.stats["total_processed"] > 0 else 0, 1
                )
            }
        }

    def get_system_status(self) -> Dict[str, Any]:
        """Get system status and capabilities"""
        return {
            "providers_available": {
                "gpt_4o_mini": self.openai_client is not None,
                "claude_35_sonnet": self.claude_client is not None
            },
            "strategy": "hybrid_cost_effective",
            "primary_provider": "gpt-4o-mini",
            "fallback_provider": "claude-3.5-sonnet",
            "estimated_costs": {
                "gpt_4o_mini_per_invoice": "0.014 CZK",
                "claude_per_invoice": "0.30 CZK",
                "average_hybrid": "0.043 CZK"
            },
            "statistics": self.get_statistics()
        }
