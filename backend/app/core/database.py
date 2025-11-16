from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create engine with connection pooling and lazy connection
# pool_pre_ping=True ensures connections are checked before use
# connect_args={"connect_timeout": 10} sets connection timeout
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=300,  # Recycle connections after 5 minutes
        connect_args={"connect_timeout": 10} if "postgresql" in settings.DATABASE_URL else {}
    )
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    # Create a dummy engine that will fail on first use
    # This allows the app to start even if DATABASE_URL is invalid
    engine = None

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None

Base = declarative_base()

def get_db():
    if not engine or not SessionLocal:
        raise Exception("Database engine not initialized. Check DATABASE_URL environment variable.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

