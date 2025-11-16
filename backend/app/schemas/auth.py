from pydantic import BaseModel, Field
from typing import Optional
from app.models.wallet import WalletNetwork, WalletType

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: Optional[int] = None
    is_admin: Optional[bool] = None
    wallet_address: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None

class WalletLoginRequest(BaseModel):
    wallet_address: str = Field(..., description="Wallet address")
    network: WalletNetwork
    wallet_type: WalletType
    signature: str = Field(..., description="Signature of the authentication message")
    message: str = Field(..., description="Message that was signed")
    email: Optional[str] = Field(None, description="Optional email for first-time registration")
    username: Optional[str] = Field(None, description="Optional username for first-time registration")
    full_name: Optional[str] = Field(None, description="Optional full name for first-time registration")

class WalletAuthMessage(BaseModel):
    message: str
    wallet_address: str
    timestamp: int

