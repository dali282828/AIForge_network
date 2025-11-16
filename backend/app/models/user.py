from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)  # Optional for wallet-only users
    username = Column(String, unique=True, index=True, nullable=True)  # Optional for wallet-only users
    hashed_password = Column(String, nullable=True)  # Optional for wallet-only users
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    auth_method = Column(String, default="email", nullable=False)  # "email" or "wallet"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    group_memberships = relationship("GroupMembership", back_populates="user", cascade="all, delete-orphan")
    wallets = relationship("UserWallet", back_populates="user", foreign_keys="UserWallet.user_id", cascade="all, delete-orphan")

