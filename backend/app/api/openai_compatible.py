"""
OpenAI-compatible API endpoints for AIForge Network
This allows integration with Continue.dev, ChatGPT-like apps, and other OpenAI-compatible tools
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.api_service import APIService, APISubscription, APIRequest
from app.schemas.api_service import OpenAICompletionRequest, OpenAICompletionResponse
from app.services.subscription_service import SubscriptionService
from typing import Optional
import hashlib
import time
import uuid
from decimal import Decimal

router = APIRouter()

def verify_api_key(api_key: str, db: Session) -> Optional[APISubscription]:
    """Verify API key and return subscription"""
    if not api_key:
        return None
    
    # Hash the provided API key
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    # Find subscription by API key hash
    subscription = db.query(APISubscription).filter(
        APISubscription.api_key_hash == api_key_hash,
        APISubscription.is_active == True
    ).first()
    
    if not subscription:
        return None
    
    # Check if subscription is expired
    from datetime import datetime
    if subscription.expires_at and subscription.expires_at < datetime.utcnow():
        subscription.is_active = False
        db.commit()
        return None
    
    return subscription

def check_rate_limit(subscription: APISubscription, service: APIService, db: Session) -> bool:
    """Check if request is within rate limits"""
    from datetime import datetime, timedelta
    
    # Check monthly limit
    if subscription.monthly_limit:
        if subscription.requests_used_this_month >= subscription.monthly_limit:
            # Check if we need to reset monthly counter
            if subscription.last_reset_at:
                days_since_reset = (datetime.utcnow() - subscription.last_reset_at).days
                if days_since_reset >= 30:
                    subscription.requests_used_this_month = 0
                    subscription.last_reset_at = datetime.utcnow()
                    db.commit()
                elif subscription.requests_used_this_month >= subscription.monthly_limit:
                    return False
            else:
                return False
    
    # TODO: Implement per-minute, per-hour, per-day rate limiting
    # For now, just check monthly limit
    
    return True

def calculate_cost(tokens_used: int, service: APIService, subscription: APISubscription) -> Decimal:
    """Calculate cost for API request"""
    if subscription.subscription_type.value == "subscription":
        # Subscription-based: no per-request cost
        return Decimal("0.00")
    elif subscription.subscription_type.value == "pay_per_request":
        if service.price_per_token:
            return Decimal(str(tokens_used)) * service.price_per_token
        elif service.price_per_request:
            return service.price_per_request
    return Decimal("0.00")

async def process_chat_completion(
    messages: list,
    model_name: str,
    service: APIService,
    subscription: APISubscription,
    db: Session,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None
) -> dict:
    """
    Process chat completion request
    This is a placeholder - in production, this would:
    1. Load the model from IPFS/MinIO
    2. Run inference using the model
    3. Return the response
    """
    # TODO: Implement actual model inference
    # For now, return a mock response
    
    # Mock response
    response_text = f"This is a mock response from {service.name}. Model inference not yet implemented."
    
    # Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    input_tokens = sum(len(msg.get("content", "")) for msg in messages) // 4
    output_tokens = len(response_text) // 4
    total_tokens = input_tokens + output_tokens
    
    # Calculate cost
    cost = calculate_cost(total_tokens, service, subscription)
    
    # Update subscription credits if pay-per-request
    if subscription.subscription_type.value == "pay_per_request":
        if subscription.credits_remaining < cost:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient credits"
            )
        subscription.credits_remaining -= cost
        subscription.total_spent += cost
    
    # Update usage statistics
    subscription.requests_used_this_month += 1
    subscription.total_requests += 1
    service.total_requests += 1
    service.total_revenue += cost
    
    # Create API request record
    api_request = APIRequest(
        subscription_id=subscription.id,
        service_id=service.id,
        request_data=str(messages),
        response_data=response_text,
        tokens_used=total_tokens,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost=cost,
        status="success"
    )
    
    db.add(api_request)
    db.commit()
    
    return {
        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": model_name,
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": response_text
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": input_tokens,
            "completion_tokens": output_tokens,
            "total_tokens": total_tokens
        }
    }

@router.post("/v1/chat/completions", response_model=OpenAICompletionResponse)
async def chat_completions(
    request: OpenAICompletionRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    OpenAI-compatible chat completions endpoint
    Usage: Authorization: Bearer <api_key>
    """
    # Extract API key from Authorization header
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    
    api_key = authorization.replace("Bearer ", "").strip()
    
    # Verify API key
    subscription = verify_api_key(api_key, db)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # Get service
    service = db.query(APIService).filter(APIService.id == subscription.service_id).first()
    if not service or not service.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API service not found or inactive"
        )
    
    # Check rate limits
    if not check_rate_limit(subscription, service, db):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )
    
    # Process chat completion
    try:
        response = await process_chat_completion(
            messages=request.messages,
            model_name=request.model,
            service=service,
            subscription=subscription,
            db=db,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        # Log error
        api_request = APIRequest(
            subscription_id=subscription.id,
            service_id=service.id,
            request_data=str(request.messages),
            response_data=None,
            tokens_used=0,
            input_tokens=0,
            output_tokens=0,
            cost=Decimal("0.00"),
            status="error",
            error_message=str(e)
        )
        db.add(api_request)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing request: {str(e)}"
        )

@router.get("/v1/models")
async def list_models(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    List available models (OpenAI-compatible)
    """
    # Verify API key if provided
    if authorization and authorization.startswith("Bearer "):
        api_key = authorization.replace("Bearer ", "").strip()
        subscription = verify_api_key(api_key, db)
        if subscription:
            # Return models for this subscription
            service = db.query(APIService).filter(APIService.id == subscription.service_id).first()
            if service:
                from app.models.model import Model
                model = db.query(Model).filter(Model.id == service.model_id).first()
                if model:
                    return {
                        "object": "list",
                        "data": [{
                            "id": f"aiforge-{service.id}",
                            "object": "model",
                            "created": int(time.time()),
                            "owned_by": "aiforge",
                            "permission": [],
                            "root": f"aiforge-{service.id}",
                            "parent": None
                        }]
                    }
    
    # Return all public models
    services = db.query(APIService).filter(
        APIService.is_public == True,
        APIService.is_active == True
    ).all()
    
    models_data = []
    for service in services:
        models_data.append({
            "id": f"aiforge-{service.id}",
            "object": "model",
            "created": int(time.time()),
            "owned_by": "aiforge",
            "permission": [],
            "root": f"aiforge-{service.id}",
            "parent": None
        })
    
    return {
        "object": "list",
        "data": models_data
    }

@router.get("/v1/services/{service_id}/chat")
async def service_chat_endpoint(
    service_id: int,
    db: Session = Depends(get_db)
):
    """Service-specific chat endpoint (redirects to OpenAI-compatible endpoint)"""
    service = db.query(APIService).filter(APIService.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    return {
        "message": "Use /api/v1/chat/completions with your API key",
        "service_id": service_id,
        "service_name": service.name
    }

