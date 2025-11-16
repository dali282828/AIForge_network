import requests
import time
from typing import Optional, Dict, Any
from src.config import config
from src.resource_monitor import ResourceMonitor

class CoordinatorClient:
    def __init__(self):
        self.base_url = config.COORDINATOR_URL
        self.token = config.NODE_TOKEN
        self.node_id: Optional[str] = None
        self.session = requests.Session()
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def register(self, node_info: Dict[str, Any]) -> bool:
        """Register this node with the coordinator"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/nodes/register",
                json=node_info,
                timeout=10
            )
            if response.status_code == 201:
                data = response.json()
                self.node_id = data.get("node_id")
                self.token = data.get("token") or self.token
                if self.token:
                    self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                return True
            else:
                print(f"Registration failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"Error registering node: {e}")
            return False
    
    def heartbeat(self) -> bool:
        """Send heartbeat to coordinator"""
        if not self.node_id:
            return False
        
        try:
            resource_info = ResourceMonitor.get_resource_info()
            response = self.session.post(
                f"{self.base_url}/api/nodes/{self.node_id}/heartbeat",
                json={
                    "status": "active",
                    "resources": resource_info,
                    "timestamp": time.time()
                },
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Error sending heartbeat: {e}")
            return False
    
    def poll_job(self) -> Optional[Dict[str, Any]]:
        """Poll coordinator for available jobs"""
        if not self.node_id:
            return None
        
        try:
            response = self.session.get(
                f"{self.base_url}/api/nodes/{self.node_id}/jobs/poll",
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("job"):
                    return data["job"]
            return None
        except Exception as e:
            print(f"Error polling for jobs: {e}")
            return None
    
    def update_job_status(self, job_id: str, status: str, progress: Optional[float] = None, 
                         result: Optional[Dict[str, Any]] = None, error: Optional[str] = None):
        """Update job status on coordinator"""
        if not self.node_id:
            return False
        
        try:
            payload = {
                "status": status,
                "progress": progress,
                "result": result,
                "error": error
            }
            response = self.session.put(
                f"{self.base_url}/api/nodes/{self.node_id}/jobs/{job_id}/status",
                json=payload,
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Error updating job status: {e}")
            return False
    
    def complete_job(self, job_id: str, result: Dict[str, Any], output_cid: Optional[str] = None):
        """Mark job as complete"""
        if not self.node_id:
            return False
        
        try:
            payload = {
                "status": "completed",
                "result": result,
                "output_cid": output_cid
            }
            response = self.session.post(
                f"{self.base_url}/api/nodes/{self.node_id}/jobs/{job_id}/complete",
                json=payload,
                timeout=30
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Error completing job: {e}")
            return False

