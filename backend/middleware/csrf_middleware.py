#!/usr/bin/env python3
"""
CSRF Protection Middleware
Protects against Cross-Site Request Forgery attacks
"""

import logging
import secrets
import hashlib
import os
from typing import Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Middleware for CSRF protection"""

    def __init__(self, app, secret_key: str = None):
        super().__init__(app)
        self.secret_key = secret_key or secrets.token_urlsafe(32)
        self.safe_methods = {'GET', 'HEAD', 'OPTIONS', 'TRACE'}
        self.exclude_paths = [
            '/health',
            '/docs',
            '/openapi.json',
            '/auth/login',
            '/auth/register',
            '/auth/refresh',
            '/auth/reset-password',
            '/api/v1/documents/process',
            '/api/v1/documents/process-batch',
            '/dashboard/',
            '/test'
        ]
        # Allowed origins for development (frontend -> backend)
        self.allowed_origins = [
            'http://localhost:3000',  # Development frontend
            'https://yourdomain.com',  # Production domain
        ]

        # Get additional origins from environment
        env_origins = os.getenv('CSRF_ALLOWED_ORIGINS', '').split(',')
        if env_origins and env_origins[0]:  # Check if not empty
            self.allowed_origins.extend([origin.strip() for origin in env_origins])
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and verify CSRF token for unsafe methods"""
        
        # Skip CSRF protection for safe methods
        if request.method in self.safe_methods:
            return await call_next(request)
            
        # Skip CSRF protection for excluded paths
        logger.info(f"CSRF: Checking path {request.url.path} against exclude_paths: {self.exclude_paths}")
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            logger.info(f"CSRF: Skipping CSRF for excluded path: {request.url.path}")
            return await call_next(request)
            
        # Check Origin header for additional protection
        origin = request.headers.get('origin')
        host = request.headers.get('host')

        if origin:
            # Check if origin is in allowed list (for development and production)
            if origin not in self.allowed_origins:
                logger.warning(f"CSRF: Origin not allowed - Origin: {origin}, Host: {host}")
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "error": "csrf_protection",
                        "message": "Origin not allowed",
                        "details": "Possible CSRF attack detected"
                    }
                )
        
        # For API requests, check for custom header (CSRF protection for AJAX)
        x_requested_with = request.headers.get('x-requested-with')
        if x_requested_with == 'XMLHttpRequest':
            # AJAX requests with this header are protected against CSRF
            return await call_next(request)
            
        # Check for CSRF token in headers
        csrf_token = request.headers.get('x-csrf-token')
        if not csrf_token:
            logger.warning(f"CSRF: Missing CSRF token for {request.method} {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "error": "csrf_token_missing",
                    "message": "CSRF token is required for this request",
                    "details": "Include X-CSRF-Token header"
                }
            )
            
        # Validate CSRF token
        if not self._validate_csrf_token(csrf_token):
            logger.warning(f"CSRF: Invalid CSRF token for {request.method} {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "error": "csrf_token_invalid",
                    "message": "Invalid CSRF token",
                    "details": "CSRF token validation failed"
                }
            )
            
        return await call_next(request)
    
    def _validate_csrf_token(self, token: str) -> bool:
        """Validate CSRF token"""
        try:
            # Simple token validation - in production, use more sophisticated method
            expected_token = hashlib.sha256(
                f"{self.secret_key}:csrf_token".encode()
            ).hexdigest()[:32]
            
            return secrets.compare_digest(token, expected_token)
        except Exception as e:
            logger.error(f"CSRF token validation error: {e}")
            return False
    
    def generate_csrf_token(self) -> str:
        """Generate CSRF token for client"""
        return hashlib.sha256(
            f"{self.secret_key}:csrf_token".encode()
        ).hexdigest()[:32]

# Endpoint to get CSRF token
async def get_csrf_token(request: Request) -> dict:
    """Get CSRF token for client"""
    csrf_middleware = None
    
    # Find CSRF middleware in app middleware stack
    for middleware in request.app.middleware_stack:
        if isinstance(middleware, CSRFProtectionMiddleware):
            csrf_middleware = middleware
            break
    
    if not csrf_middleware:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="CSRF middleware not configured"
        )
    
    token = csrf_middleware.generate_csrf_token()
    return {
        "csrf_token": token,
        "message": "Include this token in X-CSRF-Token header for POST/PUT/DELETE requests"
    }
