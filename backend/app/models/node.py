from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, unique=True, index=True, nullable=False)  # Unique identifier
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)
    
    # Resources
    resources = Column(JSON, nullable=True)  # CPU, GPU, memory info
    max_concurrent_jobs = Column(Integer, default=1, nullable=False)
    gpu_enabled = Column(Boolean, default=False, nullable=False)
    
    # Statistics
    total_jobs_completed = Column(Integer, default=0, nullable=False)
    total_jobs_failed = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    jobs = relationship("Job", back_populates="node", cascade="all, delete-orphan")

