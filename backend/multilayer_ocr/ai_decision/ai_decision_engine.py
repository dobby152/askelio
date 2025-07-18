"""
AI Decision Engine for multilayer OCR system
Intelligent selection of best OCR results using multiple criteria
"""
import logging
import difflib
import re
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
import numpy as np

from ..core.ocr_result import OCRResult, OCRProviderType

logger = logging.getLogger(__name__)


class AIDecisionEngine:
    """
    AI-powered decision engine for selecting best OCR results
    Uses multiple criteria and machine learning approaches
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Provider reliability weights (can be learned from historical data)
        self.provider_weights = self.config.get('provider_weights', {
            OCRProviderType.GOOGLE_VISION: 1.0,
            OCRProviderType.AZURE_COMPUTER_VISION: 0.95,
            OCRProviderType.PADDLE_OCR: 0.85,
            OCRProviderType.TESSERACT: 0.75
        })
        
        # Scoring weights for different criteria
        self.scoring_weights = self.config.get('scoring_weights', {
            'confidence': 0.25,
            'text_quality': 0.20,
            'structured_data_completeness': 0.20,
            'provider_reliability': 0.15,
            'cross_validation': 0.15,
            'language_consistency': 0.05
        })
        
        # Historical performance tracking
        self.provider_performance = {}
    
    async def select_best_result(self, results: List[OCRResult]) -> Tuple[OCRResult, Dict[str, Any]]:
        """
        Select the best OCR result using AI decision making
        
        Args:
            results: List of OCR results from different providers
            
        Returns:
            Tuple of (best_result, decision_metadata)
        """
        if not results:
            raise ValueError("No OCR results provided")
        
        if len(results) == 1:
            return results[0], {
                'method': 'single_result',
                'selected_provider': results[0].provider.value,
                'confidence': results[0].confidence
            }
        
        logger.info(f"AI Decision Engine analyzing {len(results)} OCR results")
        
        # Calculate comprehensive scores for each result
        scored_results = []
        for result in results:
            score = self._calculate_comprehensive_score(result, results)
            scored_results.append((result, score))
        
        # Sort by score (highest first)
        scored_results.sort(key=lambda x: x[1]['total_score'], reverse=True)
        
        best_result = scored_results[0][0]
        best_score = scored_results[0][1]
        
        # Create decision metadata
        decision_metadata = {
            'method': 'ai_comprehensive_scoring',
            'selected_provider': best_result.provider.value,
            'confidence': best_result.confidence,
            'ai_score': best_score['total_score'],
            'score_breakdown': best_score,
            'all_scores': [
                {
                    'provider': result.provider.value,
                    'score': score['total_score'],
                    'breakdown': score
                }
                for result, score in scored_results
            ],
            'cross_validation_results': self._perform_cross_validation(results),
            'consensus_analysis': self._analyze_consensus(results)
        }
        
        logger.info(f"AI selected {best_result.provider.value} with score {best_score['total_score']:.3f}")
        
        return best_result, decision_metadata
    
    def _calculate_comprehensive_score(self, result: OCRResult, all_results: List[OCRResult]) -> Dict[str, float]:
        """Calculate comprehensive score for a single result"""
        scores = {}
        
        # 1. Base confidence score
        scores['confidence'] = result.confidence
        
        # 2. Text quality score
        scores['text_quality'] = self._calculate_text_quality_score(result)
        
        # 3. Structured data completeness score
        scores['structured_data_completeness'] = self._calculate_structured_data_score(result)
        
        # 4. Provider reliability score
        scores['provider_reliability'] = self.provider_weights.get(result.provider, 0.5)
        
        # 5. Cross-validation score (how well it agrees with other results)
        scores['cross_validation'] = self._calculate_cross_validation_score(result, all_results)
        
        # 6. Language consistency score
        scores['language_consistency'] = result.quality_metrics.language_consistency
        
        # Calculate weighted total score
        total_score = sum(
            scores[criterion] * self.scoring_weights[criterion]
            for criterion in self.scoring_weights
        )
        
        scores['total_score'] = total_score
        return scores
    
    def _calculate_text_quality_score(self, result: OCRResult) -> float:
        """Calculate text quality score based on various metrics"""
        if not result.text:
            return 0.0
        
        quality_score = 0.0
        
        # Length bonus (longer text usually indicates better extraction)
        text_length = len(result.text)
        if text_length > 100:
            quality_score += 0.3
        elif text_length > 50:
            quality_score += 0.2
        elif text_length > 20:
            quality_score += 0.1
        
        # Readable word ratio
        quality_score += result.quality_metrics.readable_word_ratio * 0.3
        
        # Penalize high special character ratio
        special_char_penalty = min(0.2, result.quality_metrics.special_char_ratio * 0.5)
        quality_score -= special_char_penalty
        
        # Penalize OCR errors
        ocr_error_penalty = min(0.2, result.quality_metrics.ocr_error_count * 0.05)
        quality_score -= ocr_error_penalty
        
        # Language pattern bonus
        if self._has_document_patterns(result.text):
            quality_score += 0.2
        
        return max(0.0, min(1.0, quality_score))
    
    def _calculate_structured_data_score(self, result: OCRResult) -> float:
        """Calculate score based on structured data completeness"""
        structured_data = result.structured_data
        score = 0.0
        
        # Weight different fields by importance
        field_weights = {
            'document_type': 0.1,
            'vendor': 0.25,
            'amount': 0.3,
            'currency': 0.1,
            'date': 0.2,
            'invoice_number': 0.15
        }
        
        for field, weight in field_weights.items():
            value = getattr(structured_data, field, None)
            if value is not None and str(value).strip():
                # Additional validation for specific fields
                if field == 'amount' and isinstance(value, (int, float)) and value > 0:
                    score += weight
                elif field == 'date' and self._is_valid_date_format(str(value)):
                    score += weight
                elif field == 'currency' and str(value).upper() in ['CZK', 'EUR', 'USD', 'KČ']:
                    score += weight
                elif field in ['vendor', 'invoice_number'] and len(str(value)) >= 3:
                    score += weight
                elif field == 'document_type' and str(value) in ['faktura', 'uctenka', 'smlouva']:
                    score += weight
        
        return score
    
    def _calculate_cross_validation_score(self, result: OCRResult, all_results: List[OCRResult]) -> float:
        """Calculate how well this result agrees with others"""
        if len(all_results) <= 1:
            return 0.5  # Neutral score if no other results to compare
        
        other_results = [r for r in all_results if r != result]
        
        # Text similarity scores
        text_similarities = []
        for other in other_results:
            similarity = self._calculate_text_similarity(result.text, other.text)
            text_similarities.append(similarity)
        
        # Structured data agreement scores
        structured_agreements = []
        for other in other_results:
            agreement = self._calculate_structured_data_agreement(
                result.structured_data, other.structured_data
            )
            structured_agreements.append(agreement)
        
        # Combine scores
        avg_text_similarity = np.mean(text_similarities) if text_similarities else 0.0
        avg_structured_agreement = np.mean(structured_agreements) if structured_agreements else 0.0
        
        # Weight text similarity more heavily
        cross_validation_score = (avg_text_similarity * 0.7) + (avg_structured_agreement * 0.3)
        
        return cross_validation_score
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts"""
        if not text1 or not text2:
            return 0.0
        
        # Use difflib for sequence matching
        similarity = difflib.SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
        
        # Also check word-level similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 and not words2:
            return 1.0
        if not words1 or not words2:
            return 0.0
        
        word_similarity = len(words1.intersection(words2)) / len(words1.union(words2))
        
        # Combine character and word similarity
        combined_similarity = (similarity * 0.6) + (word_similarity * 0.4)
        
        return combined_similarity
    
    def _calculate_structured_data_agreement(self, data1, data2) -> float:
        """Calculate agreement between structured data"""
        agreement_score = 0.0
        total_fields = 0
        
        fields_to_compare = ['document_type', 'vendor', 'amount', 'currency', 'date', 'invoice_number']
        
        for field in fields_to_compare:
            value1 = getattr(data1, field, None)
            value2 = getattr(data2, field, None)
            
            total_fields += 1
            
            if value1 is None and value2 is None:
                agreement_score += 0.5  # Neutral for both missing
            elif value1 is None or value2 is None:
                agreement_score += 0.0  # Penalty for one missing
            elif field == 'amount':
                # Special handling for amounts (allow small differences)
                if isinstance(value1, (int, float)) and isinstance(value2, (int, float)):
                    diff_ratio = abs(value1 - value2) / max(value1, value2) if max(value1, value2) > 0 else 0
                    if diff_ratio < 0.05:  # Less than 5% difference
                        agreement_score += 1.0
                    elif diff_ratio < 0.1:  # Less than 10% difference
                        agreement_score += 0.7
                    else:
                        agreement_score += 0.0
            else:
                # String comparison
                if str(value1).lower().strip() == str(value2).lower().strip():
                    agreement_score += 1.0
                else:
                    # Partial credit for similar strings
                    similarity = difflib.SequenceMatcher(None, str(value1).lower(), str(value2).lower()).ratio()
                    if similarity > 0.8:
                        agreement_score += similarity
        
        return agreement_score / total_fields if total_fields > 0 else 0.0
    
    def _perform_cross_validation(self, results: List[OCRResult]) -> Dict[str, Any]:
        """Perform cross-validation analysis across all results"""
        if len(results) <= 1:
            return {'status': 'insufficient_results'}
        
        # Text similarity matrix
        similarity_matrix = []
        for i, result1 in enumerate(results):
            row = []
            for j, result2 in enumerate(results):
                if i == j:
                    row.append(1.0)
                else:
                    similarity = self._calculate_text_similarity(result1.text, result2.text)
                    row.append(similarity)
            similarity_matrix.append(row)
        
        # Find consensus elements
        consensus_words = self._find_consensus_words(results)
        
        # Identify outliers
        outliers = self._identify_outliers(results, similarity_matrix)
        
        return {
            'status': 'completed',
            'similarity_matrix': similarity_matrix,
            'consensus_words': consensus_words,
            'outliers': outliers,
            'avg_similarity': np.mean([sim for row in similarity_matrix for sim in row if sim != 1.0])
        }
    
    def _find_consensus_words(self, results: List[OCRResult]) -> List[str]:
        """Find words that appear in multiple results"""
        all_words = []
        for result in results:
            words = result.text.lower().split()
            all_words.extend(words)
        
        word_counts = Counter(all_words)
        threshold = max(2, len(results) // 2)  # At least half of results or minimum 2
        
        consensus_words = [word for word, count in word_counts.items() if count >= threshold]
        return consensus_words[:20]  # Return top 20 consensus words
    
    def _identify_outliers(self, results: List[OCRResult], similarity_matrix: List[List[float]]) -> List[str]:
        """Identify results that are significantly different from others"""
        outliers = []
        
        for i, result in enumerate(results):
            avg_similarity = np.mean([similarity_matrix[i][j] for j in range(len(results)) if i != j])
            
            if avg_similarity < 0.3:  # Very low similarity with others
                outliers.append(result.provider.value)
        
        return outliers
    
    def _analyze_consensus(self, results: List[OCRResult]) -> Dict[str, Any]:
        """Analyze consensus across results"""
        if len(results) <= 1:
            return {'status': 'insufficient_results'}
        
        # Analyze structured data consensus
        structured_consensus = {}
        fields = ['document_type', 'vendor', 'amount', 'currency', 'date', 'invoice_number']
        
        for field in fields:
            values = []
            for result in results:
                value = getattr(result.structured_data, field, None)
                if value is not None:
                    values.append(str(value))
            
            if values:
                value_counts = Counter(values)
                most_common = value_counts.most_common(1)[0]
                consensus_ratio = most_common[1] / len(values)
                
                structured_consensus[field] = {
                    'value': most_common[0],
                    'consensus_ratio': consensus_ratio,
                    'total_votes': len(values)
                }
        
        return {
            'status': 'completed',
            'structured_consensus': structured_consensus,
            'total_results': len(results)
        }
    
    def _has_document_patterns(self, text: str) -> bool:
        """Check if text contains typical document patterns"""
        text_lower = text.lower()
        
        patterns = [
            'faktura', 'invoice', 'účtenka', 'receipt',
            'datum', 'date', 'částka', 'amount', 'celkem', 'total',
            'dodavatel', 'vendor', 'kč', 'czk', 'eur', 'usd'
        ]
        
        found_patterns = sum(1 for pattern in patterns if pattern in text_lower)
        return found_patterns >= 3
    
    def _is_valid_date_format(self, date_str: str) -> bool:
        """Check if string is in valid date format"""
        date_patterns = [
            r'^\d{4}-\d{2}-\d{2}$',  # YYYY-MM-DD
            r'^\d{1,2}\.\d{1,2}\.\d{4}$',  # DD.MM.YYYY
            r'^\d{1,2}/\d{1,2}/\d{4}$',  # DD/MM/YYYY
        ]
        
        return any(re.match(pattern, date_str.strip()) for pattern in date_patterns)
    
    def update_provider_performance(self, provider: OCRProviderType, performance_score: float):
        """Update historical performance data for a provider"""
        if provider not in self.provider_performance:
            self.provider_performance[provider] = []
        
        self.provider_performance[provider].append(performance_score)
        
        # Keep only last 100 scores
        if len(self.provider_performance[provider]) > 100:
            self.provider_performance[provider] = self.provider_performance[provider][-100:]
        
        # Update provider weight based on recent performance
        recent_scores = self.provider_performance[provider][-10:]  # Last 10 scores
        if len(recent_scores) >= 5:
            avg_recent_performance = np.mean(recent_scores)
            # Adjust weight slightly based on performance
            current_weight = self.provider_weights.get(provider, 0.5)
            adjustment = (avg_recent_performance - 0.5) * 0.1  # Small adjustment
            new_weight = max(0.1, min(1.0, current_weight + adjustment))
            self.provider_weights[provider] = new_weight
            
            logger.info(f"Updated {provider.value} weight to {new_weight:.3f} based on recent performance")
    
    def get_engine_status(self) -> Dict[str, Any]:
        """Get status and configuration of the AI decision engine"""
        return {
            'provider_weights': {k.value: v for k, v in self.provider_weights.items()},
            'scoring_weights': self.scoring_weights,
            'provider_performance_history': {
                k.value: len(v) for k, v in self.provider_performance.items()
            },
            'config': self.config
        }
