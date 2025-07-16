# Configuration settings
import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://askelio:askelio_dev_password@localhost:5432/askelio"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Supabase
    supabase_url: Optional[str] = None
    supabase_service_role_key: Optional[str] = None

    # Stripe
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None

    # Google Cloud Vision
    google_application_credentials: Optional[str] = None

    # Frontend
    frontend_url: str = "http://localhost:3000"

    # Environment
    environment: str = "development"

    # OCR Settings
    tesseract_confidence_threshold: float = 0.8
    ai_ocr_cost: float = 1.0

    # File Upload
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    upload_dir: str = "uploads"

    class Config:
        env_file = ".env"

# Global settings instance
settings = Settings()
