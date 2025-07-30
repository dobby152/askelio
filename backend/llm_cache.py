"""
LLM Response Caching System for Speed Optimization
Caches similar document responses to achieve <3s processing
Redis-powered for high performance and scalability
"""

import hashlib
import json
import time
import os
import logging
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path

# Redis imports
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

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
    High-performance Redis-powered caching system for LLM responses
    Reduces processing time from 3-4s to <0.5s for similar documents
    """

    def __init__(self, max_age_hours: int = 24):
        self.max_age_seconds = max_age_hours * 3600
        self.similarity_threshold = 0.85  # 85% similarity for cache hit
        self.redis_client = None
        self._fallback_cache = {}  # In-memory fallback

        self._init_redis()
        logger.info(f"🚀 LLM Cache initialized (max_age: {max_age_hours}h)")

    def _init_redis(self):
        """Initialize Redis connection with fallback to in-memory cache"""
        if not REDIS_AVAILABLE:
            logger.warning("⚠️ Redis not available, using in-memory cache fallback")
            return

        try:
            # Get Redis configuration from environment
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
            redis_password = os.getenv('REDIS_PASSWORD')

            # Parse Redis URL or use individual components
            if redis_url.startswith('redis://'):
                self.redis_client = redis.from_url(
                    redis_url,
                    password=redis_password,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True
                )
            else:
                # Fallback to individual components
                redis_host = os.getenv('REDIS_HOST', 'localhost')
                redis_port = int(os.getenv('REDIS_PORT', '6379'))
                redis_db = int(os.getenv('REDIS_DB', '0'))

                self.redis_client = redis.Redis(
                    host=redis_host,
                    port=redis_port,
                    db=redis_db,
                    password=redis_password,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True
                )

            # Test Redis connection
            self.redis_client.ping()
            logger.info("✅ Redis cache connected successfully")

        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}. Using in-memory cache fallback")
            self.redis_client = None
    
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
        """Get cached response if available from Redis or fallback cache"""
        try:
            text_hash = self._calculate_text_hash(text, document_type, complexity)

            # Try Redis first
            if self.redis_client:
                cached_data = self._get_from_redis(text_hash)
                if cached_data:
                    return cached_data

                # Try similarity search in Redis
                similar_response = self._find_similar_in_redis(text, document_type, complexity)
                if similar_response:
                    return similar_response

            # Fallback to in-memory cache
            if text_hash in self._fallback_cache:
                cached_item = self._fallback_cache[text_hash]
                if time.time() - cached_item.created_at < self.max_age_seconds:
                    logger.info(f"🎯 Memory Cache HIT: {text_hash[:8]}...")
                    return self._format_cached_response(cached_item)
                else:
                    # Remove expired item
                    del self._fallback_cache[text_hash]

            return None

        except Exception as e:
            logger.warning(f"Cache retrieval failed: {e}")
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
        """Cache a successful LLM response in Redis and fallback cache"""
        try:
            text_hash = self._calculate_text_hash(text, document_type, complexity)
            text_preview = self._normalize_text(text)[:200]  # First 200 chars for similarity

            cached_response = CachedResponse(
                text_hash=text_hash,
                response_data=response_data,
                model_used=model_used,
                confidence_score=confidence_score,
                created_at=time.time(),
                access_count=0,
                last_accessed=time.time()
            )

            # Store in Redis if available
            if self.redis_client:
                self._store_in_redis(text_hash, cached_response, text_preview)

            # Always store in fallback cache as well
            self._fallback_cache[text_hash] = cached_response

            logger.info(f"💾 Response cached: {text_hash[:8]}... (model: {model_used})")

        except Exception as e:
            logger.warning(f"Cache storage failed: {e}")
    
    def _update_access_stats(self, text_hash: str):
        """Update access statistics for cached item (disabled)"""
        pass

    def cleanup_old_entries(self):
        """Remove old cache entries from Redis and memory cache"""
        try:
            current_time = time.time()

            # Clean up Redis cache
            if self.redis_client:
                # Get all cache keys
                cache_keys = self.redis_client.keys("llm_cache:*")
                expired_keys = []

                for key in cache_keys:
                    try:
                        ttl = self.redis_client.ttl(key)
                        if ttl == -1:  # No expiration set, check manually
                            cached_data = self.redis_client.hget(key, "created_at")
                            if cached_data and current_time - float(cached_data) > self.max_age_seconds:
                                expired_keys.append(key)
                    except Exception:
                        continue

                if expired_keys:
                    self.redis_client.delete(*expired_keys)
                    logger.info(f"🧹 Cleaned up {len(expired_keys)} expired Redis cache entries")

            # Clean up memory cache
            expired_hashes = [
                text_hash for text_hash, cached_item in self._fallback_cache.items()
                if current_time - cached_item.created_at > self.max_age_seconds
            ]

            for text_hash in expired_hashes:
                del self._fallback_cache[text_hash]

            if expired_hashes:
                logger.info(f"🧹 Cleaned up {len(expired_hashes)} expired memory cache entries")

        except Exception as e:
            logger.warning(f"Cache cleanup failed: {e}")

    def _get_from_redis(self, text_hash: str) -> Optional[Dict[str, Any]]:
        """Get cached response from Redis"""
        try:
            key = f"llm_cache:{text_hash}"
            cached_data = self.redis_client.hgetall(key)

            if not cached_data:
                return None

            # Check if expired
            created_at = float(cached_data.get("created_at", 0))
            if time.time() - created_at > self.max_age_seconds:
                self.redis_client.delete(key)
                return None

            # Update access stats
            self.redis_client.hincrby(key, "access_count", 1)
            self.redis_client.hset(key, "last_accessed", time.time())

            # Parse and return response
            response_data = json.loads(cached_data["response_data"])
            logger.info(f"🎯 Redis Cache HIT: {text_hash[:8]}... - {cached_data['model_used']}")

            return {
                "success": True,
                "extracted_data": response_data,
                "model_used": f"cached:{cached_data['model_used']}",
                "confidence_score": float(cached_data["confidence_score"]),
                "processing_time": 0.1,  # Very fast Redis retrieval
                "cost_usd": 0.0,
                "reasoning": "Retrieved from Redis cache",
                "validation_notes": ["Cached response"],
                "cache_hit": True
            }

        except Exception as e:
            logger.warning(f"Redis cache retrieval failed: {e}")
            return None

    def _store_in_redis(self, text_hash: str, cached_response: CachedResponse, text_preview: str):
        """Store cached response in Redis"""
        try:
            key = f"llm_cache:{text_hash}"
            similarity_key = f"llm_similarity:{text_hash}"

            # Store main cache data
            cache_data = {
                "text_hash": cached_response.text_hash,
                "response_data": json.dumps(cached_response.response_data),
                "model_used": cached_response.model_used,
                "confidence_score": cached_response.confidence_score,
                "created_at": cached_response.created_at,
                "access_count": cached_response.access_count,
                "last_accessed": cached_response.last_accessed
            }

            # Store with expiration
            self.redis_client.hset(key, mapping=cache_data)
            self.redis_client.expire(key, self.max_age_seconds)

            # Store text preview for similarity search
            self.redis_client.hset(similarity_key, mapping={
                "text_preview": text_preview,
                "text_hash": text_hash,
                "created_at": cached_response.created_at
            })
            self.redis_client.expire(similarity_key, self.max_age_seconds)

        except Exception as e:
            logger.warning(f"Redis cache storage failed: {e}")

    def _find_similar_in_redis(self, text: str, document_type: str, complexity: str) -> Optional[Dict[str, Any]]:
        """Find similar cached responses in Redis using text similarity"""
        try:
            normalized_text = self._normalize_text(text)
            similarity_keys = self.redis_client.keys("llm_similarity:*")

            for key in similarity_keys:
                try:
                    similarity_data = self.redis_client.hgetall(key)
                    if not similarity_data:
                        continue

                    cached_text = similarity_data.get("text_preview", "")
                    similarity = self._calculate_similarity(normalized_text, cached_text)

                    if similarity >= self.similarity_threshold:
                        # Get the actual cached response
                        text_hash = similarity_data["text_hash"]
                        cached_response = self._get_from_redis(text_hash)

                        if cached_response:
                            # Adjust confidence by similarity
                            cached_response["confidence_score"] *= similarity
                            cached_response["reasoning"] = f"Retrieved from Redis cache (similarity: {similarity:.1%})"
                            cached_response["validation_notes"] = [f"Cached response - {similarity:.1%} similar"]

                            logger.info(f"🎯 Redis Similarity HIT ({similarity:.1%}): {text_hash[:8]}...")
                            return cached_response

                except Exception:
                    continue

            return None

        except Exception as e:
            logger.warning(f"Redis similarity search failed: {e}")
            return None

    def _format_cached_response(self, cached_item: CachedResponse) -> Dict[str, Any]:
        """Format cached response for return"""
        return {
            "success": True,
            "extracted_data": cached_item.response_data,
            "model_used": f"cached:{cached_item.model_used}",
            "confidence_score": cached_item.confidence_score,
            "processing_time": 0.2,  # Fast memory retrieval
            "cost_usd": 0.0,
            "reasoning": "Retrieved from memory cache",
            "validation_notes": ["Cached response"],
            "cache_hit": True
        }
    
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
