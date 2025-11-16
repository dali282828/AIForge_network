from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from datetime import datetime
from app.core.database import get_db
from app.models.node import Node
from app.models.job import Job, JobStatus
from app.schemas.node import NodeCreate, NodeResponse, NodeRegistrationResponse
from app.schemas.job import JobResponse
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/register", response_model=NodeRegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_node(
    node_data: NodeCreate,
    db: Session = Depends(get_db)
):
    """Register a new node with the coordinator"""
    
    # Generate unique node ID
    node_id = f"node-{uuid.uuid4().hex[:8]}"
    
    # Create node record
    db_node = Node(
        node_id=node_id,
        name=node_data.name,
        description=node_data.description,
        resources=node_data.resources,
        max_concurrent_jobs=node_data.max_concurrent_jobs,
        gpu_enabled=node_data.gpu_enabled,
        is_active=True,
        last_heartbeat=datetime.utcnow()
    )
    
    db.add(db_node)
    db.commit()
    db.refresh(db_node)
    
    # Generate token for node authentication (simple implementation)
    # In production, use proper JWT or API key generation
    token = f"node_{node_id}_{uuid.uuid4().hex[:16]}"
    
    return NodeRegistrationResponse(
        node_id=node_id,
        token=token,
        message="Node registered successfully"
    )

@router.post("/{node_id}/heartbeat", status_code=status.HTTP_200_OK)
async def node_heartbeat(
    node_id: str,
    heartbeat_data: dict,
    db: Session = Depends(get_db)
):
    """Receive heartbeat from node"""
    
    node = db.query(Node).filter(Node.node_id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Update heartbeat timestamp and resources
    node.last_heartbeat = datetime.utcnow()
    if "resources" in heartbeat_data:
        node.resources = heartbeat_data["resources"]
    node.is_active = True
    
    db.commit()
    
    return {"status": "ok"}

@router.get("/{node_id}/jobs/poll", response_model=dict)
async def poll_job(
    node_id: str,
    db: Session = Depends(get_db)
):
    """Poll for available jobs for this node"""
    
    node = db.query(Node).filter(Node.node_id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Check if node is active
    if not node.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Node is not active"
        )
    
    # Check current running jobs count
    running_jobs = db.query(Job).filter(
        Job.node_id == node.id,
        Job.status == JobStatus.RUNNING
    ).count()
    
    if running_jobs >= node.max_concurrent_jobs:
        return {"job": None, "message": "Node at capacity"}
    
    # Find a pending job that matches node capabilities
    # For now, simple implementation - get first pending job
    # In production, implement job matching based on resource requirements
    job = db.query(Job).filter(
        Job.status == JobStatus.PENDING,
        Job.gpus <= (1 if node.gpu_enabled else 0) if Job.gpus else True
    ).first()
    
    if job:
        # Assign job to node
        job.node_id = node.id
        job.status = JobStatus.ASSIGNED
        job.started_at = datetime.utcnow()
        db.commit()
        db.refresh(job)
        
        return {
            "job": {
                "id": job.job_id,
                "type": job.type.value,
                "config": job.config,
                "input_files": job.input_files,
                "output_files": job.output_files,
                "docker_image": job.docker_image,
                "command": job.command,
                "environment": job.environment,
                "memory_limit": job.memory_limit,
                "cpu_limit": job.cpu_limit,
                "gpus": job.gpus
            }
        }
    
    return {"job": None, "message": "No jobs available"}

@router.put("/{node_id}/jobs/{job_id}/status", status_code=status.HTTP_200_OK)
async def update_job_status(
    node_id: str,
    job_id: str,
    status_data: dict,
    db: Session = Depends(get_db)
):
    """Update job status"""
    
    node = db.query(Node).filter(Node.node_id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Verify job belongs to this node
    if job.node_id != node.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job does not belong to this node"
        )
    
    # Update job status
    if "status" in status_data:
        job.status = JobStatus(status_data["status"])
    if "progress" in status_data:
        job.progress = status_data["progress"]
    if "result" in status_data:
        job.result = status_data["result"]
    if "error" in status_data:
        job.error = status_data["error"]
        job.status = JobStatus.FAILED
    
    db.commit()
    
    return {"status": "ok"}

@router.post("/{node_id}/jobs/{job_id}/complete", status_code=status.HTTP_200_OK)
async def complete_job(
    node_id: str,
    job_id: str,
    completion_data: dict,
    db: Session = Depends(get_db)
):
    """Mark job as complete"""
    
    node = db.query(Node).filter(Node.node_id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Verify job belongs to this node
    if job.node_id != node.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job does not belong to this node"
        )
    
    # Update job
    job.status = JobStatus.COMPLETED
    job.completed_at = datetime.utcnow()
    if "result" in completion_data:
        job.result = completion_data["result"]
    if "output_cid" in completion_data:
        job.output_cid = completion_data["output_cid"]
    if "progress" in completion_data:
        job.progress = completion_data.get("progress", 1.0)
    
    # Update node statistics
    node.total_jobs_completed += 1
    
    db.commit()
    
    return {"status": "ok", "message": "Job completed"}

@router.get("", response_model=list[NodeResponse])
async def list_nodes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """List all nodes"""
    nodes = db.query(Node).offset(skip).limit(limit).all()
    return nodes

@router.get("/{node_id}", response_model=NodeResponse)
async def get_node(
    node_id: str,
    db: Session = Depends(get_db)
):
    """Get node details"""
    node = db.query(Node).filter(Node.node_id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    return node

