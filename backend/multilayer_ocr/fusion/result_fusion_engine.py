"""
Result Fusion Engine for multilayer OCR system
Combines and optimizes results from multiple OCR providers
"""
import logging
import difflib
import re
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter
import numpy as np

from ..core.ocr_result import OCRResult, StructuredData, QualityMetrics, OCRMetadata, ProcessingMethod

logger = logging.getLogger(__name__)


class ResultFusionEngine:
    """
    Advanced result fusion engine that combines the best parts
    from multiple OCR results to create an optimized final result
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Fusion strategy weights
        self.fusion_weights = self.config.get('fusion_weights', {
            'text_fusion': 0.4,
            'structured_data_fusion': 0.4,
            'confidence_fusion': 0.2
        })
        
        # Minimum similarity threshold for text fusion
        self.similarity_threshold = self.config.get('similarity_threshold', 0.6)
        
        # Minimum confidence threshold for considering a result
        self.confidence_threshold = self.config.get('confidence_threshold', 0.3)
    
    async def fuse_results(self, results: List[OCRResult], best_result: OCRResult) -> Optional[OCRResult]:
        """
        Fuse multiple OCR results to create an optimized result
        
        Args:
            results: List of all OCR results
            best_result: The currently selected best result
            
        Returns:
            Fused OCRResult or None if fusion doesn't improve the result
        """
        if len(results) <= 1:
            return None
        
        # Filter results by confidence threshold
        valid_results = [r for r in results if r.confidence >= self.confidence_threshold]
        
        if len(valid_results) <= 1:
            return None
        
        logger.info(f"Fusing {len(valid_results)} OCR results")
        
        try:
            # Perform different types of fusion
            fused_text = self._fuse_text(valid_results, best_result)
            fused_structured_data = self._fuse_structured_data(valid_results, best_result)
            fused_confidence = self._calculate_fused_confidence(valid_results, best_result)
            
            # Create fused quality metrics
            fused_quality_metrics = self._create_fused_quality_metrics(valid_results, fused_text)
            
            # Create fused metadata
            fused_metadata = self._create_fused_metadata(valid_results, best_result)
            
            # Create the fused result
            fused_result = OCRResult(
                provider=best_result.provider,  # Keep the best provider as primary
                text=fused_text,
                confidence=fused_confidence,
                metadata=fused_metadata,
                structured_data=fused_structured_data,
                quality_metrics=fused_quality_metrics,
                success=True
            )
            
            # Only return fused result if it's actually better
            if self._is_fusion_better(fused_result, best_result):
                logger.info(f"Fusion improved result: confidence {best_result.confidence:.3f} -> {fused_confidence:.3f}")
                return fused_result
            else:
                logger.info("Fusion did not improve result, keeping original")
                return None
                
        except Exception as e:
            logger.error(f"Result fusion failed: {e}")
            return None
    
    def _fuse_text(self, results: List[OCRResult], best_result: OCRResult) -> str:
        """Fuse text from multiple results using intelligent merging"""
        if not results:
            return best_result.text
        
        # Start with the best result's text as base
        base_text = best_result.text
        
        # Try different fusion strategies
        strategies = [
            self._fuse_text_by_consensus,
            self._fuse_text_by_confidence_weighted_merge,
            self._fuse_text_by_longest_common_subsequence
        ]
        
        best_fused_text = base_text
        best_fusion_score = self._calculate_text_fusion_score(base_text, results)
        
        for strategy in strategies:
            try:
                fused_text = strategy(results, best_result)
                fusion_score = self._calculate_text_fusion_score(fused_text, results)
                
                if fusion_score > best_fusion_score:
                    best_fused_text = fused_text
                    best_fusion_score = fusion_score
                    
            except Exception as e:
                logger.warning(f"Text fusion strategy failed: {e}")
                continue
        
        return best_fused_text
    
    def _fuse_text_by_consensus(self, results: List[OCRResult], best_result: OCRResult) -> str:
        """Fuse text by finding consensus among results"""
        if len(results) <= 1:
            return best_result.text
        
        # Split all texts into words
        all_word_lists = []
        for result in results:
            words = result.text.split()
            all_word_lists.append(words)
        
        if not all_word_lists:
            return best_result.text
        
        # Find the longest word list as base
        base_words = max(all_word_lists, key=len)
        
        # For each position, find consensus word
        fused_words = []
        for i in range(len(base_words)):
            candidates = []
            
            # Collect candidates from all results
            for word_list in all_word_lists:
                if i < len(word_list):
                    candidates.append(word_list[i])
            
            if candidates:
                # Find most common word (consensus)
                word_counts = Counter(candidates)
                most_common_word = word_counts.most_common(1)[0][0]
                
                # Use consensus if it appears in at least half of the results
                if word_counts[most_common_word] >= len(candidates) / 2:
                    fused_words.append(most_common_word)
                else:
                    # Fall back to word from best result
                    fused_words.append(base_words[i])
            else:
                fused_words.append(base_words[i])
        
        return ' '.join(fused_words)
    
    def _fuse_text_by_confidence_weighted_merge(self, results: List[OCRResult], best_result: OCRResult) -> str:
        """Fuse text by weighting based on confidence scores"""
        if len(results) <= 1:
            return best_result.text
        
        # Create weighted text based on confidence
        weighted_texts = []
        total_weight = 0
        
        for result in results:
            weight = result.confidence
            weighted_texts.append((result.text, weight))
            total_weight += weight
        
        if total_weight == 0:
            return best_result.text
        
        # For now, return the text with highest weighted confidence
        # In a more advanced implementation, you could do character-level weighting
        best_weighted = max(weighted_texts, key=lambda x: x[1])
        return best_weighted[0]
    
    def _fuse_text_by_longest_common_subsequence(self, results: List[OCRResult], best_result: OCRResult) -> str:
        """Fuse text by finding longest common subsequences"""
        if len(results) <= 2:
            return best_result.text
        
        texts = [result.text for result in results]
        
        # Find common parts among all texts
        common_parts = self._find_common_text_parts(texts)
        
        if not common_parts:
            return best_result.text
        
        # Reconstruct text using common parts and best result as filler
        return self._reconstruct_text_with_common_parts(best_result.text, common_parts)
    
    def _find_common_text_parts(self, texts: List[str]) -> List[str]:
        """Find common text parts among multiple texts"""
        if len(texts) < 2:
            return []
        
        # Start with first two texts
        common_parts = []
        matcher = difflib.SequenceMatcher(None, texts[0], texts[1])
        
        for match in matcher.get_matching_blocks():
            if match.size > 5:  # Only consider substantial matches
                common_part = texts[0][match.a:match.a + match.size]
                common_parts.append(common_part.strip())
        
        # Filter common parts that appear in most texts
        filtered_parts = []
        for part in common_parts:
            count = sum(1 for text in texts if part in text)
            if count >= len(texts) * 0.6:  # Appears in at least 60% of texts
                filtered_parts.append(part)
        
        return filtered_parts
    
    def _reconstruct_text_with_common_parts(self, base_text: str, common_parts: List[str]) -> str:
        """Reconstruct text using common parts"""
        # For now, just return base text
        # In a more advanced implementation, you would intelligently merge
        return base_text
    
    def _calculate_text_fusion_score(self, text: str, results: List[OCRResult]) -> float:
        """Calculate how good a fused text is compared to original results"""
        if not text or not results:
            return 0.0
        
        # Calculate average similarity with all results
        similarities = []
        for result in results:
            similarity = difflib.SequenceMatcher(None, text.lower(), result.text.lower()).ratio()
            similarities.append(similarity)
        
        avg_similarity = np.mean(similarities) if similarities else 0.0
        
        # Bonus for length (longer text usually better)
        length_bonus = min(0.2, len(text) / 1000)
        
        # Bonus for having document patterns
        pattern_bonus = 0.1 if self._has_document_patterns(text) else 0.0
        
        return avg_similarity + length_bonus + pattern_bonus
    
    def _fuse_structured_data(self, results: List[OCRResult], best_result: OCRResult) -> StructuredData:
        """Fuse structured data from multiple results"""
        fused_data = StructuredData()
        
        # Collect all structured data
        all_data = [result.structured_data for result in results]
        
        # Fuse each field using voting or confidence-based selection
        fields = ['document_type', 'vendor', 'amount', 'currency', 'date', 'invoice_number']
        
        for field in fields:
            fused_value = self._fuse_structured_field(field, all_data, results)
            if fused_value is not None:
                setattr(fused_data, field, fused_value)
        
        # Fuse items and addresses (more complex structures)
        fused_data.items = self._fuse_items(all_data)
        fused_data.addresses = self._fuse_addresses(all_data)
        
        return fused_data
    
    def _fuse_structured_field(self, field: str, all_data: List[StructuredData], results: List[OCRResult]) -> Any:
        """Fuse a single structured data field"""
        values_with_confidence = []
        
        for i, data in enumerate(all_data):
            value = getattr(data, field, None)
            if value is not None and str(value).strip():
                confidence = results[i].confidence
                values_with_confidence.append((value, confidence))
        
        if not values_with_confidence:
            return None
        
        # For numeric fields (amount), use weighted average if values are close
        if field == 'amount':
            return self._fuse_numeric_field(values_with_confidence)
        
        # For other fields, use voting with confidence weighting
        return self._fuse_categorical_field(values_with_confidence)
    
    def _fuse_numeric_field(self, values_with_confidence: List[Tuple[Any, float]]) -> Optional[float]:
        """Fuse numeric field (like amount) using weighted average"""
        numeric_values = []
        
        for value, confidence in values_with_confidence:
            try:
                numeric_value = float(value)
                numeric_values.append((numeric_value, confidence))
            except (ValueError, TypeError):
                continue
        
        if not numeric_values:
            return None
        
        if len(numeric_values) == 1:
            return numeric_values[0][0]
        
        # Check if values are close (within 10% of each other)
        values_only = [v[0] for v in numeric_values]
        min_val, max_val = min(values_only), max(values_only)
        
        if max_val > 0 and (max_val - min_val) / max_val <= 0.1:
            # Values are close, use weighted average
            total_weighted = sum(value * confidence for value, confidence in numeric_values)
            total_weight = sum(confidence for _, confidence in numeric_values)
            return total_weighted / total_weight if total_weight > 0 else numeric_values[0][0]
        else:
            # Values are different, use highest confidence value
            return max(numeric_values, key=lambda x: x[1])[0]
    
    def _fuse_categorical_field(self, values_with_confidence: List[Tuple[Any, float]]) -> Any:
        """Fuse categorical field using confidence-weighted voting"""
        if not values_with_confidence:
            return None
        
        if len(values_with_confidence) == 1:
            return values_with_confidence[0][0]
        
        # Group by value and sum confidences
        value_confidence_sums = {}
        for value, confidence in values_with_confidence:
            str_value = str(value).strip().lower()
            if str_value not in value_confidence_sums:
                value_confidence_sums[str_value] = []
            value_confidence_sums[str_value].append((value, confidence))
        
        # Find value with highest total confidence
        best_value = None
        best_total_confidence = 0
        
        for str_value, value_conf_list in value_confidence_sums.items():
            total_confidence = sum(conf for _, conf in value_conf_list)
            if total_confidence > best_total_confidence:
                best_total_confidence = total_confidence
                # Use the original case from the highest confidence instance
                best_value = max(value_conf_list, key=lambda x: x[1])[0]
        
        return best_value
    
    def _fuse_items(self, all_data: List[StructuredData]) -> List[Dict[str, Any]]:
        """Fuse items lists from multiple structured data"""
        # For now, return items from the data with most items
        # In a more advanced implementation, you would merge similar items
        all_items = [data.items for data in all_data if data.items]
        
        if not all_items:
            return []
        
        return max(all_items, key=len)
    
    def _fuse_addresses(self, all_data: List[StructuredData]) -> List[Dict[str, str]]:
        """Fuse addresses from multiple structured data"""
        # Similar to items, return addresses from data with most addresses
        all_addresses = [data.addresses for data in all_data if data.addresses]
        
        if not all_addresses:
            return []
        
        return max(all_addresses, key=len)
    
    def _calculate_fused_confidence(self, results: List[OCRResult], best_result: OCRResult) -> float:
        """Calculate confidence for fused result"""
        if not results:
            return best_result.confidence
        
        # Use weighted average of confidences
        confidences = [result.confidence for result in results]
        weights = [result.confidence for result in results]  # Self-weighting
        
        if sum(weights) == 0:
            return best_result.confidence
        
        weighted_confidence = sum(conf * weight for conf, weight in zip(confidences, weights)) / sum(weights)
        
        # Boost confidence slightly due to fusion (multiple sources agreeing)
        fusion_bonus = min(0.1, len(results) * 0.02)  # Up to 10% bonus
        
        final_confidence = min(0.98, weighted_confidence + fusion_bonus)  # Cap at 98%
        
        return final_confidence
    
    def _create_fused_quality_metrics(self, results: List[OCRResult], fused_text: str) -> QualityMetrics:
        """Create quality metrics for fused result"""
        if not fused_text:
            return QualityMetrics(
                text_length=0, word_count=0, readable_word_ratio=0.0,
                special_char_ratio=0.0, ocr_error_count=0,
                language_consistency=0.0, structured_data_completeness=0.0,
                confidence_variance=0.0
            )
        
        # Calculate basic metrics
        words = fused_text.split()
        word_count = len(words)
        text_length = len(fused_text)
        
        # Calculate readable word ratio
        readable_words = sum(1 for word in words if self._is_readable_word(word))
        readable_word_ratio = readable_words / word_count if word_count > 0 else 0.0
        
        # Calculate special character ratio
        special_chars = sum(1 for c in fused_text if not c.isalnum() and c not in ' \n\t.,!?-()[]{}')
        special_char_ratio = special_chars / text_length if text_length > 0 else 0.0
        
        # Count OCR errors
        ocr_error_count = self._count_ocr_errors(fused_text)
        
        # Average language consistency from all results
        language_consistencies = [r.quality_metrics.language_consistency for r in results]
        avg_language_consistency = np.mean(language_consistencies) if language_consistencies else 0.0
        
        # Calculate confidence variance
        confidences = [r.confidence for r in results]
        confidence_variance = np.var(confidences) if len(confidences) > 1 else 0.0
        
        return QualityMetrics(
            text_length=text_length,
            word_count=word_count,
            readable_word_ratio=readable_word_ratio,
            special_char_ratio=special_char_ratio,
            ocr_error_count=ocr_error_count,
            language_consistency=avg_language_consistency,
            structured_data_completeness=0.0,  # Will be calculated later
            confidence_variance=confidence_variance
        )
    
    def _create_fused_metadata(self, results: List[OCRResult], best_result: OCRResult) -> OCRMetadata:
        """Create metadata for fused result"""
        # Use best result's metadata as base and add fusion info
        base_metadata = best_result.metadata
        
        fusion_info = {
            'fusion_applied': True,
            'source_providers': [r.provider.value for r in results],
            'source_count': len(results),
            'fusion_strategy': 'multilayer_intelligent_fusion'
        }
        
        base_metadata.additional_info.update(fusion_info)
        
        return base_metadata
    
    def _is_fusion_better(self, fused_result: OCRResult, best_result: OCRResult) -> bool:
        """Determine if fused result is better than the original best result"""
        # Compare confidence
        confidence_improvement = fused_result.confidence - best_result.confidence
        
        # Compare text quality
        fused_quality_score = self._calculate_overall_quality_score(fused_result)
        best_quality_score = self._calculate_overall_quality_score(best_result)
        quality_improvement = fused_quality_score - best_quality_score
        
        # Fusion is better if there's significant improvement in either metric
        return confidence_improvement > 0.05 or quality_improvement > 0.1
    
    def _calculate_overall_quality_score(self, result: OCRResult) -> float:
        """Calculate overall quality score for a result"""
        metrics = result.quality_metrics
        
        score = 0.0
        score += metrics.readable_word_ratio * 0.3
        score += (1.0 - metrics.special_char_ratio) * 0.2
        score += (1.0 - min(1.0, metrics.ocr_error_count / 10)) * 0.2
        score += metrics.language_consistency * 0.1
        score += min(1.0, metrics.text_length / 500) * 0.2  # Length bonus
        
        return score
    
    def _is_readable_word(self, word: str) -> bool:
        """Check if a word appears to be readable"""
        if len(word) < 2:
            return False
        
        if not any(c.isalpha() for c in word):
            return False
        
        ocr_patterns = ['|||', '###', '***', '???', 'lll', 'III', 'OOO']
        if any(pattern in word for pattern in ocr_patterns):
            return False
        
        return True
    
    def _count_ocr_errors(self, text: str) -> int:
        """Count obvious OCR errors in text"""
        error_patterns = ['|||', '###', '***', '???', 'lll', 'III', 'OOO']
        return sum(text.count(pattern) for pattern in error_patterns)
    
    def _has_document_patterns(self, text: str) -> bool:
        """Check if text contains typical document patterns"""
        text_lower = text.lower()
        patterns = [
            'faktura', 'invoice', 'účtenka', 'receipt',
            'datum', 'date', 'částka', 'amount', 'celkem', 'total'
        ]
        return sum(1 for pattern in patterns if pattern in text_lower) >= 2
    
    def get_fusion_status(self) -> Dict[str, Any]:
        """Get status of the fusion engine"""
        return {
            'fusion_weights': self.fusion_weights,
            'similarity_threshold': self.similarity_threshold,
            'confidence_threshold': self.confidence_threshold,
            'config': self.config
        }
