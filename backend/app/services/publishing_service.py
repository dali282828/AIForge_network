"""
Publishing Service for managing model publishing fees and listing fees
"""
from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.model import Model
from app.models.model_publishing import ModelPublishing, PublishingStatus
from app.models.wallet import UserWallet
from app.models.payment import Payment, PaymentStatus, PaymentType
from app.services.payment_service import PaymentService
from app.core.config import settings

class PublishingService:
    """Service for managing model publishing and listing fees"""
    
    @staticmethod
    def get_publishing_info(model_id: int, db: Session) -> Optional[ModelPublishing]:
        """Get publishing information for a model"""
        return db.query(ModelPublishing).filter(ModelPublishing.model_id == model_id).first()
    
    @staticmethod
    def initialize_publishing(model_id: int, db: Session) -> ModelPublishing:
        """Initialize publishing record for a model"""
        existing = PublishingService.get_publishing_info(model_id, db)
        if existing:
            return existing
        
        publishing = ModelPublishing(
            model_id=model_id,
            status=PublishingStatus.DRAFT,
            publishing_fee_amount=Decimal(str(settings.MODEL_PUBLISHING_FEE)),
            listing_fee_amount=Decimal(str(settings.MODEL_LISTING_FEE))
        )
        
        db.add(publishing)
        db.commit()
        db.refresh(publishing)
        
        return publishing
    
    @staticmethod
    def pay_publishing_fee(
        model_id: int,
        wallet_id: int,
        db: Session
    ) -> Payment:
        """Create payment for publishing fee"""
        publishing = PublishingService.get_publishing_info(model_id, db)
        if not publishing:
            publishing = PublishingService.initialize_publishing(model_id, db)
        
        if publishing.publishing_fee_paid:
            raise ValueError("Publishing fee already paid")
        
        # Get wallet
        wallet = db.query(UserWallet).filter(UserWallet.id == wallet_id).first()
        if not wallet:
            raise ValueError("Wallet not found")
        
        # Verify model ownership
        model = db.query(Model).filter(Model.id == model_id).first()
        if not model:
            raise ValueError("Model not found")
        
        if model.owner_id != wallet.user_id:
            raise ValueError("Not authorized to publish this model")
        
        # Get platform wallet
        platform_wallet = PaymentService.get_platform_wallet(wallet.network)
        
        # Create payment
        payment = PaymentService.create_payment(
            db=db,
            payment_type=PaymentType.MODEL_PURCHASE,  # Using MODEL_PURCHASE for publishing fee
            amount=publishing.publishing_fee_amount,
            from_wallet_id=wallet_id,
            from_address=wallet.wallet_address,
            to_address=platform_wallet,
            network=wallet.network,
            model_id=model_id,
            metadata={"fee_type": "publishing", "model_id": model_id}
        )
        
        # Update publishing record
        publishing.publishing_fee_payment_id = payment.id
        publishing.status = PublishingStatus.PENDING_PAYMENT
        db.commit()
        
        return payment
    
    @staticmethod
    def confirm_publishing_fee(model_id: int, payment_id: int, db: Session) -> ModelPublishing:
        """Confirm publishing fee payment and publish model"""
        publishing = PublishingService.get_publishing_info(model_id, db)
        if not publishing:
            raise ValueError("Publishing record not found")
        
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment or payment.status != PaymentStatus.CONFIRMED:
            raise ValueError("Payment not confirmed")
        
        # Update publishing status
        publishing.publishing_fee_paid = True
        publishing.status = PublishingStatus.PUBLISHED
        publishing.published_at = datetime.utcnow()
        
        # Set initial listing period (30 days)
        publishing.listing_fee_paid_until = datetime.utcnow() + timedelta(days=30)
        publishing.next_listing_payment_due = publishing.listing_fee_paid_until
        
        db.commit()
        db.refresh(publishing)
        
        return publishing
    
    @staticmethod
    def pay_listing_fee(
        model_id: int,
        wallet_id: int,
        months: int = 1,
        db: Session = None
    ) -> Payment:
        """Create payment for listing fee"""
        publishing = PublishingService.get_publishing_info(model_id, db)
        if not publishing:
            raise ValueError("Model not published")
        
        if publishing.status != PublishingStatus.PUBLISHED:
            raise ValueError("Model must be published first")
        
        # Get wallet
        wallet = db.query(UserWallet).filter(UserWallet.id == wallet_id).first()
        if not wallet:
            raise ValueError("Wallet not found")
        
        # Verify model ownership
        model = db.query(Model).filter(Model.id == model_id).first()
        if not model:
            raise ValueError("Model not found")
        
        if model.owner_id != wallet.user_id:
            raise ValueError("Not authorized")
        
        # Calculate total amount
        total_amount = publishing.listing_fee_amount * Decimal(str(months))
        
        # Get platform wallet
        platform_wallet = PaymentService.get_platform_wallet(wallet.network)
        
        # Create payment
        payment = PaymentService.create_payment(
            db=db,
            payment_type=PaymentType.MODEL_PURCHASE,  # Using MODEL_PURCHASE for listing fee
            amount=total_amount,
            from_wallet_id=wallet_id,
            from_address=wallet.wallet_address,
            to_address=platform_wallet,
            network=wallet.network,
            model_id=model_id,
            metadata={"fee_type": "listing", "model_id": model_id, "months": months}
        )
        
        # Update publishing record
        publishing.last_listing_payment_id = payment.id
        db.commit()
        
        return payment
    
    @staticmethod
    def confirm_listing_fee(model_id: int, payment_id: int, db: Session) -> ModelPublishing:
        """Confirm listing fee payment and extend listing period"""
        publishing = PublishingService.get_publishing_info(model_id, db)
        if not publishing:
            raise ValueError("Publishing record not found")
        
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment or payment.status != PaymentStatus.CONFIRMED:
            raise ValueError("Payment not confirmed")
        
        # Get months from metadata
        months = payment.payment_metadata.get("months", 1) if payment.payment_metadata else 1
        
        # Extend listing period
        current_until = publishing.listing_fee_paid_until or datetime.utcnow()
        publishing.listing_fee_paid_until = current_until + timedelta(days=30 * months)
        publishing.next_listing_payment_due = publishing.listing_fee_paid_until
        
        # Update status if it was expired
        if publishing.status == PublishingStatus.LISTING_EXPIRED:
            publishing.status = PublishingStatus.PUBLISHED
        
        db.commit()
        db.refresh(publishing)
        
        return publishing
    
    @staticmethod
    def check_listing_expiry(db: Session):
        """Check and update expired listings (should be run periodically)"""
        now = datetime.utcnow()
        grace_period = timedelta(days=settings.MODEL_LISTING_GRACE_PERIOD_DAYS)
        
        # Find expired listings (past grace period)
        expired_listings = db.query(ModelPublishing).filter(
            ModelPublishing.status == PublishingStatus.PUBLISHED,
            ModelPublishing.listing_fee_paid_until < (now - grace_period)
        ).all()
        
        for publishing in expired_listings:
            publishing.status = PublishingStatus.LISTING_EXPIRED
            publishing.listing_expired_at = now
        
        db.commit()
        
        return len(expired_listings)
    
    @staticmethod
    def get_first_model_free(user_id: int, db: Session) -> bool:
        """Check if user's first model is free"""
        # Count user's published models
        user_models = db.query(Model).filter(Model.owner_id == user_id).all()
        published_count = 0
        
        for model in user_models:
            publishing = PublishingService.get_publishing_info(model.id, db)
            if publishing and publishing.publishing_fee_paid:
                published_count += 1
        
        return published_count == 0  # First model is free

