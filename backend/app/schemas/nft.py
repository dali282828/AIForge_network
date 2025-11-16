"""
NFT Share Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class NFTShareResponse(BaseModel):
    """NFT Share Response"""
    id: int
    token_id: int
    owner_wallet_address: str
    owner_user_id: Optional[int] = None
    share_number: int
    minted_at: datetime
    contract_address: str
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    is_active: bool
    
    class Config:
        from_attributes = True

class MintNFTRequest(BaseModel):
    """Request to mint an NFT share"""
    wallet_address: str = Field(..., description="Tron wallet address to mint NFT to")
    # User pays $0.10 gas fee directly to Tron network

class MintNFTResponse(BaseModel):
    """Response after minting NFT"""
    nft_share_id: int
    token_id: int
    contract_address: str
    gas_fee_estimate: str = Field(..., description="Estimated gas fee (~$0.10)")
    message: str = Field(..., description="Instructions for user to pay gas fee and mint")

class NFTRewardResponse(BaseModel):
    """NFT Reward Response"""
    id: int
    nft_share_id: int
    period: str  # "YYYY-MM"
    reward_amount: str
    reward_percentage: str
    total_pool_amount: str
    total_shares: int
    payment_tx_hash: Optional[str] = None
    payment_status: str
    distributed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class NFTRewardPoolResponse(BaseModel):
    """NFT Reward Pool Response"""
    id: int
    period: str  # "YYYY-MM"
    subscription_revenue_share: str
    api_revenue_share: str
    total_pool: str
    total_shares: int
    reward_per_share: str
    is_distributed: bool
    calculated_at: datetime
    distributed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class MyNFTsResponse(BaseModel):
    """User's NFTs Response"""
    nfts: List[NFTShareResponse]
    total_rewards: str
    total_rewards_count: int

class NFTStatsResponse(BaseModel):
    """NFT Statistics Response"""
    total_shares: int
    active_shares: int
    total_holders: int
    current_period_pool: Optional[str] = None
    reward_per_share: Optional[str] = None

