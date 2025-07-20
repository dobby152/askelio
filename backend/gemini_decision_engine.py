"""
Clean Gemini AI Decision Engine for OCR result analysis
Uses official Google Generative AI library
"""
import os
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
import json
import google.generativeai as genai
from ocr_manager import OCRResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class GeminiDecision:
    """Result from Gemini AI decision engine"""
    selected_provider: str
    confidence_score: float
    reasoning: str
    quality_analysis: Dict[str, float]
    text_result: str
    processing_time: float
    success: bool
    error_message: Optional[str] = None

class GeminiDecisionEngine:
    """
    Gemini AI Decision Engine for analyzing OCR results
    Makes intelligent decisions about which OCR result is best for invoices/receipts
    """
    
    def __init__(self):
        self.model = self._initialize_gemini()
        self.is_available = self.model is not None
        
        if self.is_available:
            logger.info("Gemini AI Decision Engine initialized successfully")
        else:
            logger.warning("Gemini AI Decision Engine not available")
    
    def _initialize_gemini(self):
        """Initialize Gemini AI model"""
        try:
            api_key = os.getenv('GOOGLE_API_KEY')
            if not api_key:
                logger.warning("GOOGLE_API_KEY not found in environment variables")
                return None
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-pro')
            
            # Test the connection
            test_response = model.generate_content("Test connection")
            if test_response:
                logger.info("Gemini AI connection test successful")
                return model
            else:
                logger.warning("Gemini AI connection test failed")
                return None
                
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini AI: {e}")
            return None
    
    def analyze_ocr_results(self, ocr_results: List[OCRResult], document_type: str = "invoice") -> GeminiDecision:
        """
        Analyze OCR results and select the best one using Gemini AI
        Sequential analysis of all results
        """
        import time
        start_time = time.time()
        
        if not self.is_available:
            # Fallback to simple heuristic selection
            return self._fallback_selection(ocr_results, start_time)
        
        try:
            logger.info(f"Starting Gemini AI analysis of {len(ocr_results)} OCR results")
            
            # Prepare the analysis prompt
            prompt = self._create_analysis_prompt(ocr_results, document_type)
            
            # Get Gemini AI analysis
            response = self.model.generate_content(prompt)
            
            if not response or not response.text:
                logger.warning("Empty response from Gemini AI, using fallback")
                return self._fallback_selection(ocr_results, start_time)
            
            # Parse Gemini response
            decision = self._parse_gemini_response(response.text, ocr_results, start_time)
            
            logger.info(f"Gemini AI selected provider: {decision.selected_provider} with confidence: {decision.confidence_score}")
            return decision
            
        except Exception as e:
            logger.error(f"Error in Gemini AI analysis: {e}")
            return self._fallback_selection(ocr_results, start_time)
    
    def _create_analysis_prompt(self, ocr_results: List[OCRResult], document_type: str) -> str:
        """Create analysis prompt for Gemini AI"""
        
        # Prepare OCR results summary
        results_summary = []
        for i, result in enumerate(ocr_results):
            if result.success:
                results_summary.append({
                    "provider": result.provider,
                    "confidence": result.confidence,
                    "text_length": len(result.text),
                    "text_preview": result.text[:200] + "..." if len(result.text) > 200 else result.text,
                    "processing_time": result.processing_time
                })
        
        prompt = f"""
You are an expert OCR analysis system. Analyze the following OCR results from different providers for a {document_type} document and select the best result.

OCR RESULTS:
{json.dumps(results_summary, indent=2)}

ANALYSIS CRITERIA:
1. Text quality and completeness
2. Confidence scores from providers
3. Logical structure for {document_type} documents
4. Presence of key information (amounts, dates, vendor names for invoices)
5. Text coherence and readability

INSTRUCTIONS:
- Analyze each result carefully
- Consider the specific requirements for {document_type} processing
- Select the provider that gives the most accurate and complete result
- Provide detailed reasoning for your choice

RESPONSE FORMAT (JSON):
{{
    "selected_provider": "provider_name",
    "confidence_score": 0.95,
    "reasoning": "Detailed explanation of why this provider was selected",
    "quality_analysis": {{
        "text_completeness": 0.9,
        "structure_quality": 0.85,
        "key_information_presence": 0.95,
        "overall_quality": 0.9
    }},
    "provider_scores": {{
        "google_vision": 0.85,
        "azure_computer_vision": 0.80,
        "tesseract": 0.70,
        "easy_ocr": 0.75,
        "paddle_ocr": 0.78
    }}
}}

Respond with ONLY the JSON, no additional text.
"""
        return prompt
    
    def _parse_gemini_response(self, response_text: str, ocr_results: List[OCRResult], start_time: float) -> GeminiDecision:
        """Parse Gemini AI response and create decision"""
        import time
        
        try:
            # Clean the response text
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            # Parse JSON response
            analysis = json.loads(response_text)
            
            selected_provider = analysis.get("selected_provider", "")
            
            # Find the selected OCR result
            selected_result = None
            for result in ocr_results:
                if result.provider == selected_provider and result.success:
                    selected_result = result
                    break
            
            if not selected_result:
                # If selected provider not found, use fallback
                logger.warning(f"Selected provider {selected_provider} not found in results, using fallback")
                return self._fallback_selection(ocr_results, start_time)
            
            return GeminiDecision(
                selected_provider=selected_provider,
                confidence_score=analysis.get("confidence_score", 0.8),
                reasoning=analysis.get("reasoning", "Gemini AI analysis"),
                quality_analysis=analysis.get("quality_analysis", {}),
                text_result=selected_result.text,
                processing_time=time.time() - start_time,
                success=True
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            logger.debug(f"Response text: {response_text}")
            return self._fallback_selection(ocr_results, start_time)
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return self._fallback_selection(ocr_results, start_time)
    
    def _fallback_selection(self, ocr_results: List[OCRResult], start_time: float) -> GeminiDecision:
        """Fallback selection method when Gemini AI is not available"""
        import time
        
        # Simple heuristic: select based on confidence and text length
        successful_results = [r for r in ocr_results if r.success and r.text.strip()]
        
        if not successful_results:
            return GeminiDecision(
                selected_provider="none",
                confidence_score=0.0,
                reasoning="No successful OCR results available",
                quality_analysis={},
                text_result="",
                processing_time=time.time() - start_time,
                success=False,
                error_message="No successful OCR results"
            )
        
        # Score each result based on confidence and text length
        scored_results = []
        for result in successful_results:
            # Normalize text length score (longer text usually better for invoices)
            text_length_score = min(len(result.text) / 1000, 1.0)  # Cap at 1000 chars
            
            # Combined score
            combined_score = (result.confidence * 0.7) + (text_length_score * 0.3)
            scored_results.append((result, combined_score))
        
        # Select the best result
        best_result, best_score = max(scored_results, key=lambda x: x[1])
        
        return GeminiDecision(
            selected_provider=best_result.provider,
            confidence_score=best_score,
            reasoning=f"Fallback selection based on confidence ({best_result.confidence:.2f}) and text length ({len(best_result.text)} chars)",
            quality_analysis={
                "confidence_score": best_result.confidence,
                "text_length": len(best_result.text),
                "fallback_used": True
            },
            text_result=best_result.text,
            processing_time=time.time() - start_time,
            success=True
        )
    
    def test_connection(self) -> Dict[str, any]:
        """Test Gemini AI connection"""
        if not self.is_available:
            return {
                "success": False,
                "message": "Gemini AI not initialized",
                "api_key_configured": bool(os.getenv('GOOGLE_API_KEY'))
            }
        
        try:
            response = self.model.generate_content("Hello, this is a connection test.")
            return {
                "success": True,
                "message": "Gemini AI connection successful",
                "response_received": bool(response and response.text)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Gemini AI connection failed: {str(e)}",
                "api_key_configured": bool(os.getenv('GOOGLE_API_KEY'))
            }
    
    def get_status(self) -> Dict[str, any]:
        """Get Gemini AI engine status"""
        return {
            "available": self.is_available,
            "api_key_configured": bool(os.getenv('GOOGLE_API_KEY')),
            "model_name": "gemini-pro" if self.is_available else None,
            "engine_type": "google_generative_ai"
        }
