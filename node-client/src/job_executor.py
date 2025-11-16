import os
import json
import time
import shutil
from typing import Dict, Any, Optional
from src.config import config
from src.docker_manager import DockerManager
from src.ipfs_client import IPFSClient
from src.coordinator_client import CoordinatorClient

class JobExecutor:
    def __init__(self, coordinator_client: CoordinatorClient):
        self.coordinator = coordinator_client
        self.docker = DockerManager()
        self.ipfs = IPFSClient()
        self.job_work_dir = config.JOB_WORK_DIR
        os.makedirs(self.job_work_dir, exist_ok=True)
    
    def execute_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a job"""
        job_id = job.get("id")
        job_type = job.get("type", "test")
        
        print(f"Starting job {job_id} of type {job_type}")
        
        # Create work directory for this job
        work_dir = os.path.join(self.job_work_dir, f"job_{job_id}")
        os.makedirs(work_dir, exist_ok=True)
        
        try:
            # Update status to running
            self.coordinator.update_job_status(job_id, "running", progress=0.0)
            
            # Download required files from IPFS
            if job.get("input_files"):
                print("Downloading input files...")
                for file_info in job["input_files"]:
                    cid = file_info.get("cid")
                    file_path = file_info.get("path")
                    if cid and file_path:
                        full_path = os.path.join(work_dir, file_path)
                        if not self.ipfs.download_file(cid, full_path):
                            raise Exception(f"Failed to download file {cid}")
                self.coordinator.update_job_status(job_id, "running", progress=0.2)
            
            # Prepare job configuration
            job_config = {
                "job_id": job_id,
                "image": job.get("docker_image", "python:3.11"),
                "command": job.get("command", ["python", "-c", "print('Job completed')"]),
                "environment": job.get("environment", {}),
                "memory_limit": job.get("memory_limit"),
                "cpu_limit": job.get("cpu_limit"),
                "gpus": job.get("gpus")
            }
            
            # Execute in Docker container
            if self.docker.is_available():
                print("Executing job in Docker container...")
                container_id = self.docker.create_job_container(job_config, work_dir)
                
                if not container_id:
                    raise Exception("Failed to create Docker container")
                
                # Wait for container to complete
                self.coordinator.update_job_status(job_id, "running", progress=0.5)
                
                container = self.docker.client.containers.get(container_id)
                exit_code = container.wait(timeout=config.JOB_TIMEOUT)
                
                # Get logs
                logs = self.docker.get_container_logs(container_id)
                
                # Clean up
                self.docker.stop_container(container_id)
                
                if exit_code != 0:
                    raise Exception(f"Container exited with code {exit_code}: {logs}")
                
                result = {
                    "exit_code": exit_code,
                    "logs": logs,
                    "output_dir": work_dir
                }
            else:
                # Fallback: execute directly (not recommended for production)
                print("Docker not available, executing directly...")
                result = self._execute_directly(job_config, work_dir)
            
            # Upload output files to IPFS if any
            output_cid = None
            if job.get("output_files"):
                print("Uploading output files...")
                for output_file in job["output_files"]:
                    file_path = os.path.join(work_dir, output_file)
                    if os.path.exists(file_path):
                        cid = self.ipfs.upload_file(file_path)
                        if cid:
                            output_cid = cid
                            break
            
            self.coordinator.update_job_status(job_id, "running", progress=0.9)
            
            # Mark job as complete
            self.coordinator.complete_job(job_id, result, output_cid)
            
            print(f"Job {job_id} completed successfully")
            return result
            
        except Exception as e:
            error_msg = str(e)
            print(f"Job {job_id} failed: {error_msg}")
            self.coordinator.update_job_status(
                job_id, 
                "failed", 
                error=error_msg
            )
            raise
        finally:
            # Cleanup work directory (optional, keep for debugging)
            # shutil.rmtree(work_dir, ignore_errors=True)
            pass
    
    def _execute_directly(self, job_config: Dict[str, Any], work_dir: str) -> Dict[str, Any]:
        """Execute job directly without Docker (fallback)"""
        import subprocess
        
        command = job_config.get("command", [])
        env = os.environ.copy()
        env.update(job_config.get("environment", {}))
        env["WORK_DIR"] = work_dir
        
        result = subprocess.run(
            command,
            cwd=work_dir,
            env=env,
            capture_output=True,
            text=True,
            timeout=config.JOB_TIMEOUT
        )
        
        return {
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }

