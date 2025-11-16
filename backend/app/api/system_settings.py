"""
System Settings API Endpoints
Admin-only endpoints for managing platform configuration
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, Tuple
from app.core.database import get_db
from app.models.wallet import WalletNetwork
from app.services.wallet_service import WalletService
from app.services.system_service import SystemService
from app.schemas.system_settings import (
    SystemSettingCreate, SystemSettingUpdate, SystemSettingResponse,
    FeatureFlagCreate, FeatureFlagUpdate, FeatureFlagResponse,
    SystemLogResponse, SystemHealthResponse, MaintenanceModeRequest
)
from app.core.config import settings
from datetime import datetime
from sqlalchemy import text
import time
import redis
import psycopg2

router = APIRouter()

# Reuse admin wallet verification
async def verify_admin_wallet(
    x_wallet_address: Optional[str] = Header(None),
    x_wallet_network: Optional[str] = Header(None),
) -> Tuple[str, WalletNetwork]:
    """Verify admin wallet from headers"""
    if not x_wallet_address or not x_wallet_network:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin wallet headers required"
        )
    
    try:
        network = WalletNetwork(x_wallet_network.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid network. Must be 'ethereum' or 'tron'"
        )
    
    if network == WalletNetwork.ETHEREUM:
        normalized_address = x_wallet_address.lower()
    else:
        normalized_address = x_wallet_address
    
    if not WalletService.is_admin_wallet(normalized_address, network):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Wallet not authorized as admin"
        )
    
    return normalized_address, network

# System Settings
@router.get("/settings", response_model=list[SystemSettingResponse])
async def get_settings(
    category: Optional[str] = None,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all system settings"""
    settings_list = SystemService.get_all_settings(db, category)
    return settings_list

@router.get("/settings/{key}", response_model=SystemSettingResponse)
async def get_setting(
    key: str,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get a specific system setting"""
    setting = SystemService.get_setting(db, key)
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' not found"
        )
    return setting

@router.post("/settings", response_model=SystemSettingResponse, status_code=status.HTTP_201_CREATED)
async def create_setting(
    setting_data: SystemSettingCreate,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Create a new system setting"""
    existing = SystemService.get_setting(db, setting_data.key)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Setting '{setting_data.key}' already exists"
        )
    
    setting = SystemService.set_setting(
        db=db,
        key=setting_data.key,
        value=setting_data.value,
        value_type=setting_data.value_type,
        category=setting_data.category,
        description=setting_data.description,
        is_public=setting_data.is_public
    )
    
    SystemService.log_action(
        db=db,
        action="setting_created",
        category="settings",
        details={"key": setting_data.key, "category": setting_data.category},
        performed_by_wallet=admin_wallet[0]
    )
    
    return setting

@router.patch("/settings/{key}", response_model=SystemSettingResponse)
async def update_setting(
    key: str,
    setting_data: SystemSettingUpdate,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Update a system setting"""
    setting = SystemService.get_setting(db, key)
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' not found"
        )
    
    if setting_data.value is not None:
        setting.value = str(setting_data.value)
    if setting_data.value_type is not None:
        setting.value_type = setting_data.value_type
    if setting_data.description is not None:
        setting.description = setting_data.description
    if setting_data.is_public is not None:
        setting.is_public = setting_data.is_public
    
    setting.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(setting)
    
    SystemService.log_action(
        db=db,
        action="setting_updated",
        category="settings",
        details={"key": key, "changes": setting_data.dict(exclude_unset=True)},
        performed_by_wallet=admin_wallet[0]
    )
    
    return setting

# Feature Flags
@router.get("/feature-flags", response_model=list[FeatureFlagResponse])
async def get_feature_flags(
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all feature flags"""
    flags = SystemService.get_all_feature_flags(db)
    return flags

@router.post("/feature-flags", response_model=FeatureFlagResponse, status_code=status.HTTP_201_CREATED)
async def create_feature_flag(
    flag_data: FeatureFlagCreate,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Create a new feature flag"""
    existing = SystemService.get_feature_flag(db, flag_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Feature flag '{flag_data.name}' already exists"
        )
    
    flag = SystemService.set_feature_flag(
        db=db,
        name=flag_data.name,
        enabled=flag_data.enabled,
        description=flag_data.description,
        rollout_percentage=flag_data.rollout_percentage
    )
    
    SystemService.log_action(
        db=db,
        action="feature_flag_created",
        category="features",
        details={"name": flag_data.name, "enabled": flag_data.enabled},
        performed_by_wallet=admin_wallet[0]
    )
    
    return flag

@router.patch("/feature-flags/{name}", response_model=FeatureFlagResponse)
async def update_feature_flag(
    name: str,
    flag_data: FeatureFlagUpdate,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Update a feature flag"""
    flag = SystemService.get_feature_flag(db, name)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature flag '{name}' not found"
        )
    
    if flag_data.enabled is not None:
        flag.enabled = flag_data.enabled
    if flag_data.description is not None:
        flag.description = flag_data.description
    if flag_data.rollout_percentage is not None:
        flag.rollout_percentage = flag_data.rollout_percentage
    
    flag.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(flag)
    
    SystemService.log_action(
        db=db,
        action="feature_flag_updated",
        category="features",
        details={"name": name, "changes": flag_data.dict(exclude_unset=True)},
        performed_by_wallet=admin_wallet[0]
    )
    
    return flag

# Maintenance Mode
@router.get("/maintenance-mode")
async def get_maintenance_mode(
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get maintenance mode status"""
    enabled = SystemService.is_maintenance_mode(db)
    message = SystemService.get_setting_value(db, "maintenance_message", "")
    return {"enabled": enabled, "message": message}

@router.post("/maintenance-mode")
async def set_maintenance_mode(
    request: MaintenanceModeRequest,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Enable or disable maintenance mode"""
    SystemService.set_maintenance_mode(
        db=db,
        enabled=request.enabled,
        message=request.message
    )
    
    SystemService.log_action(
        db=db,
        action="maintenance_mode_toggled",
        category="system",
        details={"enabled": request.enabled, "message": request.message},
        performed_by_wallet=admin_wallet[0]
    )
    
    return {"enabled": request.enabled, "message": request.message}

# System Health
@router.get("/health", response_model=SystemHealthResponse)
async def get_system_health(
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get system health status"""
    start_time = time.time()
    
    # Check database
    db_healthy = False
    try:
        result = db.execute(text("SELECT 1"))
        result.fetchone()
        db_healthy = True
    except Exception as e:
        print(f"Database health check failed: {e}")
        pass
    
    # Check Redis
    redis_healthy = False
    try:
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        redis_healthy = True
    except Exception as e:
        print(f"Redis health check failed: {e}")
        pass
    
    # Check IPFS (simplified - would need actual IPFS client)
    ipfs_healthy = False
    try:
        # TODO: Add actual IPFS health check
        ipfs_healthy = True
    except:
        pass
    
    # Check MinIO (simplified)
    minio_healthy = False
    try:
        # TODO: Add actual MinIO health check
        minio_healthy = True
    except:
        pass
    
    all_healthy = db_healthy and redis_healthy
    status_str = "healthy" if all_healthy else "degraded"
    
    return SystemHealthResponse(
        status=status_str,
        database=db_healthy,
        redis=redis_healthy,
        ipfs=ipfs_healthy,
        minio=minio_healthy,
        uptime_seconds=time.time() - start_time,
        version="0.1.0"
    )

# System Logs
@router.get("/logs", response_model=list[SystemLogResponse])
async def get_system_logs(
    category: Optional[str] = None,
    limit: int = 100,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get system logs"""
    logs = SystemService.get_logs(db, category, limit)
    return logs

