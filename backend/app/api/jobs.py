from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime
from app.core.database import get_db
from app.models.job import Job, JobStatus, JobType
from app.models.user import User
from app.schemas.job import JobCreate, JobResponse, JobStatusUpdate
from app.api.dependencies import get_current_user
import redis
from app.core.config import settings

router = APIRouter()

# Redis connection for job queue
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new job"""
    
    # Generate unique job ID
    job_id = f"job-{uuid.uuid4().hex[:8]}"
    
    # Create job record
    db_job = Job(
        job_id=job_id,
        type=job_data.type,
        config=job_data.config,
        input_files=job_data.input_files,
        output_files=job_data.output_files,
        docker_image=job_data.docker_image,
        command=job_data.command,
        environment=job_data.environment,
        memory_limit=job_data.memory_limit,
        cpu_limit=job_data.cpu_limit,
        gpus=job_data.gpus,
        status=JobStatus.PENDING
    )
    
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    # Add job to Redis queue
    try:
        redis_client.lpush("job_queue", job_id)
    except Exception as e:
        print(f"Warning: Failed to add job to Redis queue: {e}")
    
    return db_job

@router.get("", response_model=List[JobResponse])
async def list_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: JobStatus = None
):
    """List jobs"""
    query = db.query(Job)
    if status:
        query = query.filter(Job.status == status)
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return jobs

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get job details"""
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    return job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a job"""
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Only allow cancelling pending or assigned jobs
    if job.status not in [JobStatus.PENDING, JobStatus.ASSIGNED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel job in current status"
        )
    
    job.status = JobStatus.CANCELLED
    db.commit()
    
    return None

