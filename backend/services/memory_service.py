#!/usr/bin/env python3
"""
Memory Service
Handles user memories, context storage, and retrieval
"""

import logging
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timedelta
from decimal import Decimal

from .supabase_client import SupabaseService
from models.supabase_models import (
    UserMemory, UserMemoryCreate, UserMemoryUpdate,
    MemorySearchResult
)

logger = logging.getLogger(__name__)

class MemoryService(SupabaseService):
    """Service for user memory management operations"""
    
    async def create_memory(
        self, 
        user_id: str, 
        memory_data: UserMemoryCreate
    ) -> Dict[str, Any]:
        """Create a new user memory"""
        try:
            memory_dict = memory_data.dict()
            memory_dict['user_id'] = user_id
            
            return await self.execute_query(
                lambda: self.supabase.table('user_memories')
                .insert(memory_dict)
                .execute()
            )
            
        except Exception as e:
            logger.error(f"Error creating memory: {e}")
            return self._handle_error(e)
    
    async def get_memory(self, user_id: str, memory_id: str) -> Dict[str, Any]:
        """Get a specific memory by ID"""
        try:
            return await self.execute_query(
                lambda: self.supabase.table('user_memories')
                .select('*')
                .eq('id', memory_id)
                .eq('user_id', user_id)
                .single()
                .execute()
            )
            
        except Exception as e:
            logger.error(f"Error getting memory: {e}")
            return self._handle_error(e)
    
    async def update_memory(
        self, 
        user_id: str, 
        memory_id: str, 
        memory_data: UserMemoryUpdate
    ) -> Dict[str, Any]:
        """Update an existing memory"""
        try:
            update_data = memory_data.dict(exclude_unset=True)
            if update_data:
                update_data['updated_at'] = datetime.utcnow().isoformat()
                
                return await self.execute_query(
                    lambda: self.supabase.table('user_memories')
                    .update(update_data)
                    .eq('id', memory_id)
                    .eq('user_id', user_id)
                    .execute()
                )
            else:
                return {"success": True, "data": None, "error": None}
                
        except Exception as e:
            logger.error(f"Error updating memory: {e}")
            return self._handle_error(e)
    
    async def delete_memory(self, user_id: str, memory_id: str) -> Dict[str, Any]:
        """Delete a memory"""
        try:
            return await self.execute_query(
                lambda: self.supabase.table('user_memories')
                .delete()
                .eq('id', memory_id)
                .eq('user_id', user_id)
                .execute()
            )
            
        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return self._handle_error(e)
    
    async def get_user_memories(
        self,
        user_id: str,
        memory_type: Optional[str] = None,
        tags: Optional[List[str]] = None,
        search_query: Optional[str] = None,
        importance_min: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
        order_by: str = 'created_at',
        order_desc: bool = True
    ) -> Dict[str, Any]:
        """Get user memories with filtering and search"""
        try:
            # Use RPC function for complex filtering
            if memory_type or tags or search_query or importance_min:
                rpc_params = {
                    'p_user_id': user_id,
                    'p_memory_type': memory_type,
                    'p_limit': limit,
                    'p_offset': offset
                }
                
                return await self.execute_rpc('get_user_memories', rpc_params)
            
            # Simple query for basic filtering
            query = self.supabase.table('user_memories').select('*').eq('user_id', user_id).eq('is_active', True)
            
            if memory_type:
                query = query.eq('memory_type', memory_type)
            
            if importance_min:
                query = query.gte('importance_score', importance_min)
            
            # Handle expiration
            query = query.or_('expires_at.is.null,expires_at.gt.' + datetime.utcnow().isoformat())
            
            # Ordering
            query = query.order(order_by, desc=order_desc)
            
            # Pagination
            query = query.range(offset, offset + limit - 1)
            
            return await self.execute_query(lambda: query.execute())
            
        except Exception as e:
            logger.error(f"Error getting user memories: {e}")
            return self._handle_error(e)
    
    async def search_memories(
        self,
        user_id: str,
        search_query: str,
        memory_type: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Search memories by content using full-text search"""
        try:
            # Build search query
            query = self.supabase.table('user_memories').select('*').eq('user_id', user_id).eq('is_active', True)
            
            # Text search in memory_content and title
            search_condition = f'memory_content.ilike.%{search_query}%,title.ilike.%{search_query}%'
            query = query.or_(search_condition)
            
            if memory_type:
                query = query.eq('memory_type', memory_type)
            
            # Handle expiration
            query = query.or_('expires_at.is.null,expires_at.gt.' + datetime.utcnow().isoformat())
            
            # Order by relevance (importance_score) and recency
            query = query.order('importance_score', desc=True).order('created_at', desc=True)
            
            query = query.limit(limit)
            
            result = await self.execute_query(lambda: query.execute())
            
            if result['success']:
                search_result = MemorySearchResult(
                    memories=[UserMemory(**memory) for memory in result['data']],
                    total_count=len(result['data']),
                    search_query=search_query,
                    filters_applied={
                        'memory_type': memory_type,
                        'limit': limit
                    }
                )
                
                return {
                    "success": True,
                    "data": search_result.dict(),
                    "error": None
                }
            
            return result
            
        except Exception as e:
            logger.error(f"Error searching memories: {e}")
            return self._handle_error(e)
    
    async def get_memories_by_tags(
        self,
        user_id: str,
        tags: List[str],
        match_all: bool = False,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get memories by tags"""
        try:
            query = self.supabase.table('user_memories').select('*').eq('user_id', user_id).eq('is_active', True)
            
            if match_all:
                # All tags must be present
                for tag in tags:
                    query = query.contains('tags', [tag])
            else:
                # Any tag can match
                query = query.overlaps('tags', tags)
            
            # Handle expiration
            query = query.or_('expires_at.is.null,expires_at.gt.' + datetime.utcnow().isoformat())
            
            query = query.order('importance_score', desc=True).order('created_at', desc=True).limit(limit)
            
            return await self.execute_query(lambda: query.execute())
            
        except Exception as e:
            logger.error(f"Error getting memories by tags: {e}")
            return self._handle_error(e)
    
    async def get_recent_memories(
        self,
        user_id: str,
        days: int = 7,
        memory_type: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get recent memories from specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            query = self.supabase.table('user_memories').select('*').eq('user_id', user_id).eq('is_active', True)
            
            query = query.gte('created_at', start_date.isoformat())
            
            if memory_type:
                query = query.eq('memory_type', memory_type)
            
            query = query.order('created_at', desc=True).limit(limit)
            
            return await self.execute_query(lambda: query.execute())
            
        except Exception as e:
            logger.error(f"Error getting recent memories: {e}")
            return self._handle_error(e)
    
    async def get_memory_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get user memory statistics"""
        try:
            # Get all active memories
            memories_result = await self.execute_query(
                lambda: self.supabase.table('user_memories')
                .select('memory_type,importance_score,tags,created_at')
                .eq('user_id', user_id)
                .eq('is_active', True)
                .execute()
            )
            
            if not memories_result['success']:
                return memories_result
            
            memories = memories_result['data']
            
            # Calculate statistics
            stats = {
                'total_memories': len(memories),
                'memories_by_type': {},
                'memories_by_importance': {},
                'total_tags': set(),
                'memories_this_week': 0,
                'memories_this_month': 0,
                'average_importance': 0
            }
            
            now = datetime.utcnow()
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            importance_scores = []
            
            for memory in memories:
                # Type distribution
                mem_type = memory.get('memory_type', 'unknown')
                stats['memories_by_type'][mem_type] = stats['memories_by_type'].get(mem_type, 0) + 1
                
                # Importance distribution
                importance = memory.get('importance_score', 5)
                importance_scores.append(importance)
                stats['memories_by_importance'][str(importance)] = stats['memories_by_importance'].get(str(importance), 0) + 1
                
                # Tags
                tags = memory.get('tags', [])
                stats['total_tags'].update(tags)
                
                # Time-based counts
                created_at = datetime.fromisoformat(memory.get('created_at', '').replace('Z', '+00:00'))
                if created_at >= week_ago:
                    stats['memories_this_week'] += 1
                if created_at >= month_ago:
                    stats['memories_this_month'] += 1
            
            # Calculate average importance
            if importance_scores:
                stats['average_importance'] = sum(importance_scores) / len(importance_scores)
            
            # Convert set to count
            stats['unique_tags_count'] = len(stats['total_tags'])
            stats['total_tags'] = list(stats['total_tags'])
            
            return {
                "success": True,
                "data": stats,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error getting memory statistics: {e}")
            return self._handle_error(e)
    
    async def cleanup_expired_memories(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Clean up expired memories"""
        try:
            return await self.execute_rpc('cleanup_expired_memories')
            
        except Exception as e:
            logger.error(f"Error cleaning up expired memories: {e}")
            return self._handle_error(e)
    
    async def bulk_update_memories(
        self,
        user_id: str,
        memory_ids: List[str],
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Bulk update multiple memories"""
        try:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            return await self.execute_query(
                lambda: self.supabase.table('user_memories')
                .update(update_data)
                .eq('user_id', user_id)
                .in_('id', memory_ids)
                .execute()
            )
            
        except Exception as e:
            logger.error(f"Error bulk updating memories: {e}")
            return self._handle_error(e)
