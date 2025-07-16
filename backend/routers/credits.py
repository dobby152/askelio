# Credits router
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import stripe
import os
from decimal import Decimal

from database import get_db
from models import User, CreditTransaction, TransactionType
from auth_utils import get_current_user
from stripe_utils import stripe_service
from config import settings

router = APIRouter()

# Pydantic models
class CreditBalanceResponse(BaseModel):
    balance: float

class CheckoutRequest(BaseModel):
    amount: int  # Number of credits to purchase

class CheckoutResponse(BaseModel):
    url: str

class TransactionResponse(BaseModel):
    id: str
    amount: float
    type: str
    description: str
    created_at: str

    class Config:
        from_attributes = True

@router.get("/balance", response_model=CreditBalanceResponse)
async def get_credit_balance(
    current_user: User = Depends(get_current_user)
):
    """Get current user's credit balance."""
    return CreditBalanceResponse(balance=float(current_user.credit_balance))

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_credit_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get credit transaction history."""
    transactions = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == current_user.id
    ).order_by(CreditTransaction.created_at.desc()).all()

    return transactions

@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a Stripe checkout session for credit purchase."""

    if request.amount not in stripe_service.CREDIT_PACKAGES:
        available_amounts = list(stripe_service.CREDIT_PACKAGES.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid credit amount. Available: {available_amounts}"
        )

    try:
        success_url = f"{settings.frontend_url}/credits/success"
        cancel_url = f"{settings.frontend_url}/credits"

        session_data = stripe_service.create_checkout_session(
            credit_amount=request.amount,
            user_id=str(current_user.id),
            success_url=success_url,
            cancel_url=cancel_url
        )

        return CheckoutResponse(url=session_data['url'])

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating checkout session: {str(e)}"
        )

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks."""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature header")

    try:
        event = stripe_service.verify_webhook_signature(payload, sig_header)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle different event types
    if event['type'] == 'checkout.session.completed':
        await handle_checkout_completed(event['data']['object'], db)
    elif event['type'] == 'payment_intent.succeeded':
        await handle_payment_succeeded(event['data']['object'], db)
    elif event['type'] == 'payment_intent.payment_failed':
        await handle_payment_failed(event['data']['object'], db)

    return {"status": "success"}

async def handle_checkout_completed(session: dict, db: Session):
    """Handle successful checkout completion."""
    try:
        user_id = session['metadata']['user_id']
        credit_amount = int(session['metadata']['credit_amount'])

        # Find user and add credits
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"Warning: User {user_id} not found for completed checkout")
            return

        # Add credits to user balance
        user.credit_balance += Decimal(credit_amount)

        # Create transaction record
        transaction = CreditTransaction(
            user_id=user.id,
            amount=Decimal(credit_amount),
            type=TransactionType.top_up,
            stripe_charge_id=session.get('payment_intent'),
            description=f"Nákup {credit_amount} kreditů - Stripe checkout"
        )

        db.add(transaction)
        db.commit()

        print(f"Successfully added {credit_amount} credits to user {user.email}")

    except Exception as e:
        print(f"Error handling checkout completion: {e}")
        db.rollback()

async def handle_payment_succeeded(payment_intent: dict, db: Session):
    """Handle successful payment."""
    # Additional logging for successful payments
    print(f"Payment succeeded: {payment_intent['id']}")

async def handle_payment_failed(payment_intent: dict, db: Session):
    """Handle failed payment."""
    # Log failed payments for monitoring
    print(f"Payment failed: {payment_intent['id']}, reason: {payment_intent.get('last_payment_error', {}).get('message', 'Unknown')}")
