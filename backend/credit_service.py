# Credit management service
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional, List
import logging
from datetime import datetime, timedelta

from models import User, CreditTransaction, TransactionType, Document
from config import settings

logger = logging.getLogger('credit_service')

class CreditService:
    """Service for managing user credits and transactions."""

    @staticmethod
    def get_user_balance(user_id: str, db: Session) -> Decimal:
        """Get current credit balance for a user."""
        user = db.query(User).filter(User.id == user_id).first()
        return user.credit_balance if user else Decimal('0.00')

    @staticmethod
    def add_credits(
        user_id: str,
        amount: Decimal,
        description: str,
        stripe_charge_id: Optional[str] = None,
        db: Session = None
    ) -> bool:
        """Add credits to a user's account."""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"User {user_id} not found when adding credits")
                return False

            # Update user balance
            user.credit_balance += amount

            # Create transaction record
            transaction = CreditTransaction(
                user_id=user_id,
                amount=amount,
                type=TransactionType.top_up,
                stripe_charge_id=stripe_charge_id,
                description=description
            )

            db.add(transaction)
            db.commit()

            logger.info(f"Added {amount} credits to user {user.email}. New balance: {user.credit_balance}")
            return True

        except Exception as e:
            logger.error(f"Error adding credits to user {user_id}: {e}")
            db.rollback()
            return False

    @staticmethod
    def deduct_credits(
        user_id: str,
        amount: Decimal,
        description: str,
        document_id: Optional[str] = None,
        db: Session = None
    ) -> bool:
        """Deduct credits from a user's account."""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"User {user_id} not found when deducting credits")
                return False

            if user.credit_balance < amount:
                logger.warning(f"Insufficient credits for user {user.email}. Balance: {user.credit_balance}, Required: {amount}")
                return False

            # Update user balance
            user.credit_balance -= amount

            # Create transaction record
            transaction = CreditTransaction(
                user_id=user_id,
                document_id=document_id,
                amount=-amount,  # Negative for deduction
                type=TransactionType.usage,
                description=description
            )

            db.add(transaction)
            db.commit()

            logger.info(f"Deducted {amount} credits from user {user.email}. New balance: {user.credit_balance}")
            return True

        except Exception as e:
            logger.error(f"Error deducting credits from user {user_id}: {e}")
            db.rollback()
            return False

    @staticmethod
    def get_transaction_history(
        user_id: str,
        db: Session,
        limit: int = 50,
        days: Optional[int] = None
    ) -> List[CreditTransaction]:
        """Get transaction history for a user."""
        query = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user_id
        )

        if days:
            since_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(CreditTransaction.created_at >= since_date)

        return query.order_by(CreditTransaction.created_at.desc()).limit(limit).all()

    @staticmethod
    def get_usage_stats(user_id: str, db: Session, days: int = 30) -> dict:
        """Get credit usage statistics for a user."""
        since_date = datetime.utcnow() - timedelta(days=days)

        # Get usage transactions
        usage_transactions = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user_id,
            CreditTransaction.type == TransactionType.usage,
            CreditTransaction.created_at >= since_date
        ).all()

        # Get top-up transactions
        topup_transactions = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user_id,
            CreditTransaction.type == TransactionType.top_up,
            CreditTransaction.created_at >= since_date
        ).all()

        # Calculate stats
        total_used = sum(abs(t.amount) for t in usage_transactions)
        total_added = sum(t.amount for t in topup_transactions)
        documents_processed = len([t for t in usage_transactions if t.document_id])

        return {
            "period_days": days,
            "total_credits_used": float(total_used),
            "total_credits_added": float(total_added),
            "documents_processed": documents_processed,
            "average_cost_per_document": float(total_used / documents_processed) if documents_processed > 0 else 0,
            "usage_transactions": len(usage_transactions),
            "topup_transactions": len(topup_transactions)
        }

    @staticmethod
    def check_sufficient_credits(user_id: str, required_amount: Decimal, db: Session) -> bool:
        """Check if user has sufficient credits for an operation."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        return user.credit_balance >= required_amount

    @staticmethod
    def refund_credits(
        user_id: str,
        amount: Decimal,
        description: str,
        original_transaction_id: Optional[str] = None,
        db: Session = None
    ) -> bool:
        """Refund credits to a user's account."""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"User {user_id} not found when refunding credits")
                return False

            # Update user balance
            user.credit_balance += amount

            # Create refund transaction record
            transaction = CreditTransaction(
                user_id=user_id,
                amount=amount,
                type=TransactionType.refund,
                description=f"Refund: {description}"
            )

            db.add(transaction)
            db.commit()

            logger.info(f"Refunded {amount} credits to user {user.email}. New balance: {user.credit_balance}")
            return True

        except Exception as e:
            logger.error(f"Error refunding credits to user {user_id}: {e}")
            db.rollback()
            return False

# Global service instance
credit_service = CreditService()
