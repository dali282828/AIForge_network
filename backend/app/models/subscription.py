from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PENDING = "pending"
    PAST_DUE = "past_due"

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Plan details
    plan_type = Column(Enum(SubscriptionPlan), nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)  # Monthly price in USDT
    currency = Column(String, default="USDT", nullable=False)
    
    # Status
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.PENDING, nullable=False, index=True)
    
    # Billing
    auto_renew = Column(Boolean, default=True, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Limits (stored as JSON for flexibility)
    request_limit = Column(Integer, nullable=True)  # Monthly request limit (null = unlimited)
    requests_used = Column(Integer, default=0, nullable=False)  # Current month usage
    
    # Payment tracking
    last_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    next_billing_date = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    payments = relationship("Payment", foreign_keys="Payment.subscription_id", backref="subscription_payments")

