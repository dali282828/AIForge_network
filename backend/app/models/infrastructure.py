"""
Infrastructure Investment Models
Allows investors to contribute GPU/CPU resources from cloud providers
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import NUMERIC, JSON
import enum
from app.core.database import Base

class InfrastructureProvider(str, enum.Enum):
    """Cloud infrastructure providers"""
    AWS = "aws"
    VULTR = "vultr"
    GCP = "gcp"
    RUNPOD = "runpod"
    VAST_AI = "vast_ai"
    OTHER = "other"

class InfrastructureType(str, enum.Enum):
    """Infrastructure resource types"""
    GPU = "gpu"
    CPU = "cpu"
    BOTH = "both"

class InfrastructureStatus(str, enum.Enum):
    """Infrastructure status"""
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class InfrastructureInvestment(Base):
    """Infrastructure investment - GPU/CPU resources contributed by investors"""
    __tablename__ = "infrastructure_investments"
    
    id = Column(Integer, primary_key=True, index=True)
    investor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True, index=True)  # Optional: pool with group
    
    # Infrastructure Details
    provider = Column(Enum(InfrastructureProvider), nullable=False)
    infrastructure_type = Column(Enum(InfrastructureType), nullable=False)
    resource_specs = Column(JSON, nullable=False)  # {gpu_type, cpu_cores, memory, etc.}
    
    # Connection Details (encrypted in production)
    connection_info = Column(JSON, nullable=True)  # API keys, endpoints, etc. (encrypted)
    
    # Status
    status = Column(Enum(InfrastructureStatus), default=InfrastructureStatus.PENDING, nullable=False)
    
    # Allocation
    allocated_to_model_id = Column(Integer, ForeignKey("models.id"), nullable=True, index=True)
    allocated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Earnings
    total_earnings = Column(NUMERIC(18, 8), default=0, nullable=False)
    last_payout_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    investor = relationship("User", foreign_keys=[investor_id])
    group = relationship("Group", foreign_keys=[group_id])
    allocated_model = relationship("Model", foreign_keys=[allocated_to_model_id])
    usage_records = relationship("InfrastructureUsage", back_populates="investment", cascade="all, delete-orphan")
    payouts = relationship("InfrastructurePayout", back_populates="investment", cascade="all, delete-orphan")

class InfrastructureUsage(Base):
    """Track infrastructure usage and earnings"""
    __tablename__ = "infrastructure_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    investment_id = Column(Integer, ForeignKey("infrastructure_investments.id"), nullable=False, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True, index=True)
    
    # Usage Period
    period_year = Column(Integer, nullable=False, index=True)
    period_month = Column(Integer, nullable=False, index=True)
    
    # Usage Metrics
    hours_used = Column(NUMERIC(10, 2), nullable=False, default=0)
    requests_processed = Column(Integer, nullable=False, default=0)
    tokens_processed = Column(Integer, nullable=False, default=0)
    
    # Earnings
    earnings = Column(NUMERIC(18, 8), nullable=False, default=0)
    earnings_rate = Column(NUMERIC(10, 4), nullable=False)  # Earnings per hour or per request
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    investment = relationship("InfrastructureInvestment", back_populates="usage_records")
    model = relationship("Model", foreign_keys=[model_id])
    job = relationship("Job", foreign_keys=[job_id])

class InfrastructurePayout(Base):
    """Track payouts to infrastructure investors"""
    __tablename__ = "infrastructure_payouts"
    
    id = Column(Integer, primary_key=True, index=True)
    investment_id = Column(Integer, ForeignKey("infrastructure_investments.id"), nullable=False, index=True)
    
    # Payout Period
    period_year = Column(Integer, nullable=False, index=True)
    period_month = Column(Integer, nullable=False, index=True)
    
    # Payout Amount
    amount = Column(NUMERIC(18, 8), nullable=False)
    currency = Column(String, default="USDT", nullable=False)
    
    # Payment Info
    payment_tx_hash = Column(String, nullable=True)
    payment_status = Column(String, default="pending", nullable=False)  # pending, sent, confirmed, failed
    to_wallet_address = Column(String, nullable=False)
    network = Column(String, default="tron", nullable=False)  # tron or ethereum
    
    # Timestamps
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    investment = relationship("InfrastructureInvestment", back_populates="payouts")

