from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class ModelLicense(str, enum.Enum):
    OPEN = "open"
    COMMERCIAL = "commercial"
    RESTRICTED = "restricted"
    CUSTOM = "custom"

class Model(Base):
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    version = Column(String, nullable=False, default="1.0.0")
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Storage information
    ipfs_cid = Column(String, nullable=True, index=True)  # IPFS Content ID
    minio_path = Column(String, nullable=True)  # MinIO path for fast access
    file_size = Column(Integer, nullable=True)  # File size in bytes
    file_format = Column(String, nullable=True)  # e.g., "safetensors", "pth", "onnx"
    
    # Metadata
    license = Column(Enum(ModelLicense), default=ModelLicense.OPEN, nullable=False)
    license_text = Column(Text, nullable=True)  # Custom license text
    tags = Column(String, nullable=True)  # Comma-separated tags
    
    # Privacy and access
    is_encrypted = Column(Boolean, default=False, nullable=False)
    encryption_key_hash = Column(String, nullable=True)  # Hash of encryption key (not the key itself)
    
    # Source information
    source = Column(String, nullable=True)  # e.g., "huggingface", "upload", "local"
    source_url = Column(String, nullable=True)  # Original source URL if imported
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    group = relationship("Group", foreign_keys=[group_id])
    owner = relationship("User", foreign_keys=[owner_id])

