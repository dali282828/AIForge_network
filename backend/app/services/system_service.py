"""
System Service for managing platform settings, feature flags, and system operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any, List
from app.models.system_settings import SystemSetting, FeatureFlag, SystemLog
from app.schemas.system_settings import SystemSettingCreate, SystemSettingUpdate, FeatureFlagCreate, FeatureFlagUpdate
from datetime import datetime
import json
import time

class SystemService:
    """Service for managing system settings and operations"""
    
    @staticmethod
    def get_setting(db: Session, key: str) -> Optional[SystemSetting]:
        """Get a system setting by key"""
        return db.query(SystemSetting).filter(SystemSetting.key == key).first()
    
    @staticmethod
    def get_setting_value(db: Session, key: str, default: Any = None) -> Any:
        """Get a system setting value, converted to appropriate type"""
        setting = SystemService.get_setting(db, key)
        if not setting:
            return default
        
        value = setting.value
        if setting.value_type == "boolean":
            return value.lower() in ("true", "1", "yes") if value else False
        elif setting.value_type == "number":
            try:
                return float(value) if "." in str(value) else int(value)
            except:
                return default
        elif setting.value_type == "json":
            try:
                return json.loads(value) if value else {}
            except:
                return default
        else:
            return value
    
    @staticmethod
    def set_setting(
        db: Session,
        key: str,
        value: Any,
        value_type: str = "string",
        category: str = "general",
        description: Optional[str] = None,
        is_public: bool = False,
        updated_by: Optional[int] = None
    ) -> SystemSetting:
        """Set or update a system setting"""
        setting = SystemService.get_setting(db, key)
        
        # Convert value to string
        if value_type == "json":
            value_str = json.dumps(value) if value else "{}"
        else:
            value_str = str(value)
        
        if setting:
            setting.value = value_str
            setting.value_type = value_type
            setting.description = description
            setting.is_public = is_public
            setting.updated_by = updated_by
            setting.updated_at = datetime.utcnow()
        else:
            setting = SystemSetting(
                key=key,
                value=value_str,
                value_type=value_type,
                category=category,
                description=description,
                is_public=is_public,
                updated_by=updated_by
            )
            db.add(setting)
        
        db.commit()
        db.refresh(setting)
        return setting
    
    @staticmethod
    def get_all_settings(db: Session, category: Optional[str] = None) -> List[SystemSetting]:
        """Get all system settings, optionally filtered by category"""
        query = db.query(SystemSetting)
        if category:
            query = query.filter(SystemSetting.category == category)
        return query.order_by(SystemSetting.category, SystemSetting.key).all()
    
    @staticmethod
    def get_feature_flag(db: Session, name: str) -> Optional[FeatureFlag]:
        """Get a feature flag by name"""
        return db.query(FeatureFlag).filter(FeatureFlag.name == name).first()
    
    @staticmethod
    def is_feature_enabled(db: Session, name: str) -> bool:
        """Check if a feature is enabled"""
        flag = SystemService.get_feature_flag(db, name)
        return flag.enabled if flag else False
    
    @staticmethod
    def set_feature_flag(
        db: Session,
        name: str,
        enabled: bool,
        description: Optional[str] = None,
        rollout_percentage: int = 100,
        updated_by: Optional[int] = None
    ) -> FeatureFlag:
        """Set or update a feature flag"""
        flag = SystemService.get_feature_flag(db, name)
        
        if flag:
            flag.enabled = enabled
            flag.description = description
            flag.rollout_percentage = rollout_percentage
            flag.updated_by = updated_by
            flag.updated_at = datetime.utcnow()
        else:
            flag = FeatureFlag(
                name=name,
                enabled=enabled,
                description=description,
                rollout_percentage=rollout_percentage,
                updated_by=updated_by
            )
            db.add(flag)
        
        db.commit()
        db.refresh(flag)
        return flag
    
    @staticmethod
    def get_all_feature_flags(db: Session) -> List[FeatureFlag]:
        """Get all feature flags"""
        return db.query(FeatureFlag).order_by(FeatureFlag.name).all()
    
    @staticmethod
    def log_action(
        db: Session,
        action: str,
        category: str,
        details: Optional[Dict[str, Any]] = None,
        performed_by: Optional[int] = None,
        performed_by_wallet: Optional[str] = None
    ) -> SystemLog:
        """Log a system action"""
        log = SystemLog(
            action=action,
            category=category,
            details=details,
            performed_by=performed_by,
            performed_by_wallet=performed_by_wallet
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    
    @staticmethod
    def get_logs(
        db: Session,
        category: Optional[str] = None,
        limit: int = 100
    ) -> List[SystemLog]:
        """Get system logs"""
        query = db.query(SystemLog)
        if category:
            query = query.filter(SystemLog.category == category)
        return query.order_by(SystemLog.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def is_maintenance_mode(db: Session) -> bool:
        """Check if maintenance mode is enabled"""
        return SystemService.get_setting_value(db, "maintenance_mode", False)
    
    @staticmethod
    def set_maintenance_mode(
        db: Session,
        enabled: bool,
        message: Optional[str] = None,
        updated_by: Optional[int] = None
    ):
        """Enable or disable maintenance mode"""
        SystemService.set_setting(
            db=db,
            key="maintenance_mode",
            value=enabled,
            value_type="boolean",
            category="system",
            description="Platform maintenance mode",
            updated_by=updated_by
        )
        
        if message:
            SystemService.set_setting(
                db=db,
                key="maintenance_message",
                value=message,
                value_type="string",
                category="system",
                description="Maintenance mode message",
                updated_by=updated_by
            )


