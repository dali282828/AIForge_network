from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.model_publishing import PublishingStatus

class PublishingInfoResponse(BaseModel):
    id: int
    model_id: int
    status: PublishingStatus
    publishing_fee_paid: bool
    publishing_fee_amount: Decimal
    listing_fee_amount: Decimal
    listing_fee_paid_until: Optional[datetime]
    next_listing_payment_due: Optional[datetime]
    published_at: Optional[datetime]
    listing_expired_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class PayPublishingFeeRequest(BaseModel):
    model_id: int
    wallet_id: int

class PayListingFeeRequest(BaseModel):
    model_id: int
    wallet_id: int
    months: int = Field(1, ge=1, le=12, description="Number of months to pay for")

class PublishingFeeResponse(BaseModel):
    payment_id: int
    amount: Decimal
    status: str
    message: str

