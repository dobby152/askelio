#!/usr/bin/env python3
"""
CSRF Protection Middleware
Protects against Cross-Site Request Forgery attacks
"""

import logging
import secrets
import hashlib
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
            '/auth/reset-password'
        ]
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and verify CSRF token for unsafe methods"""
        
        # Skip CSRF protection for safe methods
        if request.method in self.safe_methods:
            return await call_next(request)
            
        # Skip CSRF protection for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
            
        # Check Origin header for additional protection
        origin = request.headers.get('origin')
        host = request.headers.get('host')
        
        if origin:
            # Extract hostname from origin
            origin_host = origin.replace('https://', '').replace('http://', '')
            if origin_host != host:
                logger.warning(f"CSRF: Origin mismatch - Origin: {origin}, Host: {host}")
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "error": "csrf_protection",
                        "message": "Origin header does not match host",
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
