#!/usr/bin/env python3
"""
Supabase Database Models
Pydantic models for user authentication, credits, and memories system
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from decimal import Decimal
from uuid import UUID
import json

# ===== USER MODELS =====

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_language: Literal['cs', 'en', 'sk'] = 'cs'
    preferred_currency: Literal['CZK', 'EUR', 'USD'] = 'CZK'

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_language: Optional[Literal['cs', 'en', 'sk']] = None
    preferred_currency: Optional[Literal['CZK', 'EUR', 'USD']] = None

class User(UserBase):
    id: UUID
    credit_balance: Decimal = Field(default=Decimal('10.00'))
    total_credits_purchased: Decimal = Field(default=Decimal('0.00'))
    total_credits_used: Decimal = Field(default=Decimal('0.00'))
    subscription_tier: Literal['free', 'basic', 'premium'] = 'free'
    subscription_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v)
        }

# ===== MEMORY MODELS =====

class UserMemoryBase(BaseModel):
    memory_content: str = Field(..., min_length=1, max_length=10000)
    memory_type: Literal['conversation', 'preference', 'context', 'document_history', 'system_note'] = 'conversation'
    title: Optional[str] = Field(None, max_length=200)
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    importance_score: int = Field(default=5, ge=1, le=10)
    relevance_score: Decimal = Field(default=Decimal('1.00'), ge=0, le=1)
    expires_at: Optional[datetime] = None

class UserMemoryCreate(UserMemoryBase):
    pass

class UserMemoryUpdate(BaseModel):
    memory_content: Optional[str] = Field(None, min_length=1, max_length=10000)
    memory_type: Optional[Literal['conversation', 'preference', 'context', 'document_history', 'system_note']] = None
    title: Optional[str] = Field(None, max_length=200)
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    importance_score: Optional[int] = Field(None, ge=1, le=10)
    relevance_score: Optional[Decimal] = Field(None, ge=0, le=1)
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None

class UserMemory(UserMemoryBase):
    id: UUID
    user_id: UUID
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v)
        }

# ===== CREDIT TRANSACTION MODELS =====

class CreditTransactionBase(BaseModel):
    amount: Decimal = Field(..., decimal_places=2)
    transaction_type: Literal['purchase', 'usage', 'refund', 'bonus', 'adjustment']
    description: str = Field(..., min_length=1, max_length=500)
    category: Optional[str] = Field(None, max_length=100)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class CreditTransactionCreate(CreditTransactionBase):
    document_id: Optional[UUID] = None
    session_id: Optional[str] = None
    processing_cost: Optional[Decimal] = Field(None, decimal_places=4)
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_status: Literal['pending', 'completed', 'failed', 'refunded'] = 'completed'

class CreditTransaction(CreditTransactionBase):
    id: UUID
    user_id: UUID
    document_id: Optional[UUID] = None
    session_id: Optional[str] = None
    processing_cost: Optional[Decimal] = None
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_status: Literal['pending', 'completed', 'failed', 'refunded'] = 'completed'
    balance_before: Decimal
    balance_after: Decimal
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v)
        }

# ===== DOCUMENT MODELS =====

class DocumentBase(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    original_filename: str = Field(..., min_length=1, max_length=255)
    file_type: str = Field(..., min_length=1, max_length=100)
    processing_mode: Literal['accuracy_first', 'speed_first', 'cost_effective'] = 'accuracy_first'
    language: str = Field(default='cs', max_length=5)
    document_type: Optional[str] = Field(None, max_length=50)
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(None, max_length=1000)

class DocumentCreate(DocumentBase):
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: Optional[str] = None

class DocumentUpdate(BaseModel):
    status: Optional[Literal['uploading', 'processing', 'completed', 'failed', 'cancelled']] = None
    extracted_text: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    confidence_score: Optional[Decimal] = Field(None, ge=0, le=1)
    accuracy_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    ocr_provider: Optional[str] = None
    llm_model: Optional[str] = None
    processing_cost: Optional[Decimal] = Field(None, decimal_places=4)
    processing_time: Optional[Decimal] = Field(None, decimal_places=3)
    tokens_used: Optional[int] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    processed_at: Optional[datetime] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=1000)

class Document(DocumentBase):
    id: UUID
    user_id: UUID
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    file_hash: Optional[str] = None
    status: Literal['uploading', 'processing', 'completed', 'failed', 'cancelled'] = 'uploading'
    pages: int = 1
    extracted_text: Optional[str] = None
    structured_data: Dict[str, Any] = Field(default_factory=dict)
    confidence_score: Optional[Decimal] = None
    accuracy_percentage: Optional[Decimal] = None
    ocr_provider: Optional[str] = None
    llm_model: Optional[str] = None
    processing_cost: Optional[Decimal] = None
    processing_time: Optional[Decimal] = None
    tokens_used: Optional[int] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    retry_count: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v)
        }

# ===== EXTRACTED FIELD MODELS =====

class ExtractedFieldBase(BaseModel):
    field_name: str = Field(..., min_length=1, max_length=100)
    field_value: Optional[str] = Field(None, max_length=1000)
    field_type: Literal['text', 'number', 'date', 'currency', 'boolean', 'email', 'phone'] = 'text'
    confidence: Optional[Decimal] = None
    extraction_method: Optional[str] = Field(None, max_length=50)
    source_location: Dict[str, Any] = Field(default_factory=dict)
    is_validated: bool = False
    validation_status: Literal['pending', 'valid', 'invalid', 'needs_review'] = 'pending'
    validation_notes: Optional[str] = Field(None, max_length=500)

class ExtractedFieldCreate(ExtractedFieldBase):
    document_id: UUID
    user_id: UUID

class ExtractedFieldUpdate(BaseModel):
    field_value: Optional[str] = None
    confidence: Optional[Decimal] = None
    is_validated: Optional[bool] = None
    validation_status: Optional[Literal['pending', 'valid', 'invalid', 'needs_review']] = None
    validation_notes: Optional[str] = None

class ExtractedField(ExtractedFieldBase):
    id: UUID
    document_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v)
        }
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v)
        }

# ===== EXTRACTED FIELD MODELS =====

class ExtractedFieldBase(BaseModel):
    field_name: str = Field(..., min_length=1, max_length=100)
    field_value: Optional[str] = None
    field_type: Literal['text', 'number', 'date', 'currency', 'boolean', 'email', 'phone'] = 'text'
    confidence: Optional[Decimal] = Field(None, ge=0, le=1)
    extraction_method: Optional[str] = Field(None, max_length=50)
    source_location: Optional[Dict[str, Any]] = None

class ExtractedFieldCreate(ExtractedFieldBase):
    document_id: UUID

class ExtractedFieldUpdate(BaseModel):
    field_value: Optional[str] = None
    field_type: Optional[Literal['text', 'number', 'date', 'currency', 'boolean', 'email', 'phone']] = None
    confidence: Optional[Decimal] = Field(None, ge=0, le=1)
    is_validated: Optional[bool] = None
    validation_status: Optional[Literal['pending', 'valid', 'invalid', 'needs_review']] = None
    validation_notes: Optional[str] = Field(None, max_length=500)

class ExtractedField(ExtractedFieldBase):
    id: UUID
    document_id: UUID
    user_id: UUID
    is_validated: bool = False
    validation_status: Literal['pending', 'valid', 'invalid', 'needs_review'] = 'pending'
    validation_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v)
        }

# ===== SESSION MODELS =====

class UserSessionBase(BaseModel):
    session_type: Literal['web', 'api', 'mobile'] = 'web'
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    device_info: Dict[str, Any] = Field(default_factory=dict)
    location_info: Dict[str, Any] = Field(default_factory=dict)

class UserSessionCreate(UserSessionBase):
    session_token: str = Field(..., min_length=32)
    expires_in_hours: int = Field(default=24, ge=1, le=8760)  # Max 1 year

class UserSession(UserSessionBase):
    id: UUID
    user_id: UUID
    session_token: str
    is_active: bool = True
    last_activity: datetime
    api_calls_count: int = 0
    api_calls_limit: Optional[int] = None
    rate_limit_reset: Optional[datetime] = None
    refresh_token: Optional[str] = None
    refresh_token_expires_at: Optional[datetime] = None
    created_at: datetime
    expires_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: lambda v: str(v)
        }

# ===== RESPONSE MODELS =====

class UserStats(BaseModel):
    total_documents: int
    documents_this_month: int
    total_credits_used: Decimal
    credits_used_this_month: Decimal
    average_processing_cost: Decimal
    favorite_document_types: List[Dict[str, Any]]

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }

class CreditBalance(BaseModel):
    current_balance: Decimal
    total_purchased: Decimal
    total_used: Decimal
    recent_transactions: List[CreditTransaction]

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }

class MemorySearchResult(BaseModel):
    memories: List[UserMemory]
    total_count: int
    search_query: Optional[str] = None
    filters_applied: Dict[str, Any] = Field(default_factory=dict)
