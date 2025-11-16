from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.api_service import PricingType

class APIServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    model_id: int
    pricing_type: PricingType = PricingType.SUBSCRIPTION
    subscription_price: Optional[Decimal] = None
    price_per_request: Optional[Decimal] = None
    price_per_token: Optional[Decimal] = None
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000
    rate_limit_per_day: int = 10000
    is_public: bool = True

class APIServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    pricing_type: Optional[PricingType] = None
    subscription_price: Optional[Decimal] = None
    price_per_request: Optional[Decimal] = None
    price_per_token: Optional[Decimal] = None
    rate_limit_per_minute: Optional[int] = None
    rate_limit_per_hour: Optional[int] = None
    rate_limit_per_day: Optional[int] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None

class APIServiceResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    model_id: int
    owner_id: int
    api_endpoint: str
    pricing_type: PricingType
    subscription_price: Optional[Decimal]
    price_per_request: Optional[Decimal]
    price_per_token: Optional[Decimal]
    rate_limit_per_minute: int
    rate_limit_per_hour: int
    rate_limit_per_day: int
    is_active: bool
    is_public: bool
    total_requests: int
    total_revenue: Decimal
    total_subscribers: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class APISubscriptionCreate(BaseModel):
    service_id: int
    wallet_id: int
    subscription_type: PricingType

class APISubscriptionResponse(BaseModel):
    id: int
    service_id: int
    user_id: int
    api_key: str
    subscription_type: PricingType
    credits_remaining: Decimal
    monthly_limit: Optional[int]
    requests_used_this_month: int
    is_active: bool
    expires_at: Optional[datetime]
    total_requests: int
    total_spent: Decimal
    purchased_at: datetime
    
    class Config:
        from_attributes = True

class OpenAICompletionRequest(BaseModel):
    model: str
    messages: List[dict] = Field(..., description="List of messages")
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    top_p: Optional[float] = 1.0
    frequency_penalty: Optional[float] = 0.0
    presence_penalty: Optional[float] = 0.0
    stream: Optional[bool] = False

class OpenAICompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[dict]
    usage: dict

