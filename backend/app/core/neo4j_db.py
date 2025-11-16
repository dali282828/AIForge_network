"""
Neo4j Database Connection and Session Management
"""
from neo4j import GraphDatabase
from app.core.config import settings
from typing import Generator
import logging

logger = logging.getLogger(__name__)

class Neo4jDriver:
    """Neo4j driver singleton"""
    _instance = None
    _driver = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Neo4jDriver, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._driver is None:
            try:
                self._driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
                )
                # Verify connectivity
                self._driver.verify_connectivity()
                logger.info("Neo4j connection established")
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j: {e}")
                raise
    
    def get_driver(self):
        """Get Neo4j driver instance"""
        return self._driver
    
    def close(self):
        """Close Neo4j driver"""
        if self._driver:
            self._driver.close()
            self._driver = None
            logger.info("Neo4j connection closed")

# Global driver instance
neo4j_driver = Neo4jDriver()

def get_db() -> Generator:
    """
    Dependency injection for Neo4j database session
    Yields a Neo4j session for use in FastAPI endpoints
    """
    driver = neo4j_driver.get_driver()
    session = driver.session(database=settings.NEO4J_DATABASE)
    try:
        yield session
    finally:
        session.close()

def execute_query(query: str, parameters: dict = None, session=None):
    """
    Execute a Cypher query
    """
    if session is None:
        driver = neo4j_driver.get_driver()
        with driver.session(database=settings.NEO4J_DATABASE) as session:
            return session.run(query, parameters or {})
    else:
        return session.run(query, parameters or {})

def execute_write_query(query: str, parameters: dict = None, session=None):
    """
    Execute a write transaction (CREATE, UPDATE, DELETE)
    """
    if session is None:
        driver = neo4j_driver.get_driver()
        with driver.session(database=settings.NEO4J_DATABASE) as session:
            return session.execute_write(lambda tx: tx.run(query, parameters or {}))
    else:
        return session.execute_write(lambda tx: tx.run(query, parameters or {}))

def execute_read_query(query: str, parameters: dict = None, session=None):
    """
    Execute a read transaction (MATCH, RETURN)
    """
    if session is None:
        driver = neo4j_driver.get_driver()
        with driver.session(database=settings.NEO4J_DATABASE) as session:
            return session.execute_read(lambda tx: tx.run(query, parameters or {}))
    else:
        return session.execute_read(lambda tx: tx.run(query, parameters or {}))

