"""
Chat Service for managing conversations and messages
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.chat import Conversation, Message
from app.models.user import User
from app.models.model import Model
from app.models.api_service import APIService, APISubscription
from app.api.openai_compatible import process_chat_completion
from decimal import Decimal

class ChatService:
    """Service for managing chat conversations and messages"""
    
    @staticmethod
    def create_conversation(
        db: Session,
        user_id: int,
        title: Optional[str] = None,
        model_id: Optional[int] = None,
        api_service_id: Optional[int] = None
    ) -> Conversation:
        """Create a new conversation"""
        conversation = Conversation(
            user_id=user_id,
            model_id=model_id,
            api_service_id=api_service_id,
            title=title or "New Conversation",
            is_active=True
        )
        
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        return conversation
    
    @staticmethod
    def get_user_conversations(
        db: Session,
        user_id: int,
        active_only: bool = True
    ) -> List[Conversation]:
        """Get all conversations for a user"""
        query = db.query(Conversation).filter(Conversation.user_id == user_id)
        
        if active_only:
            query = query.filter(Conversation.is_active == True)
        
        return query.order_by(Conversation.last_message_at.desc(), Conversation.created_at.desc()).all()
    
    @staticmethod
    def get_conversation(
        db: Session,
        conversation_id: int,
        user_id: Optional[int] = None
    ) -> Optional[Conversation]:
        """Get a conversation by ID"""
        query = db.query(Conversation).filter(Conversation.id == conversation_id)
        
        if user_id:
            query = query.filter(Conversation.user_id == user_id)
        
        return query.first()
    
    @staticmethod
    def get_conversation_messages(
        db: Session,
        conversation_id: int
    ) -> List[Message]:
        """Get all messages for a conversation"""
        return db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.asc()).all()
    
    @staticmethod
    def add_message(
        db: Session,
        conversation_id: int,
        role: str,
        content: str,
        model_name: Optional[str] = None,
        api_service_id: Optional[int] = None,
        tokens_used: Optional[int] = None,
        cost: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Message:
        """Add a message to a conversation"""
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            model_name=model_name,
            api_service_id=api_service_id,
            tokens_used=tokens_used,
            cost=cost,
            metadata=metadata
        )
        
        db.add(message)
        
        # Update conversation last message time
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        if conversation:
            conversation.last_message_at = datetime.utcnow()
            conversation.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(message)
        
        return message
    
    @staticmethod
    async def send_message(
        db: Session,
        user_id: int,
        message_content: str,
        conversation_id: Optional[int] = None,
        model_id: Optional[int] = None,
        api_service_id: Optional[int] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Send a message and get AI response"""
        # Get or create conversation
        if conversation_id:
            conversation = ChatService.get_conversation(db, conversation_id, user_id)
            if not conversation:
                raise ValueError("Conversation not found")
        else:
            conversation = ChatService.create_conversation(
                db, user_id, model_id=model_id, api_service_id=api_service_id
            )
        
        # Get API service
        if api_service_id:
            api_service = db.query(APIService).filter(
                APIService.id == api_service_id,
                APIService.is_active == True
            ).first()
            if not api_service:
                raise ValueError("API service not found or inactive")
        elif conversation.api_service_id:
            api_service = db.query(APIService).filter(
                APIService.id == conversation.api_service_id,
                APIService.is_active == True
            ).first()
        else:
            raise ValueError("No API service specified")
        
        # Get user's subscription to this API service
        subscription = db.query(APISubscription).filter(
            APISubscription.user_id == user_id,
            APISubscription.service_id == api_service.id,
            APISubscription.is_active == True
        ).first()
        
        if not subscription:
            raise ValueError("No active subscription to this API service")
        
        # Get conversation history
        messages = ChatService.get_conversation_messages(db, conversation.id)
        message_history = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        # Add user message
        message_history.append({"role": "user", "content": message_content})
        
        # Save user message
        user_message = ChatService.add_message(
            db,
            conversation.id,
            role="user",
            content=message_content,
            metadata=metadata
        )
        
        # Process chat completion
        try:
            response = await process_chat_completion(
                messages=message_history,
                model_name=api_service.name,
                service=api_service,
                subscription=subscription,
                db=db,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Extract response
            assistant_content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
            tokens_used = response.get("usage", {}).get("total_tokens")
            cost = response.get("cost")
            
            # Save assistant message
            assistant_message = ChatService.add_message(
                db,
                conversation.id,
                role="assistant",
                content=assistant_content,
                model_name=api_service.name,
                api_service_id=api_service.id,
                tokens_used=tokens_used,
                cost=str(cost) if cost else None,
                metadata={"temperature": temperature, "max_tokens": max_tokens}
            )
            
            return {
                "conversation_id": conversation.id,
                "message": user_message,
                "assistant_message": assistant_message,
                "tokens_used": tokens_used,
                "cost": str(cost) if cost else None
            }
        except Exception as e:
            # Save error message
            error_message = ChatService.add_message(
                db,
                conversation.id,
                role="assistant",
                content=f"Error: {str(e)}",
                model_name=api_service.name,
                api_service_id=api_service.id
            )
            raise
    
    @staticmethod
    def update_conversation_title(
        db: Session,
        conversation_id: int,
        user_id: int,
        title: str
    ) -> Conversation:
        """Update conversation title"""
        conversation = ChatService.get_conversation(db, conversation_id, user_id)
        if not conversation:
            raise ValueError("Conversation not found")
        
        conversation.title = title
        conversation.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conversation)
        
        return conversation
    
    @staticmethod
    def delete_conversation(
        db: Session,
        conversation_id: int,
        user_id: int
    ) -> bool:
        """Delete (deactivate) a conversation"""
        conversation = ChatService.get_conversation(db, conversation_id, user_id)
        if not conversation:
            return False
        
        conversation.is_active = False
        conversation.updated_at = datetime.utcnow()
        db.commit()
        
        return True
    
    @staticmethod
    def delete_message(
        db: Session,
        message_id: int,
        user_id: int
    ) -> bool:
        """Delete a message and optionally cascade delete"""
        from app.models.chat import Message
        
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            return False
        
        # Verify conversation ownership
        conversation = ChatService.get_conversation(db, message.conversation_id, user_id)
        if not conversation:
            return False
        
        # If deleting user message, also delete assistant response if it's the next message
        if message.role == "user":
            # Find next assistant message
            next_assistant = db.query(Message).filter(
                Message.conversation_id == message.conversation_id,
                Message.role == "assistant",
                Message.created_at > message.created_at
            ).order_by(Message.created_at.asc()).first()
            
            if next_assistant:
                # Check if there are other user messages between
                user_between = db.query(Message).filter(
                    Message.conversation_id == message.conversation_id,
                    Message.role == "user",
                    Message.created_at > message.created_at,
                    Message.created_at < next_assistant.created_at
                ).first()
                
                if not user_between:
                    db.delete(next_assistant)
        
        db.delete(message)
        db.commit()
        return True
    
    @staticmethod
    def update_message(
        db: Session,
        message_id: int,
        user_id: int,
        new_content: str
    ) -> Optional[Message]:
        """Update a message content"""
        from app.models.chat import Message
        
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            return None
        
        # Verify conversation ownership
        conversation = ChatService.get_conversation(db, message.conversation_id, user_id)
        if not conversation:
            return None
        
        # Only allow editing user messages
        if message.role != "user":
            return None
        
        message.content = new_content
        db.commit()
        db.refresh(message)
        return message
    
    @staticmethod
    def get_messages_up_to(
        db: Session,
        conversation_id: int,
        message_id: int
    ) -> List[Message]:
        """Get all messages up to and including a specific message"""
        from app.models.chat import Message
        
        target_message = db.query(Message).filter(Message.id == message_id).first()
        if not target_message:
            return []
        
        return db.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.created_at <= target_message.created_at
        ).order_by(Message.created_at.asc()).all()
    
    @staticmethod
    async def regenerate_message(
        db: Session,
        message_id: int,
        user_id: int,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """Regenerate an assistant message"""
        from app.models.chat import Message
        from app.models.api_service import APIService, APISubscription
        from app.api.openai_compatible import process_chat_completion
        
        assistant_message = db.query(Message).filter(Message.id == message_id).first()
        if not assistant_message or assistant_message.role != "assistant":
            raise ValueError("Message not found or not an assistant message")
        
        # Verify conversation ownership
        conversation = ChatService.get_conversation(db, assistant_message.conversation_id, user_id)
        if not conversation:
            raise ValueError("Conversation not found")
        
        # Get API service
        if not conversation.api_service_id:
            raise ValueError("No API service specified")
        
        api_service = db.query(APIService).filter(
            APIService.id == conversation.api_service_id,
            APIService.is_active == True
        ).first()
        
        if not api_service:
            raise ValueError("API service not found")
        
        # Get subscription
        subscription = db.query(APISubscription).filter(
            APISubscription.user_id == user_id,
            APISubscription.service_id == api_service.id,
            APISubscription.is_active == True
        ).first()
        
        if not subscription:
            raise ValueError("No active subscription")
        
        # Get conversation history up to this message
        messages = ChatService.get_conversation_messages(db, conversation.id)
        message_history = []
        for msg in messages:
            if msg.id == assistant_message.id:
                break
            message_history.append({"role": msg.role, "content": msg.content})
        
        # Use original temperature/max_tokens if not specified
        original_metadata = assistant_message.message_metadata or {}
        temp = temperature if temperature is not None else original_metadata.get("temperature", 0.7)
        max_toks = max_tokens if max_tokens is not None else original_metadata.get("max_tokens")
        
        # Regenerate
        response = await process_chat_completion(
            messages=message_history,
            model_name=api_service.name,
            service=api_service,
            subscription=subscription,
            db=db,
            temperature=temp,
            max_tokens=max_toks
        )
        
        # Update message
        assistant_content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        tokens_used = response.get("usage", {}).get("total_tokens")
        cost = response.get("cost")
        
        assistant_message.content = assistant_content
        assistant_message.tokens_used = tokens_used
        assistant_message.cost = str(cost) if cost else None
        assistant_message.message_metadata = {"temperature": temp, "max_tokens": max_toks}
        
        db.commit()
        db.refresh(assistant_message)
        
        return {
            "message": assistant_message,
            "tokens_used": tokens_used,
            "cost": str(cost) if cost else None
        }

