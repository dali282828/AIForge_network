from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.subscription import (
    SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse, SubscriptionPlanInfo
)
from app.services.subscription_service import SubscriptionService, SUBSCRIPTION_PLANS
from app.models.subscription import SubscriptionPlan
from typing import List

router = APIRouter()

@router.get("/plans", response_model=List[SubscriptionPlanInfo])
async def get_subscription_plans():
    """Get all available subscription plans"""
    plans = []
    for plan_type, plan_info in SUBSCRIPTION_PLANS.items():
        plans.append(SubscriptionPlanInfo(
            plan_type=plan_type,
            name=plan_info["name"],
            price=plan_info["price"],
            request_limit=plan_info["request_limit"],
            features=plan_info["features"]
        ))
    return plans

@router.post("/create", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new subscription"""
    try:
        subscription = SubscriptionService.create_subscription(
            db=db,
            user_id=current_user.id,
            plan_type=subscription_data.plan_type,
            wallet_id=subscription_data.wallet_id,
            auto_renew=subscription_data.auto_renew
        )
        return subscription
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/my-subscription", response_model=SubscriptionResponse)
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscription"""
    subscription = SubscriptionService.get_user_subscription(db, current_user.id)
    
    if not subscription:
        # Return free plan as default
        plan_info = SubscriptionService.get_plan_info(SubscriptionPlan.FREE)
        return SubscriptionResponse(
            id=0,
            user_id=current_user.id,
            plan_type=SubscriptionPlan.FREE,
            price=plan_info["price"],
            currency="USDT",
            status="active",
            auto_renew=False,
            started_at=None,
            expires_at=None,
            cancelled_at=None,
            request_limit=plan_info["request_limit"],
            requests_used=0,
            next_billing_date=None,
            created_at=None
        )
    
    return subscription

@router.post("/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a subscription"""
    try:
        subscription = SubscriptionService.cancel_subscription(
            db=db,
            subscription_id=subscription_id,
            user_id=current_user.id
        )
        return subscription
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/upgrade", response_model=SubscriptionResponse)
async def upgrade_subscription(
    plan_type: SubscriptionPlan,
    wallet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upgrade or change subscription plan"""
    try:
        subscription = SubscriptionService.create_subscription(
            db=db,
            user_id=current_user.id,
            plan_type=plan_type,
            wallet_id=wallet_id,
            auto_renew=True
        )
        return subscription
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

