"""
Chat API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import (
    ConversationCreate, ConversationResponse, ConversationWithMessages,
    MessageCreate, MessageResponse,
    ChatCompletionRequest, ChatCompletionResponse
)
from app.services.chat_service import ChatService
from app.services.storage_service import storage_service
from app.core.ipfs import ipfs_client
import uuid
import json

router = APIRouter()

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new conversation"""
    conversation = ChatService.create_conversation(
        db=db,
        user_id=current_user.id,
        title=conversation_data.title,
        model_id=conversation_data.model_id,
        api_service_id=conversation_data.api_service_id
    )
    
    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        model_id=conversation.model_id,
        api_service_id=conversation.api_service_id,
        title=conversation.title,
        is_active=conversation.is_active,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        last_message_at=conversation.last_message_at,
        message_count=0
    )

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for current user"""
    conversations = ChatService.get_user_conversations(
        db, current_user.id, active_only
    )
    
    # Add message count
    result = []
    for conv in conversations:
        from sqlalchemy import func
        from app.models.chat import Message
        message_count = db.query(func.count(Message.id)).filter(
            Message.conversation_id == conv.id
        ).scalar() or 0
        
        result.append(ConversationResponse(
            id=conv.id,
            user_id=conv.user_id,
            model_id=conv.model_id,
            api_service_id=conv.api_service_id,
            title=conv.title,
            is_active=conv.is_active,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            last_message_at=conv.last_message_at,
            message_count=message_count
        ))
    
    return result

@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a conversation with messages"""
    conversation = ChatService.get_conversation(db, conversation_id, current_user.id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    messages = ChatService.get_conversation_messages(db, conversation_id)
    
    return ConversationWithMessages(
        id=conversation.id,
        user_id=conversation.user_id,
        model_id=conversation.model_id,
        api_service_id=conversation.api_service_id,
        title=conversation.title,
        is_active=conversation.is_active,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        last_message_at=conversation.last_message_at,
        messages=[MessageResponse.model_validate(msg) for msg in messages]
    )

@router.put("/conversations/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: int,
    title: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update conversation title"""
    try:
        conversation = ChatService.update_conversation_title(
            db, conversation_id, current_user.id, title
        )
        return {"message": "Title updated", "conversation": ConversationResponse.model_validate(conversation)}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete (deactivate) a conversation"""
    success = ChatService.delete_conversation(db, conversation_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return {"message": "Conversation deleted"}

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a message"""
    success = ChatService.delete_message(db, message_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    return {"message": "Message deleted"}

@router.put("/messages/{message_id}")
async def update_message(
    message_id: int,
    content: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a message content"""
    updated_message = ChatService.update_message(db, message_id, current_user.id, content)
    
    if not updated_message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or cannot be updated"
        )
    
    return MessageResponse.model_validate(updated_message)

@router.post("/messages/{message_id}/regenerate")
async def regenerate_message(
    message_id: int,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerate an assistant message"""
    try:
        result = await ChatService.regenerate_message(
            db, message_id, current_user.id, temperature, max_tokens
        )
        return {
            "message": MessageResponse.model_validate(result["message"]),
            "tokens_used": result.get("tokens_used"),
            "cost": result.get("cost")
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/conversations/{conversation_id}/fork")
async def fork_conversation(
    conversation_id: int,
    message_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fork a conversation from a specific message"""
    conversation = ChatService.get_conversation(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get messages up to the specified message (or all if not specified)
    if message_id:
        messages = ChatService.get_messages_up_to(db, conversation_id, message_id)
    else:
        messages = ChatService.get_conversation_messages(db, conversation_id)
    
    # Create new conversation
    new_conversation = ChatService.create_conversation(
        db=db,
        user_id=current_user.id,
        title=f"{conversation.title} (Fork)" if conversation.title else "Forked Conversation",
        model_id=conversation.model_id,
        api_service_id=conversation.api_service_id
    )
    
    # Copy messages
    for msg in messages:
        ChatService.add_message(
            db=db,
            conversation_id=new_conversation.id,
            role=msg.role,
            content=msg.content,
            model_name=msg.model_name,
            api_service_id=msg.api_service_id,
            tokens_used=msg.tokens_used,
            cost=msg.cost,
            metadata=msg.message_metadata
        )
    
    return ConversationResponse(
        id=new_conversation.id,
        user_id=new_conversation.user_id,
        model_id=new_conversation.model_id,
        api_service_id=new_conversation.api_service_id,
        title=new_conversation.title,
        is_active=new_conversation.is_active,
        created_at=new_conversation.created_at,
        updated_at=new_conversation.updated_at,
        last_message_at=new_conversation.last_message_at,
        message_count=len(messages)
    )

@router.get("/conversations/{conversation_id}/export")
async def export_conversation(
    conversation_id: int,
    format: str = "markdown",  # markdown, json, txt
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export a conversation in various formats"""
    from fastapi.responses import Response
    
    conversation = ChatService.get_conversation(db, conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    messages = ChatService.get_conversation_messages(db, conversation_id)
    
    if format == "json":
        import json
        data = {
            "conversation": {
                "id": conversation.id,
                "title": conversation.title,
                "model_id": conversation.model_id,
                "created_at": conversation.created_at.isoformat() if conversation.created_at else None,
                "updated_at": conversation.updated_at.isoformat() if conversation.updated_at else None,
            },
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "model_name": msg.model_name,
                    "tokens_used": msg.tokens_used,
                    "cost": msg.cost,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None,
                    "metadata": msg.message_metadata
                }
                for msg in messages
            ]
        }
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="conversation-{conversation_id}.json"'}
        )
    
    elif format == "txt":
        lines = [f"Conversation: {conversation.title or 'Untitled'}\n"]
        lines.append(f"Created: {conversation.created_at}\n\n" if conversation.created_at else "\n")
        for msg in messages:
            lines.append(f"{msg.role.upper()}: {msg.content}\n\n")
        return Response(
            content="".join(lines),
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="conversation-{conversation_id}.txt"'}
        )
    
    else:  # markdown
        lines = [f"# {conversation.title or 'Untitled Conversation'}\n\n"]
        if conversation.created_at:
            lines.append(f"**Created:** {conversation.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        lines.append("---\n\n")
        for msg in messages:
            role_emoji = "👤" if msg.role == "user" else "🤖"
            lines.append(f"## {role_emoji} {msg.role.capitalize()}\n\n")
            lines.append(f"{msg.content}\n\n")
            if msg.tokens_used:
                lines.append(f"*Tokens: {msg.tokens_used}*")
            if msg.cost:
                lines.append(f" *Cost: {msg.cost} USDT*")
            if msg.tokens_used or msg.cost:
                lines.append("\n")
            lines.append("---\n\n")
        return Response(
            content="".join(lines),
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="conversation-{conversation_id}.md"'}
        )

@router.post("/upload-attachment")
async def upload_chat_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file attachment (image, audio, document) for chat"""
    # Validate file type
    allowed_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    allowed_audio_types = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a']
    allowed_doc_types = ['application/pdf', 'text/plain', 'application/msword', 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    content_type = file.content_type or 'application/octet-stream'
    file_type = 'image' if content_type in allowed_image_types else \
                'audio' if content_type in allowed_audio_types else \
                'document' if content_type in allowed_doc_types else 'file'
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Limit file size (10MB for images/audio, 5MB for documents)
    max_size = 10 * 1024 * 1024 if file_type in ['image', 'audio'] else 5 * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {max_size // (1024*1024)}MB"
        )
    
    # Generate unique filename
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    object_name = f"{current_user.id}/{uuid.uuid4()}.{file_ext}" if file_ext else f"{current_user.id}/{uuid.uuid4()}"
    
    try:
        # Upload to storage
        storage_result = storage_service.upload_hybrid(
            file_content,
            use_ipfs=True
        )
        
        # Store in chat-attachments bucket for easy access
        minio_path = storage_service.upload_to_minio(
            'chat-attachments',
            object_name,
            file_content,
            content_type=content_type
        )
        
        return {
            "file_id": str(uuid.uuid4()),
            "filename": file.filename,
            "content_type": content_type,
            "file_type": file_type,
            "file_size": file_size,
            "minio_path": minio_path,
            "ipfs_cid": storage_result.get('ipfs_cid'),
            "ipfs_gateway_url": storage_result.get('ipfs_gateway_url'),
            "url": storage_result.get('ipfs_gateway_url') or f"/api/chat/attachments/{object_name}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.get("/attachments/{file_path:path}")
async def get_chat_attachment(
    file_path: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a chat attachment file"""
    from fastapi.responses import Response
    
    try:
        # Extract bucket and object name
        if '/' in file_path:
            parts = file_path.split('/', 1)
            bucket = parts[0] if parts[0] in ['chat-attachments', 'temp'] else 'chat-attachments'
            object_name = parts[1] if len(parts) > 1 else file_path
        else:
            bucket = 'chat-attachments'
            object_name = file_path
        
        # Get file from MinIO
        file_data = storage_service.get_from_minio(bucket, object_name)
        
        # Determine content type from extension
        import mimetypes
        content_type, _ = mimetypes.guess_type(object_name)
        if not content_type:
            content_type = 'application/octet-stream'
        
        return Response(content=file_data, media_type=content_type)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {str(e)}"
        )

@router.post("/completions", response_model=ChatCompletionResponse)
async def chat_completion(
    request: ChatCompletionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get AI response (ChatGPT-like)"""
    try:
        result = await ChatService.send_message(
            db=db,
            user_id=current_user.id,
            message_content=request.message,
            conversation_id=request.conversation_id,
            model_id=request.model_id,
            api_service_id=request.api_service_id,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return ChatCompletionResponse(
            conversation_id=result["conversation_id"],
            message=MessageResponse.model_validate(result["message"]),
            assistant_message=MessageResponse.model_validate(result["assistant_message"]),
            tokens_used=result.get("tokens_used"),
            cost=result.get("cost")
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )

@router.post("/completions-with-files", response_model=ChatCompletionResponse)
async def chat_completion_with_files(
    message: str = Form(...),
    conversation_id: Optional[int] = Form(None),
    model_id: Optional[int] = Form(None),
    api_service_id: Optional[int] = Form(None),
    temperature: Optional[float] = Form(0.7),
    max_tokens: Optional[int] = Form(None),
    files: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message with file attachments and get AI response"""
    try:
        # Upload files if provided
        attachments = []
        if files:
            for file in files:
                file_content = await file.read()
                file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
                object_name = f"{current_user.id}/{uuid.uuid4()}.{file_ext}" if file_ext else f"{current_user.id}/{uuid.uuid4()}"
                
                storage_result = storage_service.upload_hybrid(file_content, use_ipfs=True)
                minio_path = storage_service.upload_to_minio(
                    'chat-attachments',
                    object_name,
                    file_content,
                    content_type=file.content_type or 'application/octet-stream'
                )
                
                attachments.append({
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "file_size": len(file_content),
                    "minio_path": minio_path,
                    "ipfs_cid": storage_result.get('ipfs_cid'),
                    "ipfs_gateway_url": storage_result.get('ipfs_gateway_url'),
                    "url": storage_result.get('ipfs_gateway_url') or f"/api/chat/attachments/{object_name}"
                })
        
        # Add attachments to message content or metadata
        message_with_attachments = message
        if attachments:
            # Store attachments in metadata
            attachments_json = json.dumps(attachments)
            # Append attachment info to message
            message_with_attachments = f"{message}\n\n[Attachments: {len(attachments)} file(s)]"
        
        result = await ChatService.send_message(
            db=db,
            user_id=current_user.id,
            message_content=message_with_attachments,
            conversation_id=conversation_id,
            model_id=model_id,
            api_service_id=api_service_id,
            temperature=temperature,
            max_tokens=max_tokens,
            metadata={"attachments": attachments} if attachments else None
        )
        
        return ChatCompletionResponse(
            conversation_id=result["conversation_id"],
            message=MessageResponse.model_validate(result["message"]),
            assistant_message=MessageResponse.model_validate(result["assistant_message"]),
            tokens_used=result.get("tokens_used"),
            cost=result.get("cost")
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )

