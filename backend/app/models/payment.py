from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMING = "confirming"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class PaymentType(str, enum.Enum):
    SUBSCRIPTION = "subscription"
    JOB = "job"
    MODEL_PURCHASE = "model_purchase"
    API_SUBSCRIPTION = "api_subscription"
    API_USAGE = "api_usage"

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Payment details
    payment_type = Column(Enum(PaymentType), nullable=False, index=True)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    
    # Amounts
    amount = Column(Numeric(18, 8), nullable=False)  # USDT amount (supports 8 decimals)
    currency = Column(String, default="USDT", nullable=False)
    network = Column(String, nullable=False)  # "ethereum" or "tron"
    
    # Platform fees
    platform_fee_percent = Column(Numeric(5, 4), nullable=False, default=0.0)  # e.g., 0.30 for 30%
    platform_fee_amount = Column(Numeric(18, 8), nullable=False, default=0.0)
    net_amount = Column(Numeric(18, 8), nullable=False)  # Amount after platform fee
    
    # Wallet addresses
    from_wallet_id = Column(Integer, ForeignKey("user_wallets.id"), nullable=False)
    from_address = Column(String, nullable=False, index=True)
    to_address = Column(String, nullable=False, index=True)  # Platform or seller wallet
    
    # Blockchain transaction
    tx_hash = Column(String, unique=True, nullable=True, index=True)
    block_number = Column(Integer, nullable=True)
    block_hash = Column(String, nullable=True)
    confirmations = Column(Integer, default=0, nullable=False)
    required_confirmations = Column(Integer, default=3, nullable=False)  # 3 for most cases
    
    # Related entities (polymorphic)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=True)
    api_subscription_id = Column(Integer, ForeignKey("api_subscriptions.id"), nullable=True)
    
    # Metadata
    payment_metadata = Column(JSON, nullable=True)  # Additional payment data
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    wallet = relationship("UserWallet", back_populates="payments", foreign_keys=[from_wallet_id])
    subscription = relationship("Subscription", foreign_keys=[subscription_id])
    job = relationship("Job", foreign_keys=[job_id])
    model = relationship("Model", foreign_keys=[model_id])
    api_subscription = relationship("APISubscription", foreign_keys=[api_subscription_id])

