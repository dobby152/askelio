#!/usr/bin/env python3
"""
Credit Service
Handles credit transactions, purchases, and usage tracking
"""

import logging
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timedelta
from decimal import Decimal

from .supabase_client import SupabaseService
from models.supabase_models import (
    CreditTransaction, CreditTransactionCreate,
    User
)

logger = logging.getLogger(__name__)

class CreditService(SupabaseService):
    """Service for credit management operations"""
    
    async def add_credit_transaction(
        self, 
        user_id: str, 
        transaction_data: CreditTransactionCreate
    ) -> Dict[str, Any]:
        """Add a new credit transaction and update user balance"""
        try:
            # Prepare RPC parameters
            rpc_params = {
                'p_user_id': user_id,
                'p_amount': float(transaction_data.amount),
                'p_transaction_type': transaction_data.transaction_type,
                'p_description': transaction_data.description,
                'p_category': transaction_data.category,
                'p_document_id': str(transaction_data.document_id) if transaction_data.document_id else None,
                'p_session_id': transaction_data.session_id,
                'p_metadata': transaction_data.metadata,
                'p_processing_cost': float(transaction_data.processing_cost) if transaction_data.processing_cost else None,
                'p_model_used': transaction_data.model_used,
                'p_tokens_used': transaction_data.tokens_used,
                'p_payment_method': transaction_data.payment_method,
                'p_payment_reference': transaction_data.payment_reference,
                'p_payment_status': transaction_data.payment_status
            }
            
            # Remove None values
            rpc_params = {k: v for k, v in rpc_params.items() if v is not None}
            
            return await self.execute_rpc('add_credit_transaction', rpc_params)
            
        except Exception as e:
            logger.error(f"Error adding credit transaction: {e}")
            return self._handle_error(e)
    
    async def purchase_credits(
        self, 
        user_id: str, 
        amount: Decimal, 
        payment_method: str,
        payment_reference: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Purchase credits for user"""
        try:
            transaction_data = CreditTransactionCreate(
                amount=amount,
                transaction_type='purchase',
                description=description or f"Credit purchase - {amount} credits",
                category='credit_purchase',
                payment_method=payment_method,
                payment_reference=payment_reference,
                payment_status='completed'
            )
            
            return await self.add_credit_transaction(user_id, transaction_data)
            
        except Exception as e:
            logger.error(f"Error purchasing credits: {e}")
            return self._handle_error(e)
    
    async def use_credits(
        self,
        user_id: str,
        amount: Decimal,
        description: str,
        document_id: Optional[UUID] = None,
        session_id: Optional[str] = None,
        model_used: Optional[str] = None,
        tokens_used: Optional[int] = None,
        category: str = 'document_processing'
    ) -> Dict[str, Any]:
        """Use credits for document processing or other operations"""
        try:
            # Convert amount to negative for usage
            usage_amount = -abs(amount)
            
            transaction_data = CreditTransactionCreate(
                amount=usage_amount,
                transaction_type='usage',
                description=description,
                category=category,
                document_id=document_id,
                session_id=session_id,
                processing_cost=amount,
                model_used=model_used,
                tokens_used=tokens_used
            )
            
            return await self.add_credit_transaction(user_id, transaction_data)
            
        except Exception as e:
            logger.error(f"Error using credits: {e}")
            return self._handle_error(e)
    
    async def refund_credits(
        self,
        user_id: str,
        amount: Decimal,
        reason: str,
        original_transaction_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Refund credits to user"""
        try:
            transaction_data = CreditTransactionCreate(
                amount=amount,
                transaction_type='refund',
                description=f"Credit refund: {reason}",
                category='refund',
                metadata={
                    'original_transaction_id': str(original_transaction_id) if original_transaction_id else None,
                    'refund_reason': reason
                }
            )
            
            return await self.add_credit_transaction(user_id, transaction_data)
            
        except Exception as e:
            logger.error(f"Error refunding credits: {e}")
            return self._handle_error(e)
    
    async def add_bonus_credits(
        self,
        user_id: str,
        amount: Decimal,
        reason: str
    ) -> Dict[str, Any]:
        """Add bonus credits to user account"""
        try:
            transaction_data = CreditTransactionCreate(
                amount=amount,
                transaction_type='bonus',
                description=f"Bonus credits: {reason}",
                category='bonus'
            )
            
            return await self.add_credit_transaction(user_id, transaction_data)
            
        except Exception as e:
            logger.error(f"Error adding bonus credits: {e}")
            return self._handle_error(e)
    
    async def get_transaction_history(
        self,
        user_id: str,
        transaction_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get user's credit transaction history with filtering"""
        try:
            # Build query
            query = self.supabase.table('credit_transactions').select('*').eq('user_id', user_id)
            
            if transaction_type:
                query = query.eq('transaction_type', transaction_type)
            
            if start_date:
                query = query.gte('created_at', start_date.isoformat())
            
            if end_date:
                query = query.lte('created_at', end_date.isoformat())
            
            query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
            
            return await self.execute_query(lambda: query.execute())
            
        except Exception as e:
            logger.error(f"Error getting transaction history: {e}")
            return self._handle_error(e)
    
    async def get_credit_usage_stats(
        self,
        user_id: str,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Get credit usage statistics for specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Get transactions for the period
            transactions_result = await self.get_transaction_history(
                user_id=user_id,
                start_date=start_date,
                limit=1000  # Get all transactions in period
            )
            
            if not transactions_result['success']:
                return transactions_result
            
            transactions = transactions_result['data']
            
            # Calculate statistics
            stats = {
                'period_days': period_days,
                'total_purchased': 0,
                'total_used': 0,
                'total_refunded': 0,
                'total_bonus': 0,
                'transaction_count': len(transactions),
                'usage_by_category': {},
                'usage_by_model': {},
                'daily_usage': {}
            }
            
            for tx in transactions:
                amount = float(tx.get('amount', 0))
                tx_type = tx.get('transaction_type')
                category = tx.get('category', 'unknown')
                model = tx.get('model_used')
                date = tx.get('created_at', '')[:10]  # Get date part
                
                if tx_type == 'purchase':
                    stats['total_purchased'] += amount
                elif tx_type == 'usage':
                    stats['total_used'] += abs(amount)
                    
                    # Usage by category
                    if category not in stats['usage_by_category']:
                        stats['usage_by_category'][category] = 0
                    stats['usage_by_category'][category] += abs(amount)
                    
                    # Usage by model
                    if model:
                        if model not in stats['usage_by_model']:
                            stats['usage_by_model'][model] = 0
                        stats['usage_by_model'][model] += abs(amount)
                    
                    # Daily usage
                    if date not in stats['daily_usage']:
                        stats['daily_usage'][date] = 0
                    stats['daily_usage'][date] += abs(amount)
                    
                elif tx_type == 'refund':
                    stats['total_refunded'] += amount
                elif tx_type == 'bonus':
                    stats['total_bonus'] += amount
            
            return {
                "success": True,
                "data": stats,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error getting credit usage stats: {e}")
            return self._handle_error(e)
    
    async def estimate_processing_cost(
        self,
        document_type: str,
        pages: int,
        processing_mode: str = 'accuracy_first'
    ) -> Dict[str, Any]:
        """Estimate processing cost for a document"""
        try:
            # Base costs per page by processing mode
            base_costs = {
                'accuracy_first': 0.15,  # Claude 3.5 Sonnet
                'speed_first': 0.08,     # GPT-4o
                'cost_effective': 0.03   # Claude 3 Haiku
            }
            
            # Document type multipliers
            type_multipliers = {
                'invoice': 1.0,
                'receipt': 0.8,
                'contract': 1.5,
                'form': 1.2,
                'other': 1.0
            }
            
            base_cost = base_costs.get(processing_mode, 0.1)
            type_multiplier = type_multipliers.get(document_type, 1.0)
            
            estimated_cost = Decimal(str(base_cost * pages * type_multiplier))
            
            return {
                "success": True,
                "data": {
                    "estimated_cost": float(estimated_cost),
                    "base_cost_per_page": base_cost,
                    "pages": pages,
                    "document_type": document_type,
                    "processing_mode": processing_mode,
                    "type_multiplier": type_multiplier
                },
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error estimating processing cost: {e}")
            return self._handle_error(e)
