from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.models.job import JobStatus, JobType

class JobBase(BaseModel):
    type: JobType = JobType.TEST
    config: Dict[str, Any]
    input_files: Optional[List[Dict[str, Any]]] = None
    output_files: Optional[List[str]] = None
    docker_image: Optional[str] = None
    command: Optional[List[str]] = None
    environment: Optional[Dict[str, str]] = None
    memory_limit: Optional[str] = None
    cpu_limit: Optional[float] = None
    gpus: Optional[int] = None

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: int
    job_id: str
    node_id: Optional[int] = None
    status: JobStatus
    progress: float
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    output_cid: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Job(JobResponse):
    pass

class JobStatusUpdate(BaseModel):
    status: JobStatus
    progress: Optional[float] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class JobComplete(BaseModel):
    status: JobStatus = JobStatus.COMPLETED
    result: Dict[str, Any]
    output_cid: Optional[str] = None

