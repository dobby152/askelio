#!/usr/bin/env python3
"""
User Service
Handles user management, authentication, and profile operations
"""

import logging
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timedelta
from decimal import Decimal

from .supabase_client import SupabaseService
from models.supabase_models import (
    User, UserCreate, UserUpdate, UserStats,
    CreditBalance, CreditTransaction
)

logger = logging.getLogger(__name__)

class UserService(SupabaseService):
    """Service for user management operations"""
    
    async def create_user_profile(self, user_id: str, email: str, full_name: Optional[str] = None) -> Dict[str, Any]:
        """Create user profile after Supabase Auth signup"""
        try:
            profile_data = {
                'id': user_id,
                'email': email,
                'full_name': full_name,
                'preferred_language': 'cs',
                'preferred_currency': 'CZK',
                'credit_balance': 10.00,  # Free credits for new users
                'subscription_tier': 'free',
                'total_credits_purchased': 10.00,
                'total_credits_used': 0.00
            }

            return await self.execute_query(
                lambda: self.supabase.table('users').insert(profile_data).execute()
            )
        except Exception as e:
            logger.error(f"Error creating user profile: {e}")
            return self._handle_error(e)

    async def get_or_create_user_profile(self, user_id: str, email: str, full_name: Optional[str] = None) -> Dict[str, Any]:
        """Get user profile or create if doesn't exist"""
        try:
            # Try to get existing profile
            user_result = await self.get_user_profile(user_id)

            if user_result['success'] and user_result['data']:
                return user_result

            # Profile doesn't exist, create it
            logger.info(f"Creating new user profile for {user_id}")
            return await self.create_user_profile(user_id, email, full_name)

        except Exception as e:
            logger.error(f"Error getting or creating user profile: {e}")
            return self._handle_error(e)
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile by ID"""
        return await self.get_user_by_id(user_id)
    
    async def update_user_profile(self, user_id: str, user_data: UserUpdate) -> Dict[str, Any]:
        """Update user profile"""
        try:
            update_data = user_data.dict(exclude_unset=True)
            if update_data:
                update_data['updated_at'] = datetime.utcnow().isoformat()
                
                return await self.execute_query(
                    lambda: self.supabase.table('users')
                    .update(update_data)
                    .eq('id', user_id)
                    .execute()
                )
            else:
                return {"success": True, "data": None, "error": None}
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return self._handle_error(e)
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user statistics"""
        try:
            # Get user basic info
            user_result = await self.get_user_profile(user_id)
            if not user_result['success']:
                return user_result
            
            user_data = user_result['data']
            
            # Get document statistics
            doc_stats = await self.execute_rpc('get_user_document_stats', {'p_user_id': user_id})
            
            # Get credit statistics  
            credit_stats = await self.execute_rpc('get_user_credit_stats', {'p_user_id': user_id})
            
            # Combine statistics
            stats = UserStats(
                total_documents=doc_stats['data'].get('total_documents', 0) if doc_stats['success'] else 0,
                documents_this_month=doc_stats['data'].get('documents_this_month', 0) if doc_stats['success'] else 0,
                total_credits_used=Decimal(str(user_data.get('total_credits_used', 0))),
                credits_used_this_month=credit_stats['data'].get('credits_this_month', 0) if credit_stats['success'] else 0,
                average_processing_cost=credit_stats['data'].get('avg_cost', 0) if credit_stats['success'] else 0,
                favorite_document_types=doc_stats['data'].get('favorite_types', []) if doc_stats['success'] else []
            )
            
            return {
                "success": True,
                "data": stats.dict(),
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            return self._handle_error(e)
    
    async def get_credit_balance(self, user_id: str) -> Dict[str, Any]:
        """Get user credit balance and recent transactions"""
        try:
            # Get user credit info
            user_result = await self.get_user_profile(user_id)
            if not user_result['success']:
                return user_result
            
            user_data = user_result['data']
            
            # Get recent transactions
            transactions_result = await self.execute_rpc(
                'get_user_transactions',
                {
                    'p_user_id': user_id,
                    'p_limit': 10
                }
            )
            
            recent_transactions = []
            if transactions_result['success'] and transactions_result['data']:
                recent_transactions = [
                    CreditTransaction(**tx) for tx in transactions_result['data']
                ]
            
            balance = CreditBalance(
                current_balance=Decimal(str(user_data.get('credit_balance', 0))),
                total_purchased=Decimal(str(user_data.get('total_credits_purchased', 0))),
                total_used=Decimal(str(user_data.get('total_credits_used', 0))),
                recent_transactions=recent_transactions
            )
            
            return {
                "success": True,
                "data": balance.dict(),
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error getting credit balance: {e}")
            return self._handle_error(e)
    
    async def check_sufficient_credits(self, user_id: str, required_credits: Decimal) -> Dict[str, Any]:
        """Check if user has sufficient credits for operation"""
        try:
            user_result = await self.get_user_profile(user_id)
            if not user_result['success']:
                return user_result
            
            user_data = user_result['data']
            current_balance = Decimal(str(user_data.get('credit_balance', 0)))
            
            has_sufficient = current_balance >= required_credits
            
            return {
                "success": True,
                "data": {
                    "has_sufficient_credits": has_sufficient,
                    "current_balance": float(current_balance),
                    "required_credits": float(required_credits),
                    "shortage": float(max(required_credits - current_balance, 0))
                },
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error checking credits: {e}")
            return self._handle_error(e)
    
    async def update_subscription(self, user_id: str, tier: str, expires_at: Optional[datetime] = None) -> Dict[str, Any]:
        """Update user subscription tier"""
        try:
            update_data = {
                'subscription_tier': tier,
                'subscription_expires_at': expires_at.isoformat() if expires_at else None,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            return await self.execute_query(
                lambda: self.supabase.table('users')
                .update(update_data)
                .eq('id', user_id)
                .execute()
            )
            
        except Exception as e:
            logger.error(f"Error updating subscription: {e}")
            return self._handle_error(e)
    
    async def delete_user_account(self, user_id: str) -> Dict[str, Any]:
        """Delete user account and all associated data"""
        try:
            # This will cascade delete all related data due to foreign key constraints
            return await self.execute_query(
                lambda: self.supabase.table('users')
                .delete()
                .eq('id', user_id)
                .execute()
            )
            
        except Exception as e:
            logger.error(f"Error deleting user account: {e}")
            return self._handle_error(e)
    
    async def get_users_list(self, limit: int = 50, offset: int = 0, search: Optional[str] = None) -> Dict[str, Any]:
        """Get paginated list of users (admin function)"""
        try:
            query = self.supabase.table('users').select('id,email,full_name,subscription_tier,created_at,credit_balance')
            
            if search:
                query = query.or_(f'email.ilike.%{search}%,full_name.ilike.%{search}%')
            
            query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
            
            return await self.execute_query(lambda: query.execute())
            
        except Exception as e:
            logger.error(f"Error getting users list: {e}")
            return self._handle_error(e)
    
    async def get_user_activity_summary(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get user activity summary for specified period"""
        try:
            start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            # Get document processing activity
            doc_activity = await self.execute_query(
                lambda: self.supabase.table('documents')
                .select('status,created_at,processing_cost')
                .eq('user_id', user_id)
                .gte('created_at', start_date)
                .execute()
            )
            
            # Get credit transaction activity
            credit_activity = await self.execute_query(
                lambda: self.supabase.table('credit_transactions')
                .select('transaction_type,amount,created_at')
                .eq('user_id', user_id)
                .gte('created_at', start_date)
                .execute()
            )
            
            activity_summary = {
                "period_days": days,
                "documents_processed": len(doc_activity['data']) if doc_activity['success'] else 0,
                "total_processing_cost": sum(
                    float(doc.get('processing_cost', 0) or 0) 
                    for doc in (doc_activity['data'] if doc_activity['success'] else [])
                ),
                "credit_transactions": len(credit_activity['data']) if credit_activity['success'] else 0,
                "credits_purchased": sum(
                    float(tx.get('amount', 0)) 
                    for tx in (credit_activity['data'] if credit_activity['success'] else [])
                    if tx.get('transaction_type') == 'purchase'
                ),
                "credits_used": sum(
                    abs(float(tx.get('amount', 0))) 
                    for tx in (credit_activity['data'] if credit_activity['success'] else [])
                    if tx.get('transaction_type') == 'usage'
                )
            }
            
            return {
                "success": True,
                "data": activity_summary,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error getting user activity: {e}")
            return self._handle_error(e)
