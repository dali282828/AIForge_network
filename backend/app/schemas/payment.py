from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from app.models.payment import PaymentType, PaymentStatus
from app.models.wallet import WalletNetwork

class PaymentCreate(BaseModel):
    payment_type: PaymentType
    amount: Decimal = Field(..., gt=0, description="Amount in USDT")
    from_wallet_id: int
    network: WalletNetwork
    currency: str = "USDT"
    subscription_id: Optional[int] = None
    job_id: Optional[int] = None
    model_id: Optional[int] = None
    api_subscription_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class PaymentVerify(BaseModel):
    payment_id: int
    tx_hash: str

class PaymentResponse(BaseModel):
    id: int
    payment_type: PaymentType
    status: PaymentStatus
    amount: Decimal
    currency: str
    network: str
    platform_fee_percent: Decimal
    platform_fee_amount: Decimal
    net_amount: Decimal
    from_address: str
    to_address: str
    tx_hash: Optional[str]
    block_number: Optional[int]
    confirmations: int
    required_confirmations: int
    created_at: datetime
    confirmed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class PaymentHistory(BaseModel):
    payments: list[PaymentResponse]
    total: int
    page: int
    page_size: int

