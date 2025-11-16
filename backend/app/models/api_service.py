from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, Boolean, Integer as IntCol, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class PricingType(str, enum.Enum):
    SUBSCRIPTION = "subscription"  # Monthly subscription
    PAY_PER_REQUEST = "pay_per_request"  # Pay per API call
    HYBRID = "hybrid"  # Both options available

class APIService(Base):
    __tablename__ = "api_services"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Model association
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # API endpoint
    api_endpoint = Column(String, nullable=False)  # e.g., "/api/v1/services/{id}/chat"
    api_key_prefix = Column(String, nullable=False)  # Prefix for generated API keys
    
    # Pricing
    pricing_type = Column(Enum(PricingType), default=PricingType.SUBSCRIPTION, nullable=False)
    subscription_price = Column(Numeric(10, 2), nullable=True)  # Monthly price in USDT
    price_per_request = Column(Numeric(10, 6), nullable=True)  # Price per API call in USDT
    price_per_token = Column(Numeric(10, 8), nullable=True)  # Price per token (for token-based pricing)
    
    # Rate limiting
    rate_limit_per_minute = Column(Integer, default=60, nullable=False)
    rate_limit_per_hour = Column(Integer, default=1000, nullable=False)
    rate_limit_per_day = Column(Integer, default=10000, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_public = Column(Boolean, default=True, nullable=False)  # Visible in marketplace
    
    # Statistics
    total_requests = Column(Integer, default=0, nullable=False)
    total_revenue = Column(Numeric(18, 8), default=0.0, nullable=False)
    total_subscribers = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    model = relationship("Model", foreign_keys=[model_id])
    owner = relationship("User", foreign_keys=[owner_id])
    subscriptions = relationship("APISubscription", back_populates="service", cascade="all, delete-orphan")
    requests = relationship("APIRequest", back_populates="service")

class APISubscription(Base):
    __tablename__ = "api_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("api_services.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # API Key
    api_key = Column(String, unique=True, nullable=False, index=True)  # Generated API key
    api_key_hash = Column(String, nullable=False)  # Hashed version for verification
    
    # Subscription details
    subscription_type = Column(Enum(PricingType), nullable=False)
    credits_remaining = Column(Numeric(18, 8), default=0.0, nullable=False)  # For pay-per-request
    monthly_limit = Column(Integer, nullable=True)  # Monthly request limit (null = unlimited)
    requests_used_this_month = Column(Integer, default=0, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # For subscription-based
    last_reset_at = Column(DateTime(timezone=True), nullable=True)  # For monthly limit reset
    
    # Payment
    last_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    next_billing_date = Column(DateTime(timezone=True), nullable=True)
    
    # Statistics
    total_requests = Column(Integer, default=0, nullable=False)
    total_spent = Column(Numeric(18, 8), default=0.0, nullable=False)
    
    # Timestamps
    purchased_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    service = relationship("APIService", back_populates="subscriptions")
    user = relationship("User", foreign_keys=[user_id])
    requests = relationship("APIRequest", back_populates="subscription")

class APIRequest(Base):
    __tablename__ = "api_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("api_subscriptions.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("api_services.id"), nullable=False, index=True)
    
    # Request data
    request_data = Column(Text, nullable=True)  # JSON string of request
    response_data = Column(Text, nullable=True)  # JSON string of response
    
    # Usage metrics
    tokens_used = Column(Integer, default=0, nullable=False)  # Total tokens (input + output)
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    
    # Cost
    cost = Column(Numeric(18, 8), default=0.0, nullable=False)  # Cost in USDT
    
    # Status
    status = Column(String, default="success", nullable=False)  # "success", "error", "rate_limited"
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    subscription = relationship("APISubscription", back_populates="requests")
    service = relationship("APIService", back_populates="requests")

