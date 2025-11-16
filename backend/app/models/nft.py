"""
NFT Share Models for Platform Ownership and Revenue Sharing
Users can mint NFTs (TRC-721 on Tron) to become platform shareholders
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import NUMERIC, JSON
import enum
from app.core.database import Base

class NFTShare(Base):
    """NFT Share - Represents a platform ownership share"""
    __tablename__ = "nft_shares"
    
    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, unique=True, nullable=False, index=True)  # NFT token ID on blockchain
    owner_wallet_address = Column(String, nullable=False, index=True)  # Tron wallet address
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Optional: linked user account
    
    # NFT Metadata
    share_number = Column(Integer, nullable=False)  # Sequential share number (1, 2, 3, ...)
    minted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Blockchain Info
    contract_address = Column(String, nullable=False)  # TRC-721 contract address
    tx_hash = Column(String, nullable=True)  # Minting transaction hash
    block_number = Column(Integer, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)  # Can be burned/transferred
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_user_id])
    rewards = relationship("NFTReward", back_populates="nft_share", cascade="all, delete-orphan")

class NFTReward(Base):
    """NFT Reward Distribution - Tracks rewards distributed to NFT holders"""
    __tablename__ = "nft_rewards"
    
    id = Column(Integer, primary_key=True, index=True)
    nft_share_id = Column(Integer, ForeignKey("nft_shares.id"), nullable=False, index=True)
    
    # Reward Period
    period_year = Column(Integer, nullable=False, index=True)
    period_month = Column(Integer, nullable=False, index=True)
    
    # Reward Amount
    reward_amount = Column(NUMERIC(18, 8), nullable=False)  # USDT amount
    reward_percentage = Column(NUMERIC(5, 2), nullable=False)  # Percentage of total rewards pool
    
    # Distribution Details
    total_pool_amount = Column(NUMERIC(18, 8), nullable=False)  # Total rewards pool for this period
    total_shares = Column(Integer, nullable=False)  # Total active shares at distribution time
    
    # Payment Info
    payment_tx_hash = Column(String, nullable=True)  # USDT TRC-20 transaction hash
    payment_status = Column(String, default="pending", nullable=False)  # pending, sent, confirmed, failed
    
    # Timestamps
    distributed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    nft_share = relationship("NFTShare", back_populates="rewards")

class NFTRewardPool(Base):
    """NFT Reward Pool - Tracks total rewards pool for each period"""
    __tablename__ = "nft_reward_pools"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Period
    period_year = Column(Integer, nullable=False, index=True)
    period_month = Column(Integer, nullable=False, index=True)
    
    # Pool Amounts
    subscription_revenue_share = Column(NUMERIC(18, 8), nullable=False, default=0)  # 30% of subscription revenue
    api_revenue_share = Column(NUMERIC(18, 8), nullable=False, default=0)  # 10% of API revenue
    total_pool = Column(NUMERIC(18, 8), nullable=False, default=0)  # Total pool (subscription + API)
    
    # Distribution Status
    total_shares = Column(Integer, nullable=False, default=0)  # Total active shares at calculation time
    reward_per_share = Column(NUMERIC(18, 8), nullable=False, default=0)  # Calculated reward per share
    is_distributed = Column(Boolean, default=False, nullable=False)  # Whether rewards have been distributed
    
    # Timestamps
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    distributed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Unique constraint on period
    __table_args__ = (
        {'postgresql_partition_by': 'RANGE (period_year, period_month)'} if False else None,  # Placeholder for future partitioning
    )

