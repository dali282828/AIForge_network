from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.subscription import SubscriptionPlan, SubscriptionStatus

class SubscriptionCreate(BaseModel):
    plan_type: SubscriptionPlan
    wallet_id: int = Field(..., description="Wallet ID to use for payment")
    auto_renew: bool = True

class SubscriptionUpdate(BaseModel):
    auto_renew: Optional[bool] = None
    plan_type: Optional[SubscriptionPlan] = None

class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    plan_type: SubscriptionPlan
    price: Decimal
    currency: str
    status: SubscriptionStatus
    auto_renew: bool
    started_at: Optional[datetime]
    expires_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    request_limit: Optional[int]
    requests_used: int
    next_billing_date: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubscriptionPlanInfo(BaseModel):
    plan_type: SubscriptionPlan
    name: str
    price: Decimal
    request_limit: Optional[int]
    features: list[str]

