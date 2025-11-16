"""
System Settings Schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class SystemSettingBase(BaseModel):
    key: str
    value: Optional[str] = None
    value_type: str = "string"
    category: str
    description: Optional[str] = None
    is_public: bool = False

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSettingUpdate(BaseModel):
    value: Optional[str] = None
    value_type: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class SystemSettingResponse(SystemSettingBase):
    id: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class FeatureFlagBase(BaseModel):
    name: str
    enabled: bool = False
    description: Optional[str] = None
    rollout_percentage: int = 100

class FeatureFlagCreate(FeatureFlagBase):
    pass

class FeatureFlagUpdate(BaseModel):
    enabled: Optional[bool] = None
    description: Optional[str] = None
    rollout_percentage: Optional[int] = None

class FeatureFlagResponse(FeatureFlagBase):
    id: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SystemLogResponse(BaseModel):
    id: int
    action: str
    category: str
    details: Optional[Dict[str, Any]] = None
    performed_by: Optional[int] = None
    performed_by_wallet: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class SystemHealthResponse(BaseModel):
    status: str
    database: bool
    redis: bool
    ipfs: bool
    minio: bool
    uptime_seconds: float
    version: str

class MaintenanceModeRequest(BaseModel):
    enabled: bool
    message: Optional[str] = None


