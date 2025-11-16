#!/usr/bin/env python3
"""
AIForge Network Node Client
Connects to coordinator and executes training jobs
"""

import time
import signal
import sys
from src.config import config
from src.coordinator_client import CoordinatorClient
from src.resource_monitor import ResourceMonitor
from src.job_executor import JobExecutor

class NodeClient:
    def __init__(self):
        self.running = False
        self.coordinator = CoordinatorClient()
        self.executor = JobExecutor(self.coordinator)
        self.heartbeat_interval = 30  # seconds
        self.job_poll_interval = 5  # seconds
        self.last_heartbeat = 0
    
    def register_node(self) -> bool:
        """Register this node with the coordinator"""
        resource_info = ResourceMonitor.get_resource_info()
        
        node_info = {
            "name": config.NODE_NAME,
            "description": config.NODE_DESCRIPTION,
            "resources": resource_info,
            "max_concurrent_jobs": config.MAX_CONCURRENT_JOBS,
            "gpu_enabled": config.GPU_ENABLED
        }
        
        print(f"Registering node '{config.NODE_NAME}' with coordinator...")
        return self.coordinator.register(node_info)
    
    def send_heartbeat(self):
        """Send periodic heartbeat to coordinator"""
        current_time = time.time()
        if current_time - self.last_heartbeat >= self.heartbeat_interval:
            if self.coordinator.heartbeat():
                self.last_heartbeat = current_time
                print("Heartbeat sent")
            else:
                print("Warning: Heartbeat failed")
    
    def process_jobs(self):
        """Poll for and process jobs"""
        job = self.coordinator.poll_job()
        if job:
            print(f"Received job: {job.get('id')}")
            try:
                self.executor.execute_job(job)
            except Exception as e:
                print(f"Error executing job: {e}")
    
    def run(self):
        """Main loop"""
        print("Starting AIForge Node Client...")
        print(f"Coordinator URL: {config.COORDINATOR_URL}")
        print(f"Node Name: {config.NODE_NAME}")
        
        # Register node
        if not self.register_node():
            print("Failed to register node. Exiting.")
            return
        
        print("Node registered successfully!")
        print(f"Node ID: {self.coordinator.node_id}")
        
        # Setup signal handlers
        def signal_handler(sig, frame):
            print("\nShutting down node client...")
            self.running = False
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        self.running = True
        
        print("Node client running. Press Ctrl+C to stop.")
        
        # Main loop
        while self.running:
            try:
                # Send heartbeat
                self.send_heartbeat()
                
                # Poll for jobs
                self.process_jobs()
                
                # Sleep before next iteration
                time.sleep(self.job_poll_interval)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error in main loop: {e}")
                time.sleep(5)
        
        print("Node client stopped.")

def main():
    client = NodeClient()
    client.run()

if __name__ == "__main__":
    main()

