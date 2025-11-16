"""
Subscription Service for managing user subscriptions
Handles subscription creation, renewal, cancellation, and plan management
"""
from typing import Optional
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from app.models.user import User
from app.models.wallet import UserWallet
from app.services.payment_service import PaymentService
from app.models.payment import PaymentType, PaymentStatus
from app.core.config import settings

# Subscription plan configuration
SUBSCRIPTION_PLANS = {
    SubscriptionPlan.FREE: {
        "name": "Free",
        "price": Decimal("0.00"),
        "request_limit": 100,
        "features": ["5 models", "100 requests/month", "Basic support"]
    },
    SubscriptionPlan.BASIC: {
        "name": "Basic",
        "price": Decimal("10.00"),
        "request_limit": 1000,
        "features": ["Unlimited models", "1,000 requests/month", "Full marketplace access"]
    },
    SubscriptionPlan.PRO: {
        "name": "Pro",
        "price": Decimal("30.00"),
        "request_limit": 10000,
        "features": ["Unlimited models", "10,000 requests/month", "Priority support", "API access"]
    },
    SubscriptionPlan.ENTERPRISE: {
        "name": "Enterprise",
        "price": Decimal("100.00"),
        "request_limit": None,  # Unlimited
        "features": ["Unlimited models", "Unlimited requests", "Priority support", "API access", "Custom features"]
    }
}

class SubscriptionService:
    """Service for managing subscriptions"""
    
    @staticmethod
    def get_plan_info(plan_type: SubscriptionPlan) -> dict:
        """Get subscription plan information"""
        return SUBSCRIPTION_PLANS.get(plan_type, SUBSCRIPTION_PLANS[SubscriptionPlan.FREE])
    
    @staticmethod
    def get_user_subscription(db: Session, user_id: int) -> Optional[Subscription]:
        """Get active subscription for a user"""
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING])
        ).first()
        return subscription
    
    @staticmethod
    def create_subscription(
        db: Session,
        user_id: int,
        plan_type: SubscriptionPlan,
        wallet_id: int,
        auto_renew: bool = True
    ) -> Subscription:
        """Create a new subscription"""
        # Check if user already has an active subscription
        existing = SubscriptionService.get_user_subscription(db, user_id)
        if existing and existing.status == SubscriptionStatus.ACTIVE:
            # Upgrade/downgrade existing subscription
            existing.plan_type = plan_type
            plan_info = SubscriptionService.get_plan_info(plan_type)
            existing.price = plan_info["price"]
            existing.request_limit = plan_info["request_limit"]
            existing.auto_renew = auto_renew
            db.commit()
            db.refresh(existing)
            return existing
        
        # Get wallet
        wallet = db.query(UserWallet).filter(UserWallet.id == wallet_id).first()
        if not wallet or wallet.user_id != user_id:
            raise ValueError("Invalid wallet")
        
        # Get plan info
        plan_info = SubscriptionService.get_plan_info(plan_type)
        
        # Create subscription
        now = datetime.utcnow()
        expires_at = now + timedelta(days=30) if plan_type != SubscriptionPlan.FREE else None
        
        subscription = Subscription(
            user_id=user_id,
            plan_type=plan_type,
            price=plan_info["price"],
            status=SubscriptionStatus.PENDING if plan_type != SubscriptionPlan.FREE else SubscriptionStatus.ACTIVE,
            auto_renew=auto_renew,
            started_at=now if plan_type == SubscriptionPlan.FREE else None,
            expires_at=expires_at,
            request_limit=plan_info["request_limit"],
            requests_used=0,
            next_billing_date=expires_at if plan_type != SubscriptionPlan.FREE else None
        )
        
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        
        # Create payment for paid plans
        if plan_type != SubscriptionPlan.FREE and plan_info["price"] > 0:
            from app.models.wallet import WalletNetwork
            platform_wallet = PaymentService.get_platform_wallet(wallet.network)
            
            payment = PaymentService.create_payment(
                db=db,
                payment_type=PaymentType.SUBSCRIPTION,
                amount=plan_info["price"],
                from_wallet_id=wallet_id,
                from_address=wallet.wallet_address,
                to_address=platform_wallet,
                network=wallet.network,
                subscription_id=subscription.id
            )
            
            subscription.last_payment_id = payment.id
            db.commit()
        
        return subscription
    
    @staticmethod
    def cancel_subscription(db: Session, subscription_id: int, user_id: int) -> Subscription:
        """Cancel a subscription"""
        subscription = db.query(Subscription).filter(
            Subscription.id == subscription_id,
            Subscription.user_id == user_id
        ).first()
        
        if not subscription:
            raise ValueError("Subscription not found")
        
        subscription.status = SubscriptionStatus.CANCELLED
        subscription.auto_renew = False
        subscription.cancelled_at = datetime.utcnow()
        
        db.commit()
        db.refresh(subscription)
        
        return subscription
    
    @staticmethod
    def renew_subscription(db: Session, subscription_id: int) -> Subscription:
        """Renew a subscription (called after payment confirmation)"""
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            raise ValueError("Subscription not found")
        
        now = datetime.utcnow()
        expires_at = now + timedelta(days=30)
        
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.started_at = now
        subscription.expires_at = expires_at
        subscription.next_billing_date = expires_at
        subscription.requests_used = 0  # Reset monthly usage
        
        db.commit()
        db.refresh(subscription)
        
        return subscription
    
    @staticmethod
    def check_and_renew_subscription(db: Session, subscription_id: int) -> bool:
        """Check if subscription needs renewal and process it"""
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            return False
        
        # Check if subscription is expired
        if subscription.expires_at and subscription.expires_at < datetime.utcnow():
            if subscription.auto_renew:
                # Check if payment is confirmed
                if subscription.last_payment_id:
                    payment = db.query(Payment).filter(Payment.id == subscription.last_payment_id).first()
                    if payment and payment.status == PaymentStatus.CONFIRMED:
                        SubscriptionService.renew_subscription(db, subscription_id)
                        return True
                    else:
                        subscription.status = SubscriptionStatus.PAST_DUE
                        db.commit()
                else:
                    subscription.status = SubscriptionStatus.EXPIRED
                    db.commit()
            else:
                subscription.status = SubscriptionStatus.EXPIRED
                db.commit()
        
        return False
    
    @staticmethod
    def can_make_request(db: Session, user_id: int) -> bool:
        """Check if user can make a request based on subscription"""
        subscription = SubscriptionService.get_user_subscription(db, user_id)
        
        if not subscription:
            return False
        
        # Check if subscription is active
        if subscription.status != SubscriptionStatus.ACTIVE:
            SubscriptionService.check_and_renew_subscription(db, subscription.id)
            subscription = db.query(Subscription).filter(Subscription.id == subscription.id).first()
            if subscription.status != SubscriptionStatus.ACTIVE:
                return False
        
        # Check request limit
        if subscription.request_limit is not None:
            if subscription.requests_used >= subscription.request_limit:
                return False
        
        return True
    
    @staticmethod
    def increment_request_count(db: Session, user_id: int):
        """Increment request count for user's subscription"""
        subscription = SubscriptionService.get_user_subscription(db, user_id)
        if subscription:
            subscription.requests_used += 1
            db.commit()

