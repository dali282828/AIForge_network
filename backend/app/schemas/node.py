from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class NodeBase(BaseModel):
    name: str
    description: Optional[str] = None
    max_concurrent_jobs: int = 1
    gpu_enabled: bool = False

class NodeCreate(NodeBase):
    resources: Optional[Dict[str, Any]] = None

class NodeResponse(NodeBase):
    node_id: str
    is_active: bool
    last_heartbeat: Optional[datetime] = None
    resources: Optional[Dict[str, Any]] = None
    total_jobs_completed: int
    total_jobs_failed: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Node(NodeResponse):
    pass

class NodeRegistrationResponse(BaseModel):
    node_id: str
    token: Optional[str] = None
    message: str

