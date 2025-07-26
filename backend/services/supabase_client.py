#!/usr/bin/env python3
"""
Supabase Client Configuration
Centralized Supabase client for backend services
"""

import os
import logging
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from gotrue.errors import AuthError
from postgrest.exceptions import APIError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class SupabaseClient:
    """Centralized Supabase client with error handling and logging"""
    
    def __init__(self):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')  # Use service key for backend

        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")
        
        self.client: Client = create_client(self.url, self.key)
        logger.info("Supabase client initialized successfully")
    
    def get_client(self) -> Client:
        """Get the Supabase client instance"""
        return self.client
    
    async def health_check(self) -> bool:
        """Check if Supabase connection is healthy"""
        try:
            # Simple query to test connection
            result = self.client.table('users').select('id').limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase health check failed: {e}")
            return False
    
    def handle_auth_error(self, error: AuthError) -> Dict[str, Any]:
        """Handle authentication errors consistently"""
        logger.error(f"Auth error: {error}")
        return {
            "error": "authentication_failed",
            "message": str(error),
            "status_code": 401
        }
    
    def handle_api_error(self, error: APIError) -> Dict[str, Any]:
        """Handle API errors consistently"""
        logger.error(f"API error: {error}")
        return {
            "error": "api_error",
            "message": str(error),
            "status_code": 400
        }
    
    def handle_generic_error(self, error: Exception) -> Dict[str, Any]:
        """Handle generic errors consistently"""
        logger.error(f"Generic error: {error}")
        return {
            "error": "internal_error",
            "message": "An internal error occurred",
            "status_code": 500
        }

# Global Supabase client instance
_supabase_client: Optional[SupabaseClient] = None

def get_supabase_client() -> SupabaseClient:
    """Get or create the global Supabase client instance"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client

def get_supabase() -> Client:
    """Get the Supabase client for direct use"""
    return get_supabase_client().get_client()

# Dependency for FastAPI
async def get_supabase_dependency() -> Client:
    """FastAPI dependency for Supabase client"""
    return get_supabase()

class SupabaseService:
    """Base service class with common Supabase operations"""
    
    def __init__(self):
        self.supabase = get_supabase()
        self.client_wrapper = get_supabase_client()
    
    def _handle_error(self, error: Exception) -> Dict[str, Any]:
        """Handle errors based on type"""
        if isinstance(error, AuthError):
            return self.client_wrapper.handle_auth_error(error)
        elif isinstance(error, APIError):
            return self.client_wrapper.handle_api_error(error)
        else:
            return self.client_wrapper.handle_generic_error(error)
    
    def _extract_data(self, response) -> Any:
        """Extract data from Supabase response"""
        if hasattr(response, 'data'):
            return response.data
        return response
    
    def _check_response_error(self, response) -> None:
        """Check if response contains an error"""
        if hasattr(response, 'error') and response.error:
            raise APIError(response.error)
    
    async def execute_query(self, query_func, *args, **kwargs) -> Dict[str, Any]:
        """Execute a Supabase query with error handling"""
        try:
            result = query_func(*args, **kwargs)
            self._check_response_error(result)
            return {
                "success": True,
                "data": self._extract_data(result),
                "error": None
            }
        except Exception as e:
            error_info = self._handle_error(e)
            return {
                "success": False,
                "data": None,
                "error": error_info
            }
    
    async def execute_rpc(self, function_name: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute a Supabase RPC function with error handling"""
        try:
            if params:
                result = self.supabase.rpc(function_name, params).execute()
            else:
                result = self.supabase.rpc(function_name).execute()
            
            self._check_response_error(result)
            return {
                "success": True,
                "data": self._extract_data(result),
                "error": None
            }
        except Exception as e:
            error_info = self._handle_error(e)
            return {
                "success": False,
                "data": None,
                "error": error_info
            }
    
    async def get_user_by_id(self, user_id: str) -> Dict[str, Any]:
        """Get user by ID with error handling"""
        return await self.execute_query(
            lambda: self.supabase.table('users').select('*').eq('id', user_id).single().execute()
        )
    
    async def verify_user_access(self, user_id: str, resource_user_id: str) -> bool:
        """Verify that user has access to resource"""
        return user_id == resource_user_id
    
    def get_user_filter(self, user_id: str):
        """Get user filter for queries"""
        return {'user_id': user_id}

# Export commonly used functions
__all__ = [
    'SupabaseClient',
    'SupabaseService', 
    'get_supabase_client',
    'get_supabase',
    'get_supabase_dependency'
]
