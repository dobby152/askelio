#!/usr/bin/env python3
"""
Document Service for Supabase Integration
Handles all document-related database operations using Supabase
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from services.supabase_client import SupabaseService
from models.supabase_models import Document, DocumentCreate, DocumentUpdate, ExtractedField

logger = logging.getLogger(__name__)

class DocumentService(SupabaseService):
    """Service for document management operations"""
    
    async def create_document(self, user_id: str, document_data: DocumentCreate) -> Dict[str, Any]:
        """Create a new document record"""
        try:
            doc_dict = document_data.dict()
            doc_dict['user_id'] = user_id
            doc_dict['created_at'] = datetime.utcnow().isoformat()
            doc_dict['updated_at'] = datetime.utcnow().isoformat()
            
            return await self.execute_query(
                lambda: self.supabase.table('documents').insert(doc_dict).execute()
            )
        except Exception as e:
            logger.error(f"Error creating document: {e}")
            return self._handle_error(e)
    
    async def get_user_documents(self, user_id: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get documents for a specific user"""
        try:
            query = (self.supabase.table('documents')
                    .select('*')
                    .eq('user_id', user_id)
                    .order('created_at', desc=True)
                    .range(offset, offset + limit - 1))

            result = await self.execute_query(lambda: query.execute())

            # Handle case where documents table doesn't exist
            if not result['success'] and 'does not exist' in str(result.get('error', '')):
                logger.warning("Documents table does not exist, returning empty list")
                return {
                    "success": True,
                    "data": [],
                    "error": None
                }

            return result
        except Exception as e:
            logger.error(f"Error getting user documents: {e}")
            # Return empty list instead of error to prevent phantom documents
            return {
                "success": True,
                "data": [],
                "error": None
            }
    
    async def get_document_by_id(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Get a specific document by ID for a user"""
        try:
            query = (self.supabase.table('documents')
                    .select('*')
                    .eq('id', document_id)
                    .eq('user_id', user_id)
                    .single())

            result = await self.execute_query(lambda: query.execute())

            # Handle case where documents table doesn't exist
            if not result['success'] and 'does not exist' in str(result.get('error', '')):
                logger.warning("Documents table does not exist")
                return {
                    "success": False,
                    "data": None,
                    "error": "Document not found"
                }

            return result
        except Exception as e:
            logger.error(f"Error getting document by ID: {e}")
            return {
                "success": False,
                "data": None,
                "error": "Document not found"
            }
    
    async def update_document(self, document_id: str, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a document"""
        try:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            query = (self.supabase.table('documents')
                    .update(update_data)
                    .eq('id', document_id)
                    .eq('user_id', user_id))
            
            return await self.execute_query(lambda: query.execute())
        except Exception as e:
            logger.error(f"Error updating document: {e}")
            return self._handle_error(e)
    
    async def delete_document(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a document"""
        try:
            query = (self.supabase.table('documents')
                    .delete()
                    .eq('id', document_id)
                    .eq('user_id', user_id))
            
            return await self.execute_query(lambda: query.execute())
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return self._handle_error(e)
    
    async def get_recent_documents(self, user_id: str, limit: int = 5) -> Dict[str, Any]:
        """Get recent documents for dashboard with extracted fields"""
        try:
            # First get documents
            docs_result = await self.execute_query(
                lambda: (self.supabase.table('documents')
                        .select('*')
                        .eq('user_id', user_id)
                        .order('created_at', desc=True)
                        .limit(limit)
                        .execute())
            )

            # Handle case where documents table doesn't exist
            if not docs_result['success']:
                if 'does not exist' in str(docs_result.get('error', '')):
                    logger.warning("Documents table does not exist, returning empty list")
                    return {
                        "success": True,
                        "data": [],
                        "error": None
                    }
                return docs_result

            if not docs_result['data']:
                return {
                    "success": True,
                    "data": [],
                    "error": None
                }

            # Then get extracted fields for each document
            documents = docs_result['data']
            for doc in documents:
                fields_result = await self.get_document_fields(doc['id'], user_id)
                doc['extracted_fields'] = fields_result['data'] if fields_result['success'] else []

            return {
                "success": True,
                "data": documents,
                "error": None
            }
        except Exception as e:
            logger.error(f"Error getting recent documents: {e}")
            # Return empty list instead of error
            return {
                "success": True,
                "data": [],
                "error": None
            }
    
    async def get_document_statistics(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get document statistics for a user"""
        try:
            start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            # Get total documents
            total_query = (self.supabase.table('documents')
                          .select('id', count='exact')
                          .eq('user_id', user_id))
            
            # Get recent documents
            recent_query = (self.supabase.table('documents')
                           .select('id', count='exact')
                           .eq('user_id', user_id)
                           .gte('created_at', start_date))
            
            total_result = await self.execute_query(lambda: total_query.execute())
            recent_result = await self.execute_query(lambda: recent_query.execute())
            
            if total_result['success'] and recent_result['success']:
                return {
                    "success": True,
                    "data": {
                        "total_documents": total_result.get('count', 0),
                        "documents_this_period": recent_result.get('count', 0)
                    },
                    "error": None
                }
            else:
                return self._handle_error("Failed to get document statistics")
                
        except Exception as e:
            logger.error(f"Error getting document statistics: {e}")
            return self._handle_error(e)
    
    async def find_duplicate_documents(self, user_id: str, file_hash: str) -> Dict[str, Any]:
        """Find duplicate documents by file hash"""
        try:
            query = (self.supabase.table('documents')
                    .select('*')
                    .eq('user_id', user_id)
                    .eq('file_hash', file_hash))
            
            return await self.execute_query(lambda: query.execute())
        except Exception as e:
            logger.error(f"Error finding duplicate documents: {e}")
            return self._handle_error(e)
    
    # Extracted Fields methods
    async def create_extracted_field(self, field_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an extracted field"""
        try:
            field_data['created_at'] = datetime.utcnow().isoformat()
            field_data['updated_at'] = datetime.utcnow().isoformat()
            
            return await self.execute_query(
                lambda: self.supabase.table('extracted_fields').insert(field_data).execute()
            )
        except Exception as e:
            logger.error(f"Error creating extracted field: {e}")
            return self._handle_error(e)
    
    async def get_document_fields(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Get extracted fields for a document"""
        try:
            query = (self.supabase.table('extracted_fields')
                    .select('*')
                    .eq('document_id', document_id)
                    .eq('user_id', user_id))
            
            return await self.execute_query(lambda: query.execute())
        except Exception as e:
            logger.error(f"Error getting document fields: {e}")
            return self._handle_error(e)
    
    async def update_extracted_field(self, field_id: str, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an extracted field"""
        try:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            query = (self.supabase.table('extracted_fields')
                    .update(update_data)
                    .eq('id', field_id)
                    .eq('user_id', user_id))
            
            return await self.execute_query(lambda: query.execute())
        except Exception as e:
            logger.error(f"Error updating extracted field: {e}")
            return self._handle_error(e)
    
    async def delete_extracted_field(self, field_id: str, user_id: str) -> Dict[str, Any]:
        """Delete an extracted field"""
        try:
            query = (self.supabase.table('extracted_fields')
                    .delete()
                    .eq('id', field_id)
                    .eq('user_id', user_id))
            
            return await self.execute_query(lambda: query.execute())
        except Exception as e:
            logger.error(f"Error deleting extracted field: {e}")
            return self._handle_error(e)

# Global instance
document_service = DocumentService()
