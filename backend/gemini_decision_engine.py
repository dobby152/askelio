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
from dotenv import load_dotenv
from ocr_manager import OCRResult

# Load environment variables
load_dotenv()

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

@dataclass
class GeminiStructuredData:
    """Result from Gemini AI data structuring"""
    structured_data: Dict[str, any]
    confidence_score: float
    validation_notes: str
    fields_extracted: List[str]
    processing_time: float
    success: bool
    comparison_with_basic: Optional[Dict[str, any]] = None
    error_message: Optional[str] = None

class GeminiDecisionEngine:
    """
    Gemini AI Decision Engine for analyzing OCR results
    Makes intelligent decisions about which OCR result is best for invoices/receipts
    """
    
    def __init__(self):
        logger.info(f"🚀 Initializing Gemini Decision Engine with API key: {bool(os.getenv('GOOGLE_API_KEY'))}")
        self.model = self._initialize_gemini()
        self.is_available = self.model is not None
        logger.info(f"🎯 Gemini engine initialized: model={self.model is not None}, is_available={self.is_available}")

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
            model = genai.GenerativeModel('gemini-1.5-flash')
            
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
    
    def structure_and_validate_data(self, text: str, basic_structured_data: Optional[Dict[str, any]] = None, document_type: str = "invoice") -> GeminiStructuredData:
        """
        Use Gemini AI to structure and validate extracted text data
        Optionally compare with basic regex-based extraction
        """
        import time
        start_time = time.time()

        if not self.is_available:
            return self._fallback_structuring(text, basic_structured_data, start_time)

        try:
            logger.info(f"Starting Gemini AI data structuring for {document_type}")

            # Create structuring prompt
            prompt = self._create_structuring_prompt(text, basic_structured_data, document_type)

            # Get Gemini AI analysis
            response = self.model.generate_content(prompt)

            if not response or not response.text:
                logger.warning("Empty response from Gemini AI for structuring, using fallback")
                return self._fallback_structuring(text, basic_structured_data, start_time)

            # Parse Gemini response
            structured_result = self._parse_structuring_response(response.text, basic_structured_data, start_time)

            logger.info(f"Gemini AI structuring completed with confidence: {structured_result.confidence_score}")
            return structured_result

        except Exception as e:
            logger.error(f"Error in Gemini AI structuring: {e}")
            return self._fallback_structuring(text, basic_structured_data, start_time, str(e))

    def _create_structuring_prompt(self, text: str, basic_data: Optional[Dict[str, any]], document_type: str) -> str:
        """Create prompt for Gemini AI data structuring"""

        comparison_section = ""
        if basic_data:
            comparison_section = f"""
BASIC EXTRACTION RESULTS (for comparison):
{json.dumps(basic_data, indent=2, ensure_ascii=False)}

Please compare your extraction with the basic results and note any improvements or corrections.
"""

        prompt = f"""
You are an expert at extracting structured data from Czech {document_type} documents.
Analyze the following OCR text and extract all relevant information into a structured format.

OCR TEXT:
{text}

{comparison_section}

INSTRUCTIONS:
1. Extract ALL relevant fields for a Czech {document_type}
2. Recognize Czech field names: "Dodavatel", "Odběratel", "Číslo účtu", "Datum vystavení", "Datum splatnosti", "Celkem k úhradě", "IČO", "DIČ", "Variabilní symbol", "Konstantní symbol"
3. Standardize dates to YYYY-MM-DD format (Czech format is usually DD.MM.YYYY)
4. Extract amounts with proper decimal formatting (Czech uses comma as decimal separator)
5. Identify vendor/supplier information including IČO (company ID), DIČ (tax ID) if present
6. Extract customer/buyer information including IČO, DIČ if present
7. Extract line items with descriptions, quantities, unit prices, totals
8. Extract payment information: bank account, variable symbol, constant symbol
9. Provide confidence score for each field (0.0-1.0)
10. Note any validation issues or corrections made

CZECH FIELD MAPPING:
- "Dodavatel" = vendor/supplier
- "Odběratel" = customer/buyer
- "Číslo faktury" / "Faktura č." = invoice number
- "Datum vystavení" = date issued
- "Datum splatnosti" = due date
- "Celkem k úhradě" / "CELKEM K ÚHRADĚ" = total amount
- "IČO" = company identification number
- "DIČ" = tax identification number
- "Variabilní symbol" = variable symbol for payment
- "Konstantní symbol" = constant symbol for payment

REQUIRED RESPONSE FORMAT (JSON only):
{{
    "structured_data": {{
        "document_type": "{document_type}",
        "invoice_number": "extracted_value_or_null",
        "date_issued": "YYYY-MM-DD_or_null",
        "due_date": "YYYY-MM-DD_or_null",
        "total_amount": {{
            "value": "numeric_value_or_null",
            "currency": "detected_currency_or_CZK"
        }},
        "vendor": {{
            "name": "vendor_name_or_null",
            "ico": "ico_number_or_null",
            "dic": "dic_number_or_null",
            "address": "address_or_null",
            "email": "email_or_null",
            "phone": "phone_or_null"
        }},
        "customer": {{
            "name": "customer_name_or_null",
            "ico": "ico_number_or_null",
            "dic": "dic_number_or_null",
            "address": "address_or_null"
        }},
        "payment_info": {{
            "variable_symbol": "variable_symbol_or_null",
            "constant_symbol": "constant_symbol_or_null",
            "bank_account": "account_number_or_null",
            "payment_method": "payment_method_or_null"
        }},
        "line_items": [
            {{
                "description": "item_description",
                "quantity": "quantity_or_null",
                "unit": "unit_or_null",
                "unit_price": "price_or_null",
                "total_price": "total_or_null"
            }}
        ],
        "tax_info": {{
            "vat_rate": "vat_percentage_or_null",
            "vat_amount": "vat_amount_or_null",
            "total_without_vat": "amount_or_null"
        }},
        "additional_info": {{
            "order_number": "order_number_or_null",
            "delivery_date": "YYYY-MM-DD_or_null",
            "payment_terms": "payment_terms_or_null"
        }}
    }},
    "field_confidence": {{
        "invoice_number": 0.95,
        "date_issued": 0.90,
        "total_amount": 0.85,
        "vendor_name": 0.90,
        "customer_name": 0.85
    }},
    "validation_notes": "Any issues, corrections, or improvements made",
    "overall_confidence": 0.90,
    "fields_extracted": ["list", "of", "successfully", "extracted", "fields"]
}}

Respond with ONLY the JSON, no additional text.
"""
        return prompt

    def _parse_structuring_response(self, response_text: str, basic_data: Optional[Dict[str, any]], start_time: float) -> GeminiStructuredData:
        """Parse Gemini AI structuring response"""
        import time

        try:
            # Clean response text
            response_text = response_text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            # Parse JSON
            analysis = json.loads(response_text)

            # Compare with basic data if provided
            comparison = None
            if basic_data:
                comparison = self._compare_extractions(basic_data, analysis.get("structured_data", {}))

            return GeminiStructuredData(
                structured_data=analysis.get("structured_data", {}),
                confidence_score=analysis.get("overall_confidence", 0.8),
                validation_notes=analysis.get("validation_notes", "Gemini AI structuring completed"),
                fields_extracted=analysis.get("fields_extracted", []),
                processing_time=time.time() - start_time,
                success=True,
                comparison_with_basic=comparison
            )

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini structuring response as JSON: {e}")
            logger.debug(f"Response text: {response_text}")
            return self._fallback_structuring("", basic_data, start_time, f"JSON parse error: {e}")
        except Exception as e:
            logger.error(f"Error parsing Gemini structuring response: {e}")
            return self._fallback_structuring("", basic_data, start_time, str(e))

    def _compare_extractions(self, basic_data: Dict[str, any], gemini_data: Dict[str, any]) -> Dict[str, any]:
        """Compare basic regex extraction with Gemini extraction"""
        comparison = {
            "basic_fields_count": len(basic_data.get("fields", {})),
            "gemini_fields_count": len([k for k, v in gemini_data.items() if v is not None]),
            "improvements": [],
            "differences": []
        }

        # Compare specific fields
        basic_fields = basic_data.get("fields", {})
        for field_name in ["invoice_number", "date", "total_amount", "vendor"]:
            basic_value = basic_fields.get(field_name)
            gemini_value = gemini_data.get(field_name if field_name != "date" else "date_issued")

            if basic_value != gemini_value:
                comparison["differences"].append({
                    "field": field_name,
                    "basic": basic_value,
                    "gemini": gemini_value
                })

        return comparison

    def _fallback_structuring(self, text: str, basic_data: Optional[Dict[str, any]], start_time: float, error_msg: str = None) -> GeminiStructuredData:
        """Fallback structuring when Gemini AI is not available"""
        import time

        # Use basic data if available, otherwise create minimal structure
        if basic_data and "fields" in basic_data:
            structured_data = {
                "document_type": "invoice",
                "invoice_number": basic_data["fields"].get("invoice_number"),
                "date_issued": basic_data["fields"].get("date"),
                "total_amount": {
                    "value": basic_data["fields"].get("total_amount"),
                    "currency": "CZK"
                },
                "vendor": {
                    "name": basic_data["fields"].get("vendor")
                }
            }
            fields_extracted = list(basic_data["fields"].keys())
            confidence = basic_data.get("extraction_confidence", 0.5)
        else:
            structured_data = {"document_type": "invoice"}
            fields_extracted = []
            confidence = 0.0

        return GeminiStructuredData(
            structured_data=structured_data,
            confidence_score=confidence,
            validation_notes=f"Fallback structuring used. {error_msg or 'Gemini AI not available'}",
            fields_extracted=fields_extracted,
            processing_time=time.time() - start_time,
            success=False,
            error_message=error_msg
        )

    def get_status(self) -> Dict[str, any]:
        """Get Gemini AI engine status"""
        logger.info(f"🔍 Gemini status check: is_available={self.is_available}, api_key={bool(os.getenv('GOOGLE_API_KEY'))}, model={self.model}")
        return {
            "available": self.is_available,
            "api_key_configured": bool(os.getenv('GOOGLE_API_KEY')),
            "model_name": "gemini-1.5-flash" if self.is_available else None,
            "engine_type": "google_generative_ai",
            "features": ["ocr_analysis", "data_structuring", "validation"]
        }
