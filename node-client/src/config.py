import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
from typing import Optional

class NodeConfig(BaseSettings):
    # Coordinator connection
    COORDINATOR_URL: str = "http://localhost:8000"
    NODE_TOKEN: Optional[str] = None  # Authentication token for node
    
    # Node identification
    NODE_NAME: str = "node-1"
    NODE_DESCRIPTION: Optional[str] = None
    
    # Resource limits
    MAX_CONCURRENT_JOBS: int = 1
    GPU_ENABLED: bool = True
    CPU_LIMIT: Optional[float] = None  # CPU cores limit
    
    # Docker settings
    DOCKER_NETWORK: str = "bridge"
    JOB_TIMEOUT: int = 3600  # Job timeout in seconds
    
    # IPFS settings
    IPFS_HOST: str = "localhost"
    IPFS_PORT: int = 5001
    IPFS_GATEWAY: str = "http://localhost:8080"
    
    # Job storage
    JOB_WORK_DIR: str = "./jobs"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

config = NodeConfig()

