from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class WalletNetwork(str, enum.Enum):
    ETHEREUM = "ethereum"
    TRON = "tron"

class WalletType(str, enum.Enum):
    METAMASK = "metamask"
    TRONLINK = "tronlink"

class UserWallet(Base):
    __tablename__ = "user_wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    wallet_address = Column(String, nullable=False, index=True)
    network = Column(Enum(WalletNetwork), nullable=False)
    wallet_type = Column(Enum(WalletType), nullable=False)
    
    # Verification
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verification_signature = Column(String, nullable=True)  # Signature for verification
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="wallets")
    payments = relationship("Payment", back_populates="wallet", foreign_keys="Payment.from_wallet_id")

class AdminWallet(Base):
    __tablename__ = "admin_wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String, unique=True, nullable=False, index=True)
    network = Column(Enum(WalletNetwork), nullable=False)
    
    # Management
    is_active = Column(Boolean, default=True, nullable=False)
    added_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # User who added it
    notes = Column(String, nullable=True)  # Optional notes
    
    # Timestamps
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    added_by_user = relationship("User", foreign_keys=[added_by])

