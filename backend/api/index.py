"""
Vercel serverless function entry point for FastAPI
"""
import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    logger.info("Starting FastAPI app initialization...")
    from app.main import app
    from mangum import Mangum
    
    # Create ASGI adapter for Vercel
    handler = Mangum(app, lifespan="off")
    
    logger.info("FastAPI app initialized successfully")
except Exception as e:
    import traceback
    error_trace = traceback.format_exc()
    logger.error(f"Failed to initialize FastAPI app: {e}\n{error_trace}")
    
    # Create a minimal error handler that shows the error
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    
    error_app = FastAPI(title="AIForge Network API - Error Mode")
    
    @error_app.get("/")
    async def root_error():
        return JSONResponse(
            status_code=500,
            content={
                "error": "Application initialization failed",
                "message": str(e),
                "type": type(e).__name__,
                "traceback": error_trace.split("\n")[-10:]  # Last 10 lines
            }
        )
    
    @error_app.get("/health")
    async def health_error():
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "error": "Application initialization failed",
                "message": str(e)
            }
        )
    
    @error_app.exception_handler(Exception)
    async def error_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Application initialization failed",
                "message": str(e),
                "type": type(e).__name__,
                "request_path": str(request.url)
            }
        )
    
    from mangum import Mangum
    handler = Mangum(error_app, lifespan="off")
    logger.info("Error handler app created")

# Export handler for Vercel
__all__ = ["handler"]

