"""
LLM Response Caching System for Speed Optimization
Caches similar document responses to achieve <3s processing
"""

import hashlib
import json
import time
import sqlite3
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
        """Initialize SQLite database for caching"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS llm_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    text_hash TEXT UNIQUE NOT NULL,
                    text_preview TEXT,
                    response_data TEXT NOT NULL,
                    model_used TEXT NOT NULL,
                    confidence_score REAL,
                    created_at REAL NOT NULL,
                    access_count INTEGER DEFAULT 0,
                    last_accessed REAL DEFAULT 0,
                    document_type TEXT,
                    language TEXT
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_text_hash ON llm_cache(text_hash)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_created_at ON llm_cache(created_at)
            """)
    
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
        """Get cached response if available"""
        text_hash = self._calculate_text_hash(text, document_type, complexity)
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT text_preview, response_data, model_used, confidence_score, 
                           created_at, access_count
                    FROM llm_cache 
                    WHERE text_hash = ? AND created_at > ?
                """, (text_hash, time.time() - self.max_age_seconds))
                
                row = cursor.fetchone()
                if row:
                    # Exact hash match
                    self._update_access_stats(text_hash)
                    
                    response_data = json.loads(row[1])
                    logger.info(f"🎯 Cache HIT (exact): {text_hash[:8]}... - {row[2]}")
                    
                    return {
                        "success": True,
                        "extracted_data": response_data,
                        "model_used": f"cached:{row[2]}",
                        "confidence_score": row[3],
                        "processing_time": 0.1,  # Very fast cache response
                        "cost_usd": 0.0,
                        "reasoning": "Retrieved from cache (exact match)",
                        "validation_notes": ["Cached response - very fast"],
                        "cache_hit": True
                    }
                
                # Try similarity matching for near-duplicates
                return self._find_similar_cached_response(text, document_type)
                
        except Exception as e:
            logger.warning(f"Cache lookup failed: {e}")
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
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO llm_cache 
                    (text_hash, text_preview, response_data, model_used, confidence_score,
                     created_at, access_count, last_accessed, document_type, language)
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
                """, (
                    text_hash, text_preview, json.dumps(response_data), 
                    model_used, confidence_score, time.time(), time.time(),
                    document_type, language
                ))
                
            logger.info(f"💾 Cached response: {text_hash[:8]}... - {model_used}")
            
        except Exception as e:
            logger.warning(f"Failed to cache response: {e}")
    
    def _update_access_stats(self, text_hash: str):
        """Update access statistics for cached item"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    UPDATE llm_cache 
                    SET access_count = access_count + 1, last_accessed = ?
                    WHERE text_hash = ?
                """, (time.time(), text_hash))
        except Exception as e:
            logger.warning(f"Failed to update access stats: {e}")
    
    def cleanup_old_entries(self):
        """Remove old cache entries"""
        try:
            cutoff_time = time.time() - self.max_age_seconds
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("DELETE FROM llm_cache WHERE created_at < ?", (cutoff_time,))
                deleted_count = cursor.rowcount
                
            if deleted_count > 0:
                logger.info(f"🧹 Cleaned up {deleted_count} old cache entries")
                
        except Exception as e:
            logger.warning(f"Cache cleanup failed: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT COUNT(*) as total_entries,
                           AVG(access_count) as avg_access_count,
                           SUM(access_count) as total_hits,
                           COUNT(CASE WHEN access_count > 0 THEN 1 END) as used_entries
                    FROM llm_cache
                """)
                
                row = cursor.fetchone()
                if row:
                    total_entries = row[0]
                    avg_access = row[1] or 0
                    total_hits = row[2] or 0
                    used_entries = row[3] or 0
                    
                    hit_rate = (used_entries / total_entries * 100) if total_entries > 0 else 0
                    
                    return {
                        "total_entries": total_entries,
                        "used_entries": used_entries,
                        "total_hits": total_hits,
                        "avg_access_count": round(avg_access, 2),
                        "hit_rate_percent": round(hit_rate, 1),
                        "estimated_time_saved": total_hits * 3.0  # Assume 3s saved per hit
                    }
                    
        except Exception as e:
            logger.warning(f"Failed to get cache stats: {e}")
        
        return {"error": "Failed to get stats"}

# Global cache instance
llm_cache = LLMCache()
