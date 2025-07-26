"""
LLM Response Caching System for Speed Optimization
Caches similar document responses to achieve <3s processing
"""

import hashlib
import json
import time
# import sqlite3  # Disabled for Supabase migration
import logging
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class CachedResponse:
    """Cached LLM response"""
    text_hash: str
    response_data: Dict[str, Any]
    model_used: str
    confidence_score: float
    created_at: float
    access_count: int = 0
    last_accessed: float = 0.0

class LLMCache:
    """
    High-performance caching system for LLM responses
    Reduces processing time from 3-4s to <0.5s for similar documents
    """
    
    def __init__(self, db_path: str = "llm_cache.db", max_age_hours: int = 24):
        self.db_path = db_path
        self.max_age_seconds = max_age_hours * 3600
        self.similarity_threshold = 0.85  # 85% similarity for cache hit
        
        self._init_database()
        logger.info(f"🚀 LLM Cache initialized (max_age: {max_age_hours}h)")
    
    def _init_database(self):
        """Initialize in-memory cache (SQLite disabled for Supabase migration)"""
        self._cache = {}
        logger.info("Cache initialized in memory mode")
    
    def _calculate_text_hash(self, text: str, document_type: str = "", complexity: str = "") -> str:
        """Calculate hash for text with normalization"""
        # Normalize text for better cache hits
        normalized = self._normalize_text(text)
        
        # Include document type and complexity in hash
        cache_key = f"{normalized}|{document_type}|{complexity}"
        
        return hashlib.sha256(cache_key.encode('utf-8')).hexdigest()
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for better cache matching"""
        import re
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Normalize common variations
        text = text.lower()
        
        # Remove dates and numbers that might vary
        text = re.sub(r'\d{1,2}[./]\d{1,2}[./]\d{2,4}', '[DATE]', text)  # Dates
        text = re.sub(r'\d+[.,]\d+', '[AMOUNT]', text)  # Amounts
        text = re.sub(r'č\.\s*\d+', 'č. [NUMBER]', text)  # Invoice numbers
        text = re.sub(r'#\s*\d+', '# [NUMBER]', text)  # Reference numbers
        
        return text
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity using simple token overlap"""
        tokens1 = set(text1.lower().split())
        tokens2 = set(text2.lower().split())
        
        if not tokens1 or not tokens2:
            return 0.0
        
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def get_cached_response(self, text: str, document_type: str = "",
                          complexity: str = "") -> Optional[Dict[str, Any]]:
        """Get cached response if available (disabled for Supabase migration)"""
        # Cache disabled for now - always return None to force fresh processing
        return None
    
    def _find_similar_cached_response(self, text: str, document_type: str) -> Optional[Dict[str, Any]]:
        """Find similar cached responses using text similarity"""
        try:
            normalized_text = self._normalize_text(text)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT text_hash, text_preview, response_data, model_used, 
                           confidence_score, created_at
                    FROM llm_cache 
                    WHERE document_type = ? AND created_at > ?
                    ORDER BY access_count DESC, created_at DESC
                    LIMIT 20
                """, (document_type, time.time() - self.max_age_seconds))
                
                for row in cursor.fetchall():
                    cached_text = row[1] or ""
                    similarity = self._calculate_similarity(normalized_text, cached_text)
                    
                    if similarity >= self.similarity_threshold:
                        # Similar match found
                        self._update_access_stats(row[0])
                        
                        response_data = json.loads(row[2])
                        logger.info(f"🎯 Cache HIT (similar {similarity:.1%}): {row[0][:8]}... - {row[3]}")
                        
                        return {
                            "success": True,
                            "extracted_data": response_data,
                            "model_used": f"cached:{row[3]}",
                            "confidence_score": row[4] * similarity,  # Adjust confidence by similarity
                            "processing_time": 0.2,  # Still very fast
                            "cost_usd": 0.0,
                            "reasoning": f"Retrieved from cache (similarity: {similarity:.1%})",
                            "validation_notes": [f"Cached response - {similarity:.1%} similar"],
                            "cache_hit": True
                        }
                
        except Exception as e:
            logger.warning(f"Similarity search failed: {e}")
        
        return None
    
    def cache_response(self, text: str, response_data: Dict[str, Any], 
                      model_used: str, confidence_score: float,
                      document_type: str = "", complexity: str = "", language: str = ""):
        """Cache a successful LLM response"""
        text_hash = self._calculate_text_hash(text, document_type, complexity)
        text_preview = self._normalize_text(text)[:200]  # First 200 chars for similarity
        
        # Cache disabled for Supabase migration
        pass
    
    def _update_access_stats(self, text_hash: str):
        """Update access statistics for cached item (disabled)"""
        pass

    def cleanup_old_entries(self):
        """Remove old cache entries (disabled)"""
        pass
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics (disabled)"""
        return {
            "total_entries": 0,
            "used_entries": 0,
            "total_hits": 0,
            "avg_access_count": 0,
            "hit_rate_percent": 0,
            "estimated_time_saved": 0
        }

# Global cache instance
llm_cache = LLMCache()
