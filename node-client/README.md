# AIForge Network Node Client

The Node Client allows users to share their GPU/CPU resources with the AIForge Network to execute training and fine-tuning jobs.

## Features

- Automatic registration with Coordinator
- Job polling and execution
- Docker container isolation
- IPFS integration for data transfer
- GPU/CPU resource monitoring
- Automatic heartbeat to Coordinator

## Requirements

- Python 3.11+
- Docker installed and running
- (Optional) NVIDIA GPU with nvidia-docker support
- (Optional) IPFS node running locally

## Installation

```bash
cd node-client
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
COORDINATOR_URL=http://localhost:8000
NODE_NAME=my-node
NODE_DESCRIPTION=My GPU Node
GPU_ENABLED=true
MAX_CONCURRENT_JOBS=1
```

## Running

```bash
python src/main.py
```

## How It Works

1. **Registration**: Node registers with Coordinator, providing resource information
2. **Heartbeat**: Periodic status updates to Coordinator
3. **Job Polling**: Continuously polls Coordinator for available jobs
4. **Job Execution**: 
   - Downloads required files from IPFS
   - Executes job in Docker container
   - Uploads results to IPFS
   - Reports completion to Coordinator

## Docker Requirements

The node client uses Docker to execute jobs in isolated containers. Make sure:
- Docker daemon is running
- User has permission to run Docker
- (For GPU jobs) nvidia-docker is installed

## IPFS Integration

- Downloads datasets/models from IPFS
- Uploads job results to IPFS
- Falls back to IPFS gateway if local node unavailable

