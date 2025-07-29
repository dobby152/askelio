#!/usr/bin/env python3
"""
Simple FastAPI server for testing authentication
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import os
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Askelio Simple Server", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Request models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@app.get("/")
async def root():
    return {"message": "Askelio Simple Server is running!"}

@app.get("/test")
async def test():
    return {
        "success": True,
        "message": "API is working!",
        "supabase_url": os.getenv('SUPABASE_URL'),
        "has_anon_key": bool(os.getenv('SUPABASE_ANON_KEY')),
        "has_service_key": bool(os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
    }

@app.post("/auth/login")
async def login(request: LoginRequest):
    """Simple login endpoint"""
    try:
        logger.info(f"Login attempt for email: {request.email}")
        
        # Import Supabase client here to avoid startup issues
        from services.supabase_client import get_supabase
        supabase = get_supabase()
        
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response.user or not auth_response.session:
            logger.warning(f"Login failed for email: {request.email}")
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "message": "Neplatné přihlašovací údaje",
                    "error": "invalid_credentials"
                }
            )
        
        logger.info(f"Login successful for email: {request.email}")
        return {
            "success": True,
            "message": "Přihlášení úspěšné",
            "data": {
                "user": {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "full_name": auth_response.user.user_metadata.get('full_name')
                },
                "session": {
                    "access_token": auth_response.session.access_token,
                    "refresh_token": auth_response.session.refresh_token,
                    "expires_at": auth_response.session.expires_at
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "Došlo k neočekávané chybě při přihlašování",
                "error": str(e)
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
