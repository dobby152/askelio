# Stripe integration utilities
import stripe
import logging
from typing import Dict, Any, Optional
from decimal import Decimal

from config import settings

# Configure Stripe
stripe.api_key = settings.stripe_secret_key

logger = logging.getLogger('stripe_integration')

class StripeService:
    """Service for handling Stripe operations."""

    # Credit packages with prices in Czech Koruna (in cents)
    CREDIT_PACKAGES = {
        100: {
            "price_czk": 15000,  # 150 CZK
            "name": "100 AI kreditů",
            "description": "Balíček 100 kreditů pro AI zpracování dokumentů"
        },
        500: {
            "price_czk": 70000,  # 700 CZK
            "name": "500 AI kreditů",
            "description": "Balíček 500 kreditů pro AI zpracování dokumentů"
        },
        1000: {
            "price_czk": 125000,  # 1250 CZK
            "name": "1000 AI kreditů",
            "description": "Balíček 1000 kreditů pro AI zpracování dokumentů"
        }
    }

    @classmethod
    def create_checkout_session(
        cls,
        credit_amount: int,
        user_id: str,
        success_url: str,
        cancel_url: str
    ) -> Dict[str, Any]:
        """Create a Stripe checkout session for credit purchase."""

        if credit_amount not in cls.CREDIT_PACKAGES:
            raise ValueError(f"Invalid credit amount: {credit_amount}")

        package = cls.CREDIT_PACKAGES[credit_amount]

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'czk',
                        'product_data': {
                            'name': package["name"],
                            'description': package["description"],
                            'images': [f"{settings.frontend_url}/logo.png"]  # Optional logo
                        },
                        'unit_amount': package["price_czk"],
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'user_id': user_id,
                    'credit_amount': str(credit_amount),
                    'package_type': 'credit_topup'
                },
                # Optional: Set up automatic tax calculation
                automatic_tax={'enabled': True} if settings.environment == 'production' else None,
                # Optional: Customer email prefill
                customer_email=None,  # Can be set if available
                # Payment intent data for better tracking
                payment_intent_data={
                    'metadata': {
                        'user_id': user_id,
                        'credit_amount': str(credit_amount)
                    }
                }
            )

            logger.info(f"Created checkout session {session.id} for user {user_id}, {credit_amount} credits")

            return {
                'session_id': session.id,
                'url': session.url,
                'amount': package["price_czk"],
                'currency': 'czk'
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating checkout session: {e}")
            raise

    @classmethod
    def verify_webhook_signature(cls, payload: bytes, signature: str) -> Dict[str, Any]:
        """Verify Stripe webhook signature and return event."""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, settings.stripe_webhook_secret
            )
            logger.info(f"Verified webhook event: {event['type']}")
            return event
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise

    @classmethod
    def get_payment_intent(cls, payment_intent_id: str) -> Dict[str, Any]:
        """Retrieve payment intent details."""
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return payment_intent
        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving payment intent {payment_intent_id}: {e}")
            raise

    @classmethod
    def create_customer(cls, email: str, name: Optional[str] = None) -> str:
        """Create a Stripe customer."""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={'source': 'askelio'}
            )
            logger.info(f"Created Stripe customer {customer.id} for {email}")
            return customer.id
        except stripe.error.StripeError as e:
            logger.error(f"Error creating customer for {email}: {e}")
            raise

    @classmethod
    def get_customer_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        """Find customer by email."""
        try:
            customers = stripe.Customer.list(email=email, limit=1)
            if customers.data:
                return customers.data[0]
            return None
        except stripe.error.StripeError as e:
            logger.error(f"Error finding customer by email {email}: {e}")
            return None

# Global service instance
stripe_service = StripeService()
