from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.model import ModelLicense

class ModelBase(BaseModel):
    name: str
    description: Optional[str] = None
    version: str = "1.0.0"
    license: ModelLicense = ModelLicense.OPEN
    license_text: Optional[str] = None
    tags: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None

class ModelCreate(ModelBase):
    group_id: int
    is_encrypted: bool = False

class ModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    license: Optional[ModelLicense] = None
    license_text: Optional[str] = None
    tags: Optional[str] = None

class ModelResponse(ModelBase):
    id: int
    group_id: int
    owner_id: int
    ipfs_cid: Optional[str] = None
    ipfs_gateway_url: Optional[str] = None
    minio_path: Optional[str] = None
    file_size: Optional[int] = None
    file_format: Optional[str] = None
    is_encrypted: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Model(ModelResponse):
    pass

class ModelUploadResponse(BaseModel):
    model: ModelResponse
    upload_status: str
    ipfs_pinned: bool
    message: str

class HuggingFaceImport(BaseModel):
    model_id: str = Field(..., description="HuggingFace model ID (e.g., 'bert-base-uncased')")
    group_id: int
    revision: Optional[str] = None
    files: Optional[List[str]] = None  # Specific files to download, None = all

