#!/usr/bin/env python3
"""
Authentication Middleware
FastAPI middleware for Supabase JWT token verification and session management
"""

import logging
import os
from typing import Optional, Dict, Any, Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import jwt
from datetime import datetime, timezone
import httpx

from services.supabase_client import get_supabase
from services.user_service import UserService

logger = logging.getLogger(__name__)

class SupabaseAuthMiddleware(BaseHTTPMiddleware):
    """Middleware for Supabase JWT token verification"""
    
    def __init__(self, app, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/health",
            "/docs",
            "/openapi.json",
            "/auth/login",
            "/auth/register",
            "/auth/refresh",
            "/auth/reset-password",
            "/dashboard/ai-insights-demo",
            "/dashboard/ai-chat-demo"
        ]
        # Add exact match for root path to avoid matching all paths
        self.exact_exclude_paths = ["/"]
        self.supabase = get_supabase()
        self.user_service = UserService()
        
        # Get Supabase JWT secret from environment
        self.jwt_secret = os.getenv('SUPABASE_JWT_SECRET')
        if not self.jwt_secret:
            logger.warning("SUPABASE_JWT_SECRET not set, JWT verification will be limited")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and verify authentication"""

        logger.info(f"🔐 Middleware: Processing request for {request.url.path}")

        # Skip authentication for CORS preflight requests
        if request.method == "OPTIONS":
            logger.info(f"🔐 Middleware: Skipping auth for OPTIONS request: {request.url.path}")
            return await call_next(request)

        # Skip authentication for excluded paths
        if self._should_skip_auth(request.url.path):
            logger.info(f"🔐 Middleware: Skipping auth for excluded path: {request.url.path}")
            return await call_next(request)

        # Extract and verify JWT token
        logger.info(f"🔐 Middleware: Verifying token for {request.url.path}")
        auth_result = await self._verify_token(request)
        logger.info(f"🔐 Middleware: Token verification result for {request.url.path}: {auth_result['success']}")

        if not auth_result['success']:
            logger.warning(f"🔐 Middleware: Token verification failed for {request.url.path}: {auth_result['message']}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "error": "authentication_required",
                    "message": auth_result['message'],
                    "details": auth_result.get('details')
                }
            )
        
        # Add user info to request state
        request.state.user = auth_result['user']
        request.state.token_payload = auth_result['token_payload']
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        return response
    
    def _should_skip_auth(self, path: str) -> bool:
        """Check if path should skip authentication"""
        # Check exact matches first (like root path "/")
        if path in self.exact_exclude_paths:
            return True

        # Check prefix matches for other paths
        return any(path.startswith(excluded) for excluded in self.exclude_paths)
    
    async def _verify_token(self, request: Request) -> Dict[str, Any]:
        """Verify JWT token from request"""
        
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return {
                "success": False,
                "message": "Authorization header missing",
                "details": "Please provide a valid JWT token in the Authorization header"
            }
        
        if not auth_header.startswith('Bearer '):
            return {
                "success": False,
                "message": "Invalid authorization format",
                "details": "Authorization header must start with 'Bearer '"
            }
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        
        try:
            # Verify token with Supabase
            auth_response = self.supabase.auth.get_user(token)
            
            if auth_response.user is None:
                return {
                    "success": False,
                    "message": "Invalid or expired token",
                    "details": "Token verification failed"
                }
            
            # Get user profile from database
            user_result = await self.user_service.get_user_profile(auth_response.user.id)
            
            if not user_result['success']:
                return {
                    "success": False,
                    "message": "User profile not found",
                    "details": "User exists in auth but profile is missing"
                }
            
            return {
                "success": True,
                "user": user_result['data'],
                "token_payload": {
                    "sub": auth_response.user.id,
                    "email": auth_response.user.email,
                    "aud": "authenticated",
                    "role": "authenticated"
                }
            }
            
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return {
                "success": False,
                "message": "Token verification failed",
                "details": str(e)
            }

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware based on user subscription tier"""
    
    def __init__(self, app):
        super().__init__(app)
        self.rate_limits = {
            'free': {'requests_per_hour': 100, 'burst': 10},
            'basic': {'requests_per_hour': 1000, 'burst': 50},
            'premium': {'requests_per_hour': 10000, 'burst': 100}
        }
        # In production, use Redis for distributed rate limiting
        self.request_counts = {}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply rate limiting based on user tier"""
        
        # Skip rate limiting for health checks and auth endpoints
        if self._should_skip_rate_limit(request.url.path):
            return await call_next(request)
        
        # Get user from request state (set by auth middleware)
        user = getattr(request.state, 'user', None)
        if not user:
            # Apply default rate limit for unauthenticated requests
            user_id = request.client.host
            tier = 'free'
        else:
            user_id = user['id']
            tier = user.get('subscription_tier', 'free')
        
        # Check rate limit
        if await self._is_rate_limited(user_id, tier):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Too many requests",
                    "details": f"Rate limit for {tier} tier exceeded"
                }
            )
        
        # Record request
        await self._record_request(user_id)
        
        return await call_next(request)
    
    def _should_skip_rate_limit(self, path: str) -> bool:
        """Check if path should skip rate limiting"""
        skip_paths = ["/health", "/docs", "/openapi.json"]
        return any(path.startswith(skip) for skip in skip_paths)
    
    async def _is_rate_limited(self, user_id: str, tier: str) -> bool:
        """Check if user has exceeded rate limit"""
        # Simplified in-memory rate limiting
        # In production, use Redis with sliding window
        current_time = datetime.now(timezone.utc)
        hour_key = f"{user_id}:{current_time.hour}"
        
        limits = self.rate_limits.get(tier, self.rate_limits['free'])
        current_count = self.request_counts.get(hour_key, 0)
        
        return current_count >= limits['requests_per_hour']
    
    async def _record_request(self, user_id: str):
        """Record a request for rate limiting"""
        current_time = datetime.now(timezone.utc)
        hour_key = f"{user_id}:{current_time.hour}"
        
        self.request_counts[hour_key] = self.request_counts.get(hour_key, 0) + 1
        
        # Clean up old entries (keep only current and previous hour)
        keys_to_remove = [
            key for key in self.request_counts.keys()
            if not key.endswith(str(current_time.hour)) and 
               not key.endswith(str((current_time.hour - 1) % 24))
        ]
        for key in keys_to_remove:
            del self.request_counts[key]

# FastAPI dependency for getting current user
async def get_current_user(request: Request) -> Dict[str, Any]:
    """FastAPI dependency to get current authenticated user"""
    user = getattr(request.state, 'user', None)
    logger.info(f"🔐 get_current_user called for {request.url.path}, user: {user is not None}")
    if not user:
        logger.warning(f"🔐 Authentication required for {request.url.path}, no user in request.state")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user

async def get_current_user_id(request: Request) -> str:
    """FastAPI dependency to get current user ID"""
    user = await get_current_user(request)
    return user['id']

async def get_optional_user(request: Request) -> Optional[Dict[str, Any]]:
    """FastAPI dependency to get current user (optional)"""
    return getattr(request.state, 'user', None)

# Security scheme for OpenAPI documentation
security_scheme = HTTPBearer(
    scheme_name="JWT",
    description="Enter your JWT token (without 'Bearer ' prefix)"
)

async def verify_api_key(credentials: HTTPAuthorizationCredentials = security_scheme) -> str:
    """Verify API key for OpenAPI documentation"""
    return credentials.credentials

class CreditCheckMiddleware(BaseHTTPMiddleware):
    """Middleware to check user credits for processing operations"""
    
    def __init__(self, app):
        super().__init__(app)
        self.credit_required_paths = [
            "/api/v1/documents/process",
            "/api/v1/documents/analyze",
            "/api/v1/ai/chat"
        ]
        self.user_service = UserService()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Check credits for processing operations"""
        
        # Only check credits for specific endpoints
        if not any(request.url.path.startswith(path) for path in self.credit_required_paths):
            return await call_next(request)
        
        # Get user from request state
        user = getattr(request.state, 'user', None)
        if not user:
            return await call_next(request)  # Auth middleware will handle this
        
        # Check if user has sufficient credits
        current_balance = float(user.get('credit_balance', 0))
        if current_balance <= 0:
            return JSONResponse(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                content={
                    "error": "insufficient_credits",
                    "message": "Insufficient credits for this operation",
                    "details": {
                        "current_balance": current_balance,
                        "required_minimum": 0.01
                    }
                }
            )
        
        return await call_next(request)

# Export middleware classes and dependencies
__all__ = [
    'SupabaseAuthMiddleware',
    'RateLimitMiddleware', 
    'CreditCheckMiddleware',
    'get_current_user',
    'get_current_user_id',
    'get_optional_user',
    'security_scheme',
    'verify_api_key'
]
