from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.wallet import WalletNetwork, WalletType

class WalletConnect(BaseModel):
    wallet_address: str = Field(..., description="Wallet address")
    network: WalletNetwork
    wallet_type: WalletType
    signature: Optional[str] = Field(None, description="Signature for verification")

class WalletVerify(BaseModel):
    wallet_id: int
    signature: str
    message: str

class UserWalletResponse(BaseModel):
    id: int
    user_id: int
    wallet_address: str
    network: WalletNetwork
    wallet_type: WalletType
    is_verified: bool
    verified_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class AdminWalletCreate(BaseModel):
    wallet_address: str
    network: WalletNetwork
    notes: Optional[str] = None

class AdminWalletResponse(BaseModel):
    id: int
    wallet_address: str
    network: WalletNetwork
    is_active: bool
    added_at: datetime
    notes: Optional[str]
    
    class Config:
        from_attributes = True

