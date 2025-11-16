# AIForge Network

A decentralized social platform for collaborative AI model development.

## Features

- User authentication and authorization
- Group management and collaboration
- Model checkpoint storage (IPFS integration planned)
- Fine-tuning job orchestration
- Decentralized node network
- Cloud compute integration

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Storage**: MinIO (S3-compatible) + IPFS
- **Node Client**: Python + PyTorch

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd AIForge_network
```

2. Start services with Docker Compose:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (ports 9000, 9001)
- IPFS (ports 4001, 5001, 8080)
- Backend API (port 8000)

3. Run database migrations:
```bash
cd backend
alembic upgrade head
```

4. Start the frontend development server:
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

5. Access services:
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
- IPFS Gateway: http://localhost:8080

## Project Structure

```
AIForge_network/
├── frontend/          # React frontend application
├── backend/           # FastAPI backend application
├── node-client/       # Node client (to be implemented)
├── contracts/         # Smart contracts (to be implemented)
├── shared/            # Shared schemas and utilities
└── docker-compose.yml # Local development environment
```

## Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## Environment Variables

Create a `.env` file in the `backend/` directory (see `backend/.env.example`):

```env
DATABASE_URL=postgresql://aiforge:aiforge@localhost:5432/aiforge
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-in-production
```

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## License

[Your License Here]

