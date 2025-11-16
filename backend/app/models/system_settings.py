"""
System Settings Models for Platform Configuration
Allows admins to manage platform settings, feature flags, and system state
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base

class SystemSetting(Base):
    """System-wide configuration settings"""
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)  # e.g., "maintenance_mode", "platform_fee"
    value = Column(Text, nullable=True)  # JSON string or plain text
    value_type = Column(String, default="string", nullable=False)  # string, number, boolean, json
    category = Column(String, nullable=False, index=True)  # general, fees, features, security, etc.
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)  # Can be accessed by non-admins
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(Integer, nullable=True)  # User ID who last updated

class FeatureFlag(Base):
    """Feature flags for enabling/disabling platform features"""
    __tablename__ = "feature_flags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)  # e.g., "nft_shares", "infrastructure_investment"
    enabled = Column(Boolean, default=False, nullable=False, index=True)
    description = Column(Text, nullable=True)
    rollout_percentage = Column(Integer, default=100, nullable=False)  # 0-100, for gradual rollout
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(Integer, nullable=True)

class SystemLog(Base):
    """System operation logs for audit trail"""
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False, index=True)  # e.g., "setting_updated", "feature_toggled"
    category = Column(String, nullable=False, index=True)  # settings, features, system, etc.
    details = Column(JSONB, nullable=True)  # Additional details as JSON
    performed_by = Column(Integer, nullable=True)  # User ID
    performed_by_wallet = Column(String, nullable=True)  # Wallet address
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


