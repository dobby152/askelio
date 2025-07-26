#!/usr/bin/env python3
"""
Authentication Router
FastAPI router for Supabase authentication endpoints
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone

from services.supabase_client import get_supabase
from services.user_service import UserService
from middleware.auth_middleware import get_current_user

logger = logging.getLogger(__name__)

# Initialize services
supabase = get_supabase()
user_service = UserService()

# Create router
router = APIRouter(prefix="/auth", tags=["authentication"])

# Request/Response models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login user with email and password
    Returns JWT tokens and user profile
    """
    try:
        logger.info(f"🔐 Login attempt for email: {request.email}")
        
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response.user or not auth_response.session:
            logger.warning(f"Login failed for email: {request.email}")
            return AuthResponse(
                success=False,
                message="Neplatné přihlašovací údaje",
                error="invalid_credentials"
            )
        
        # Get or create user profile
        user_result = await user_service.get_or_create_user_profile(
            user_id=auth_response.user.id,
            email=auth_response.user.email,
            full_name=auth_response.user.user_metadata.get('full_name')
        )
        
        if not user_result['success']:
            logger.error(f"Failed to get user profile: {user_result['error']}")
            return AuthResponse(
                success=False,
                message="Chyba při načítání profilu uživatele",
                error="profile_error"
            )
        
        logger.info(f"Login successful for user: {auth_response.user.id}")
        
        return AuthResponse(
            success=True,
            message="Přihlášení úspěšné",
            data={
                "user": user_result['data'],
                "session": {
                    "access_token": auth_response.session.access_token,
                    "refresh_token": auth_response.session.refresh_token,
                    "expires_at": auth_response.session.expires_at,
                    "token_type": auth_response.session.token_type
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return AuthResponse(
            success=False,
            message="Došlo k neočekávané chybě při přihlašování",
            error=str(e)
        )

@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register new user with email and password
    Creates user profile in database
    """
    try:
        logger.info(f"Registration attempt for email: {request.email}")
        
        # Register with Supabase
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "full_name": request.full_name
                }
            }
        })
        
        if not auth_response.user:
            logger.warning(f"Registration failed for email: {request.email}")
            return AuthResponse(
                success=False,
                message="Registrace se nezdařila",
                error="registration_failed"
            )
        
        # Create user profile
        user_result = await user_service.create_user_profile(
            user_id=auth_response.user.id,
            email=auth_response.user.email,
            full_name=request.full_name
        )
        
        if not user_result['success']:
            logger.error(f"Failed to create user profile: {user_result['error']}")
            # User was created in auth but profile creation failed
            # This is not critical, profile will be created on first login
        
        logger.info(f"Registration successful for user: {auth_response.user.id}")
        
        # Check if email confirmation is required
        if auth_response.session is None:
            return AuthResponse(
                success=True,
                message="Registrace úspěšná! Zkontrolujte svůj email pro potvrzení účtu.",
                data={
                    "user": {
                        "id": auth_response.user.id,
                        "email": auth_response.user.email,
                        "email_confirmed": False
                    }
                }
            )
        else:
            return AuthResponse(
                success=True,
                message="Registrace a přihlášení úspěšné!",
                data={
                    "user": user_result.get('data', {
                        "id": auth_response.user.id,
                        "email": auth_response.user.email
                    }),
                    "session": {
                        "access_token": auth_response.session.access_token,
                        "refresh_token": auth_response.session.refresh_token,
                        "expires_at": auth_response.session.expires_at,
                        "token_type": auth_response.session.token_type
                    }
                }
            )
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return AuthResponse(
            success=False,
            message="Došlo k neočekávané chybě při registraci",
            error=str(e)
        )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: TokenRefreshRequest):
    """
    Refresh JWT token using refresh token
    """
    try:
        logger.info("Token refresh attempt")
        
        # Refresh token with Supabase
        auth_response = supabase.auth.refresh_session(request.refresh_token)
        
        if not auth_response.session:
            logger.warning("Token refresh failed")
            return AuthResponse(
                success=False,
                message="Neplatný refresh token",
                error="invalid_refresh_token"
            )
        
        logger.info("Token refresh successful")
        
        return AuthResponse(
            success=True,
            message="Token úspěšně obnoven",
            data={
                "session": {
                    "access_token": auth_response.session.access_token,
                    "refresh_token": auth_response.session.refresh_token,
                    "expires_at": auth_response.session.expires_at,
                    "token_type": auth_response.session.token_type
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return AuthResponse(
            success=False,
            message="Chyba při obnovování tokenu",
            error=str(e)
        )

@router.post("/reset-password", response_model=AuthResponse)
async def reset_password(request: PasswordResetRequest):
    """
    Send password reset email
    """
    try:
        logger.info(f"Password reset request for email: {request.email}")
        
        # Send password reset email via Supabase
        auth_response = supabase.auth.reset_password_email(request.email)
        
        logger.info(f"Password reset email sent to: {request.email}")
        
        return AuthResponse(
            success=True,
            message="Email pro obnovení hesla byl odeslán"
        )
        
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        return AuthResponse(
            success=False,
            message="Chyba při odesílání emailu pro obnovení hesla",
            error=str(e)
        )

@router.post("/logout", response_model=AuthResponse)
async def logout():
    """
    Logout user (invalidate session)
    """
    try:
        logger.info("Logout attempt")

        # Sign out from Supabase
        supabase.auth.sign_out()

        logger.info("Logout successful")

        return AuthResponse(
            success=True,
            message="Odhlášení úspěšné"
        )

    except Exception as e:
        logger.error(f"Logout error: {e}")
        return AuthResponse(
            success=False,
            message="Chyba při odhlašování",
            error=str(e)
        )

@router.get("/profile", response_model=AuthResponse)
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get current user profile
    """
    try:
        logger.info(f"Profile request for user: {current_user['id']}")

        return AuthResponse(
            success=True,
            message="Profil úspěšně načten",
            data=current_user
        )

    except Exception as e:
        logger.error(f"Profile error: {e}")
        return AuthResponse(
            success=False,
            message="Chyba při načítání profilu",
            error=str(e)
        )

# Health check for auth service
@router.get("/health")
async def auth_health():
    """Check auth service health"""
    try:
        # Test Supabase connection
        supabase.auth.get_session()
        return {
            "status": "healthy",
            "service": "authentication",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Auth health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )
