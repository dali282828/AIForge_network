"""
Chat Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class MessageCreate(BaseModel):
    """Create a new message"""
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message content")
    metadata: Optional[Dict] = Field(None, description="Additional metadata")

class MessageResponse(BaseModel):
    """Message response"""
    id: int
    conversation_id: int
    role: str
    content: str
    model_name: Optional[str] = None
    api_service_id: Optional[int] = None
    tokens_used: Optional[int] = None
    cost: Optional[str] = None
    metadata: Optional[Dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    """Create a new conversation"""
    title: Optional[str] = Field(None, description="Conversation title")
    model_id: Optional[int] = Field(None, description="Optional: specific model ID")
    api_service_id: Optional[int] = Field(None, description="Optional: specific API service ID")

class ConversationResponse(BaseModel):
    """Conversation response"""
    id: int
    user_id: int
    model_id: Optional[int] = None
    api_service_id: Optional[int] = None
    title: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None
    message_count: Optional[int] = None
    
    class Config:
        from_attributes = True

class ConversationWithMessages(BaseModel):
    """Conversation with messages"""
    id: int
    user_id: int
    model_id: Optional[int] = None
    api_service_id: Optional[int] = None
    title: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True

class ChatCompletionRequest(BaseModel):
    """Chat completion request"""
    conversation_id: Optional[int] = Field(None, description="Existing conversation ID, or None for new")
    message: str = Field(..., description="User message")
    model_id: Optional[int] = Field(None, description="Model ID to use")
    api_service_id: Optional[int] = Field(None, description="API service ID to use")
    temperature: Optional[float] = Field(0.7, ge=0, le=2, description="Temperature for generation")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens to generate")
    stream: Optional[bool] = Field(False, description="Stream response")

class ChatCompletionResponse(BaseModel):
    """Chat completion response"""
    conversation_id: int
    message: MessageResponse
    assistant_message: MessageResponse
    tokens_used: Optional[int] = None
    cost: Optional[str] = None

