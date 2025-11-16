from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import logging

logger = logging.getLogger(__name__)

# Import config first
try:
    from app.core.config import settings
except Exception as e:
    logger.error(f"Failed to import settings: {e}", exc_info=True)
    raise

app = FastAPI(
    title="AIForge Network API",
    description="Decentralized Social Platform for Collaborative AI Model Development",
    version="0.1.0"
)

# CORS middleware
# Parse CORS_ORIGINS from string (JSON or comma-separated)
def parse_cors_origins(cors_str: str) -> List[str]:
    """Parse CORS origins from string (JSON array or comma-separated)"""
    if not cors_str or cors_str.strip() == "":
        return ["http://localhost:5173", "http://localhost:3000"]
    
    try:
        # Try to parse as JSON
        import json
        parsed = json.loads(cors_str)
        if isinstance(parsed, list):
            return parsed
        # If single value, wrap in list
        return [parsed] if parsed else ["http://localhost:5173", "http://localhost:3000"]
    except (json.JSONDecodeError, ValueError, TypeError):
        # If not JSON, treat as comma-separated string
        if cors_str.strip():
            origins = [origin.strip() for origin in cors_str.split(",") if origin.strip()]
            return origins if origins else ["http://localhost:5173", "http://localhost:3000"]
        return ["http://localhost:5173", "http://localhost:3000"]

# Debug: Log the raw CORS_ORIGINS value
logger.info(f"Raw CORS_ORIGINS from settings: {repr(settings.CORS_ORIGINS)}")
cors_origins = parse_cors_origins(settings.CORS_ORIGINS)
logger.info(f"CORS origins configured: {cors_origins}")
logger.info(f"Frontend origin 'https://aiforge-network.vercel.app' in allowed origins: {'https://aiforge-network.vercel.app' in cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers with error handling
def safe_include_router(module_name: str, router_attr: str, prefix: str, tags: list):
    """Safely include a router, logging errors if import fails"""
    try:
        module = __import__(f"app.api.{module_name}", fromlist=[router_attr])
        router = getattr(module, router_attr)
        app.include_router(router, prefix=prefix, tags=tags)
        logger.info(f"Successfully loaded router: {module_name}")
    except Exception as e:
        logger.error(f"Failed to load router {module_name}: {e}", exc_info=True)
        # Don't raise - allow app to continue with other routers

# Import and include routers
import_error_info = None
try:
    from app.api import auth, groups, models, nodes, jobs, wallets, payments, subscriptions, admin, api_services, openai_compatible, revenue, publishing, group_revenue, nft, infrastructure, chat, system_settings
    
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(groups.router, prefix="/api/groups", tags=["groups"])
    app.include_router(models.router, prefix="/api/models", tags=["models"])
    app.include_router(nodes.router, prefix="/api/nodes", tags=["nodes"])
    app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
    app.include_router(wallets.router, prefix="/api/wallets", tags=["wallets"])
    app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
    app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["subscriptions"])
    app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
    app.include_router(api_services.router, prefix="/api/marketplace", tags=["api-services"])
    app.include_router(openai_compatible.router, prefix="/api", tags=["openai-compatible"])
    app.include_router(revenue.router, prefix="/api/revenue", tags=["revenue"])
    app.include_router(publishing.router, prefix="/api/publishing", tags=["publishing"])
    app.include_router(group_revenue.router, prefix="/api/group-revenue", tags=["group-revenue"])
    app.include_router(nft.router, prefix="/api/nft", tags=["nft"])
    app.include_router(infrastructure.router, prefix="/api/infrastructure", tags=["infrastructure"])
    app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
    app.include_router(system_settings.router, prefix="/api/system", tags=["system"])
    logger.info("All routers loaded successfully")
except Exception as e:
    import traceback
    error_trace = traceback.format_exc()
    import_error_info = {
        "error": "Failed to import API routers",
        "message": str(e),
        "type": type(e).__name__,
        "traceback": error_trace.split("\n")[-30:]  # Last 30 lines
    }
    logger.error(f"Failed to import or include routers: {e}\n{error_trace}", exc_info=True)
    # Create a minimal error endpoint that shows the full error
    @app.get("/api/error")
    async def import_error():
        return import_error_info if import_error_info else {"error": "Unknown import error"}

@app.get("/")
async def root():
    return {"message": "AIForge Network API", "version": "0.1.0"}

@app.get("/health")
async def health():
    """Health check endpoint - tests database connection"""
    from app.core.database import engine
    from sqlalchemy import text
    try:
        if not engine:
            return {
                "status": "degraded",
                "database": "not_initialized",
                "error": "Database engine not initialized. Check DATABASE_URL environment variable."
            }
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database": "disconnected",
            "error": str(e)
        }

@app.get("/debug/db-tables")
async def debug_db_tables():
    """Debug endpoint to check if database tables exist"""
    from app.core.database import engine
    from sqlalchemy import text
    try:
        if not engine:
            return {"error": "Database engine not initialized"}
        
        with engine.connect() as conn:
            # Check if users table exists
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            
            # Check alembic version
            try:
                version_result = conn.execute(text("SELECT version_num FROM alembic_version"))
                version = version_result.scalar()
            except:
                version = "No migrations run"
            
            return {
                "tables": tables,
                "alembic_version": version,
                "users_table_exists": "users" in tables,
                "total_tables": len(tables)
            }
    except Exception as e:
        return {
            "error": str(e),
            "type": type(e).__name__
        }

@app.post("/debug/run-migrations")
async def debug_run_migrations():
    """Debug endpoint to manually run migrations"""
    import subprocess
    import os
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd="/app",
            capture_output=True,
            text=True,
            timeout=60
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except Exception as e:
        return {
            "error": str(e),
            "type": type(e).__name__
        }

