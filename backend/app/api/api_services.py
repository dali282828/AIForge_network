from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.api_service import APIService, APISubscription, PricingType
from app.models.model import Model
from app.models.wallet import UserWallet
from app.schemas.api_service import (
    APIServiceCreate, APIServiceUpdate, APIServiceResponse,
    APISubscriptionCreate, APISubscriptionResponse
)
from app.services.payment_service import PaymentService
from app.models.payment import PaymentType
from typing import List, Optional
import secrets
import hashlib
from datetime import datetime, timedelta

router = APIRouter()

def generate_api_key(service_id: int, user_id: int) -> tuple[str, str]:
    """Generate API key and its hash"""
    # Generate a secure random API key
    random_part = secrets.token_urlsafe(32)
    api_key = f"aiforge_{service_id}_{user_id}_{random_part}"
    
    # Hash the API key for storage
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    return api_key, api_key_hash

@router.post("/create", response_model=APIServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_api_service(
    service_data: APIServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new API service for a model"""
    # Verify model exists and user has access
    model = db.query(Model).filter(Model.id == service_data.model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Check if user owns the model or has access through group
    if model.owner_id != current_user.id:
        # Check group membership
        from app.models.group import GroupMembership
        membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == model.group_id,
            GroupMembership.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this model"
            )
    
    # Generate API endpoint and key prefix
    api_endpoint = f"/api/v1/services/{service_data.model_id}/chat"
    api_key_prefix = f"aiforge_{service_data.model_id}_{current_user.id}"
    
    # Create API service
    api_service = APIService(
        name=service_data.name,
        description=service_data.description,
        model_id=service_data.model_id,
        owner_id=current_user.id,
        api_endpoint=api_endpoint,
        api_key_prefix=api_key_prefix,
        pricing_type=service_data.pricing_type,
        subscription_price=service_data.subscription_price,
        price_per_request=service_data.price_per_request,
        price_per_token=service_data.price_per_token,
        rate_limit_per_minute=service_data.rate_limit_per_minute,
        rate_limit_per_hour=service_data.rate_limit_per_hour,
        rate_limit_per_day=service_data.rate_limit_per_day,
        is_active=True,
        is_public=service_data.is_public
    )
    
    db.add(api_service)
    db.commit()
    db.refresh(api_service)
    
    return api_service

@router.get("/marketplace", response_model=List[APIServiceResponse])
async def get_marketplace_services(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all public API services in marketplace"""
    offset = (page - 1) * page_size
    services = db.query(APIService).filter(
        APIService.is_public == True,
        APIService.is_active == True
    ).offset(offset).limit(page_size).all()
    
    return services

@router.get("/my-services", response_model=List[APIServiceResponse])
async def get_my_services(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all API services owned by current user"""
    services = db.query(APIService).filter(
        APIService.owner_id == current_user.id
    ).all()
    return services

@router.get("/{service_id}", response_model=APIServiceResponse)
async def get_api_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    """Get API service details"""
    service = db.query(APIService).filter(APIService.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API service not found"
        )
    return service

@router.put("/{service_id}", response_model=APIServiceResponse)
async def update_api_service(
    service_id: int,
    service_data: APIServiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update API service (owner only)"""
    service = db.query(APIService).filter(APIService.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API service not found"
        )
    
    if service.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Update fields
    if service_data.name is not None:
        service.name = service_data.name
    if service_data.description is not None:
        service.description = service_data.description
    if service_data.pricing_type is not None:
        service.pricing_type = service_data.pricing_type
    if service_data.subscription_price is not None:
        service.subscription_price = service_data.subscription_price
    if service_data.price_per_request is not None:
        service.price_per_request = service_data.price_per_request
    if service_data.price_per_token is not None:
        service.price_per_token = service_data.price_per_token
    if service_data.rate_limit_per_minute is not None:
        service.rate_limit_per_minute = service_data.rate_limit_per_minute
    if service_data.rate_limit_per_hour is not None:
        service.rate_limit_per_hour = service_data.rate_limit_per_hour
    if service_data.rate_limit_per_day is not None:
        service.rate_limit_per_day = service_data.rate_limit_per_day
    if service_data.is_active is not None:
        service.is_active = service_data.is_active
    if service_data.is_public is not None:
        service.is_public = service_data.is_public
    
    db.commit()
    db.refresh(service)
    
    return service

@router.post("/{service_id}/subscribe", response_model=APISubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def subscribe_to_api_service(
    service_id: int,
    subscription_data: APISubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe to an API service"""
    # Verify service exists
    service = db.query(APIService).filter(APIService.id == service_id).first()
    if not service or not service.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API service not found or inactive"
        )
    
    # Verify wallet
    wallet = db.query(UserWallet).filter(
        UserWallet.id == subscription_data.wallet_id,
        UserWallet.user_id == current_user.id
    ).first()
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found"
        )
    
    # Check if already subscribed
    existing = db.query(APISubscription).filter(
        APISubscription.service_id == service_id,
        APISubscription.user_id == current_user.id,
        APISubscription.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to this service"
        )
    
    # Generate API key
    api_key, api_key_hash = generate_api_key(service_id, current_user.id)
    
    # Calculate expiration and credits
    expires_at = None
    credits_remaining = 0.0
    
    if subscription_data.subscription_type == PricingType.SUBSCRIPTION:
        if not service.subscription_price or service.subscription_price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Service does not support subscription pricing"
            )
        expires_at = datetime.utcnow() + timedelta(days=30)
        
        # Create payment (if subscription type)
    payment = None
    if subscription_data.subscription_type == PricingType.SUBSCRIPTION:
        from app.models.wallet import WalletNetwork
        platform_wallet = PaymentService.get_platform_wallet(wallet.network)
        
        payment = PaymentService.create_payment(
            db=db,
            payment_type=PaymentType.API_SUBSCRIPTION,
            amount=service.subscription_price,
            from_wallet_id=subscription_data.wallet_id,
            from_address=wallet.wallet_address,
            to_address=platform_wallet,
            network=wallet.network,
            api_subscription_id=None,  # Will update after creation
            metadata={"service_id": service_id}
        )
    elif subscription_data.subscription_type == PricingType.PAY_PER_REQUEST:
        # For pay-per-request, user needs to add credits
        credits_remaining = 0.0
    
    # Create subscription
    api_subscription = APISubscription(
        service_id=service_id,
        user_id=current_user.id,
        api_key=api_key,
        api_key_hash=api_key_hash,
        subscription_type=subscription_data.subscription_type,
        credits_remaining=credits_remaining,
        monthly_limit=service.rate_limit_per_day * 30 if subscription_data.subscription_type == PricingType.SUBSCRIPTION else None,
        requests_used_this_month=0,
        is_active=True,
        expires_at=expires_at,
        last_reset_at=datetime.utcnow(),
        last_payment_id=payment.id if subscription_data.subscription_type == PricingType.SUBSCRIPTION else None,
        next_billing_date=expires_at if subscription_data.subscription_type == PricingType.SUBSCRIPTION else None
    )
    
    db.add(api_subscription)
    
    # Update payment with subscription ID
    if subscription_data.subscription_type == PricingType.SUBSCRIPTION:
        payment.api_subscription_id = api_subscription.id
    
    # Update service stats
    service.total_subscribers += 1
    
    db.commit()
    db.refresh(api_subscription)
    
    return api_subscription

@router.get("/my-subscriptions", response_model=List[APISubscriptionResponse])
async def get_my_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all API subscriptions for current user"""
    subscriptions = db.query(APISubscription).filter(
        APISubscription.user_id == current_user.id
    ).all()
    return subscriptions

