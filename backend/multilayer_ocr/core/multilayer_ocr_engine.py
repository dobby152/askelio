"""
Multilayer OCR Engine - Main orchestrator for multilayer OCR processing
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

from .ocr_provider_base import OCRProviderBase
from .ocr_result import (
    OCRResult, MultilayerOCRResult, ProcessingMethod, OCRProviderType
)

logger = logging.getLogger(__name__)


class MultilayerOCREngine:
    """
    Main engine for multilayer OCR processing
    Orchestrates multiple OCR providers and AI decision making
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.providers: List[OCRProviderBase] = []
        self.ai_decision_engine = None
        self.result_fusion_engine = None
        self.max_workers = self.config.get('max_workers', 5)
        self.timeout = self.config.get('timeout', 300)  # 5 minutes default
        
        # Provider weights for decision making
        self.provider_weights = self.config.get('provider_weights', {
            OCRProviderType.GOOGLE_VISION: 1.0,
            OCRProviderType.AZURE_COMPUTER_VISION: 0.95,
            OCRProviderType.AWS_TEXTRACT: 0.9,
            OCRProviderType.TESSERACT: 0.7,
            OCRProviderType.PADDLE_OCR: 0.8,
            OCRProviderType.EASY_OCR: 0.75
        })
    
    def register_provider(self, provider: OCRProviderBase) -> None:
        """Register an OCR provider"""
        if provider.is_provider_available():
            self.providers.append(provider)
            logger.info(f"Registered OCR provider: {provider.provider_type.value}")
        else:
            logger.warning(f"OCR provider not available: {provider.provider_type.value}")
    
    def register_ai_decision_engine(self, ai_engine) -> None:
        """Register AI decision engine"""
        self.ai_decision_engine = ai_engine
        logger.info("AI Decision Engine registered")
    
    def register_result_fusion_engine(self, fusion_engine) -> None:
        """Register result fusion engine"""
        self.result_fusion_engine = fusion_engine
        logger.info("Result Fusion Engine registered")
    
    def get_available_providers(self) -> List[OCRProviderType]:
        """Get list of available providers"""
        return [provider.provider_type for provider in self.providers if provider.is_provider_available()]
    
    async def process_document(self, image_path: str, 
                             processing_methods: List[ProcessingMethod] = None,
                             selected_providers: List[OCRProviderType] = None) -> MultilayerOCRResult:
        """
        Process document using multilayer OCR approach
        
        Args:
            image_path: Path to the image file
            processing_methods: List of preprocessing methods to try
            selected_providers: Specific providers to use (if None, use all available)
        
        Returns:
            MultilayerOCRResult with best result and all results
        """
        start_time = time.time()
        
        # Default processing methods
        if processing_methods is None:
            processing_methods = [ProcessingMethod.BASIC, ProcessingMethod.GENTLE]
        
        # Filter providers
        active_providers = self._get_active_providers(selected_providers)
        
        if not active_providers:
            raise ValueError("No OCR providers available")
        
        logger.info(f"Starting multilayer OCR processing with {len(active_providers)} providers")
        logger.info(f"Active providers: {[p.provider_type.value for p in active_providers]}")
        
        # Run OCR processing in parallel
        all_results = await self._run_parallel_ocr(active_providers, image_path, processing_methods)
        
        # Filter successful results
        successful_results = [result for result in all_results if result.success]
        
        if not successful_results:
            # If no successful results, return the best error result
            best_error = max(all_results, key=lambda x: x.confidence)
            return MultilayerOCRResult(
                best_result=best_error,
                all_results=all_results,
                ai_decision_metadata={'error': 'No successful OCR results'},
                fusion_applied=False,
                final_confidence=0.0,
                processing_summary={
                    'total_providers': len(active_providers),
                    'successful_providers': 0,
                    'processing_time': time.time() - start_time,
                    'error': 'All OCR providers failed'
                }
            )
        
        # Use AI decision engine to select best result
        best_result, ai_metadata = await self._select_best_result(successful_results)
        
        # Apply result fusion if available and beneficial
        fusion_applied = False
        if self.result_fusion_engine and len(successful_results) > 1:
            fused_result = await self._apply_result_fusion(successful_results, best_result)
            if fused_result and fused_result.confidence > best_result.confidence:
                best_result = fused_result
                fusion_applied = True
                logger.info("Result fusion applied and improved confidence")
        
        # Calculate final confidence
        final_confidence = self._calculate_final_confidence(best_result, successful_results)
        
        processing_summary = {
            'total_providers': len(active_providers),
            'successful_providers': len(successful_results),
            'processing_time': time.time() - start_time,
            'best_provider': best_result.provider.value,
            'fusion_applied': fusion_applied,
            'average_confidence': sum(r.confidence for r in successful_results) / len(successful_results)
        }
        
        logger.info(f"Multilayer OCR completed in {processing_summary['processing_time']:.2f}s")
        logger.info(f"Best provider: {best_result.provider.value} (confidence: {best_result.confidence:.3f})")
        
        return MultilayerOCRResult(
            best_result=best_result,
            all_results=all_results,
            ai_decision_metadata=ai_metadata,
            fusion_applied=fusion_applied,
            final_confidence=final_confidence,
            processing_summary=processing_summary
        )
    
    def _get_active_providers(self, selected_providers: List[OCRProviderType] = None) -> List[OCRProviderBase]:
        """Get active providers based on selection"""
        if selected_providers:
            return [p for p in self.providers 
                   if p.provider_type in selected_providers and p.is_provider_available()]
        else:
            return [p for p in self.providers if p.is_provider_available()]
    
    async def _run_parallel_ocr(self, providers: List[OCRProviderBase], 
                               image_path: str, 
                               processing_methods: List[ProcessingMethod]) -> List[OCRResult]:
        """Run OCR processing in parallel across providers and methods"""
        tasks = []
        
        # Create tasks for each provider-method combination
        for provider in providers:
            for method in processing_methods:
                task = asyncio.create_task(
                    self._run_single_ocr(provider, image_path, method)
                )
                tasks.append(task)
        
        # Wait for all tasks to complete with timeout
        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=self.timeout
            )
        except asyncio.TimeoutError:
            logger.warning(f"OCR processing timed out after {self.timeout} seconds")
            results = []
            for task in tasks:
                if not task.done():
                    task.cancel()
                else:
                    try:
                        results.append(task.result())
                    except Exception as e:
                        logger.error(f"Task failed: {e}")
        
        # Filter out exceptions and failed results
        valid_results = []
        for result in results:
            if isinstance(result, OCRResult):
                valid_results.append(result)
            elif isinstance(result, Exception):
                logger.error(f"OCR task failed with exception: {result}")
        
        return valid_results
    
    async def _run_single_ocr(self, provider: OCRProviderBase, 
                             image_path: str, 
                             processing_method: ProcessingMethod) -> OCRResult:
        """Run OCR for a single provider and method"""
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor(max_workers=1) as executor:
                result = await loop.run_in_executor(
                    executor, 
                    provider.extract_text_with_metadata, 
                    image_path, 
                    processing_method
                )
            return result
        except Exception as e:
            logger.error(f"Error in {provider.provider_type.value} with {processing_method.value}: {e}")
            return provider._create_error_result(str(e), image_path, processing_method, time.time())
    
    async def _select_best_result(self, results: List[OCRResult]) -> tuple:
        """Select best result using AI decision engine or fallback logic"""
        if self.ai_decision_engine:
            return await self.ai_decision_engine.select_best_result(results)
        else:
            # Fallback: weighted confidence scoring
            best_result = max(results, key=lambda r: r.confidence * self.provider_weights.get(r.provider, 0.5))
            ai_metadata = {
                'method': 'weighted_confidence_fallback',
                'selected_provider': best_result.provider.value,
                'confidence': best_result.confidence,
                'weight': self.provider_weights.get(best_result.provider, 0.5)
            }
            return best_result, ai_metadata
    
    async def _apply_result_fusion(self, results: List[OCRResult], best_result: OCRResult) -> Optional[OCRResult]:
        """Apply result fusion if available"""
        if self.result_fusion_engine:
            try:
                return await self.result_fusion_engine.fuse_results(results, best_result)
            except Exception as e:
                logger.error(f"Result fusion failed: {e}")
                return None
        return None
    
    def _calculate_final_confidence(self, best_result: OCRResult, all_results: List[OCRResult]) -> float:
        """Calculate final confidence score"""
        base_confidence = best_result.confidence
        
        # Boost confidence if multiple providers agree
        if len(all_results) > 1:
            # Calculate agreement score based on text similarity
            agreement_scores = []
            for other_result in all_results:
                if other_result != best_result:
                    similarity = self._calculate_text_similarity(best_result.text, other_result.text)
                    agreement_scores.append(similarity)
            
            if agreement_scores:
                avg_agreement = sum(agreement_scores) / len(agreement_scores)
                # Boost confidence by up to 20% based on agreement
                confidence_boost = min(0.2, avg_agreement * 0.3)
                base_confidence = min(1.0, base_confidence + confidence_boost)
        
        return base_confidence
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts (simplified)"""
        if not text1 or not text2:
            return 0.0
        
        # Simple word-based similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 and not words2:
            return 1.0
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    def get_engine_status(self) -> Dict[str, Any]:
        """Get status of the multilayer OCR engine"""
        return {
            'available_providers': [p.provider_type.value for p in self.providers if p.is_provider_available()],
            'total_providers': len(self.providers),
            'ai_decision_engine': self.ai_decision_engine is not None,
            'result_fusion_engine': self.result_fusion_engine is not None,
            'max_workers': self.max_workers,
            'timeout': self.timeout,
            'provider_weights': {k.value: v for k, v in self.provider_weights.items()}
        }
