from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class PublishingStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_PAYMENT = "pending_payment"
    PUBLISHED = "published"
    LISTING_EXPIRED = "listing_expired"
    SUSPENDED = "suspended"

class ModelPublishing(Base):
    __tablename__ = "model_publishing"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False, unique=True, index=True)
    
    # Publishing status
    status = Column(Enum(PublishingStatus), default=PublishingStatus.DRAFT, nullable=False, index=True)
    
    # Fees
    publishing_fee_paid = Column(Boolean, default=False, nullable=False)
    publishing_fee_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    publishing_fee_amount = Column(Numeric(10, 2), default=5.00, nullable=False)  # $5.00
    
    # Listing fees
    listing_fee_amount = Column(Numeric(10, 2), default=2.00, nullable=False)  # $2.00/month
    listing_fee_paid_until = Column(DateTime(timezone=True), nullable=True)  # Paid until this date
    last_listing_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    next_listing_payment_due = Column(DateTime(timezone=True), nullable=True)  # Next payment due date
    
    # Publishing dates
    published_at = Column(DateTime(timezone=True), nullable=True)
    listing_expired_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    model = relationship("Model", foreign_keys=[model_id])
    publishing_payment = relationship("Payment", foreign_keys=[publishing_fee_payment_id])
    listing_payment = relationship("Payment", foreign_keys=[last_listing_payment_id])

class GroupRevenueSplit(Base):
    __tablename__ = "group_revenue_splits"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False, index=True)
    
    # Split configuration (JSON: {user_id: percentage})
    # Example: {"1": 50.0, "2": 30.0, "3": 20.0} = 50%, 30%, 20%
    split_config = Column(String, nullable=False)  # JSON string
    
    # Minimum percentage per member (default 5%)
    min_percentage_per_member = Column(Numeric(5, 2), default=5.00, nullable=False)
    
    # Usage-based bonus (optional, 0-20%)
    usage_bonus_percent = Column(Numeric(5, 2), default=0.00, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    model = relationship("Model", foreign_keys=[model_id])
    group = relationship("Group", foreign_keys=[group_id])

class RevenueDistribution(Base):
    __tablename__ = "revenue_distributions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False, index=True)
    
    # Period
    period_year = Column(Integer, nullable=False, index=True)
    period_month = Column(Integer, nullable=False, index=True)
    
    # Revenue
    total_revenue = Column(Numeric(18, 8), nullable=False)
    platform_fee = Column(Numeric(18, 8), nullable=False)
    model_pool = Column(Numeric(18, 8), nullable=False)
    
    # Distribution details (JSON: {user_id: amount})
    distribution_details = Column(String, nullable=False)  # JSON string
    
    # Status
    is_distributed = Column(Boolean, default=False, nullable=False)
    distributed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    model = relationship("Model", foreign_keys=[model_id])

