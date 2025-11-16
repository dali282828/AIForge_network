from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, JSON, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobType(str, enum.Enum):
    TEST = "test"
    FINETUNE = "finetune"
    MERGE = "merge"
    QUANTIZE = "quantize"
    INFERENCE = "inference"

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True, nullable=False)  # Unique identifier
    type = Column(Enum(JobType), default=JobType.TEST, nullable=False)
    
    # Assignment
    node_id = Column(Integer, ForeignKey("nodes.id"), nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False)
    
    # Job configuration
    config = Column(JSON, nullable=False)  # Job-specific configuration
    input_files = Column(JSON, nullable=True)  # List of input file CIDs/paths
    output_files = Column(JSON, nullable=True)  # Expected output files
    
    # Execution
    docker_image = Column(String, nullable=True)
    command = Column(JSON, nullable=True)  # Command to execute
    environment = Column(JSON, nullable=True)  # Environment variables
    
    # Progress and results
    progress = Column(Float, default=0.0, nullable=False)
    result = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    output_cid = Column(String, nullable=True)  # IPFS CID of output
    
    # Resource requirements
    memory_limit = Column(String, nullable=True)  # e.g., "4G"
    cpu_limit = Column(Float, nullable=True)  # CPU cores
    gpus = Column(Integer, nullable=True)  # Number of GPUs required
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    node = relationship("Node", back_populates="jobs")

