"""
Chat Models for ChatGPT-like interface
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Conversation(Base):
    """Chat conversation"""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=True, index=True)  # Optional: specific model
    api_service_id = Column(Integer, ForeignKey("api_services.id"), nullable=True, index=True)  # Optional: specific API service
    
    # Conversation metadata
    title = Column(String, nullable=True)  # Auto-generated or user-set title
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    model = relationship("Model", foreign_keys=[model_id])
    api_service = relationship("APIService", foreign_keys=[api_service_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    """Chat message"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    
    # Message content
    role = Column(String, nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    
    # Model/API info
    model_name = Column(String, nullable=True)  # Model used for this message
    api_service_id = Column(Integer, ForeignKey("api_services.id"), nullable=True)
    
    # Usage tracking
    tokens_used = Column(Integer, nullable=True)
    cost = Column(String, nullable=True)  # Cost in USDT
    
    # Metadata
    message_metadata = Column(JSON, nullable=True)  # Additional metadata (temperature, etc.)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    api_service = relationship("APIService", foreign_keys=[api_service_id])

