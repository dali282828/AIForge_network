from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.model import Model
from app.models.group import GroupMembership
from app.schemas.group_revenue import (
    RevenueSplitConfig, RevenueSplitResponse, RevenueDistributionResponse, UserGroupEarningsResponse
)
from app.services.group_revenue_service import GroupRevenueService
from typing import Optional

router = APIRouter()

@router.post("/model/{model_id}/split", response_model=RevenueSplitResponse)
async def configure_revenue_split(
    model_id: int,
    split_config: RevenueSplitConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Configure revenue split for a group model (owner only)"""
    # Verify model ownership
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    if model.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only model owner can configure revenue split"
        )
    
    # Verify all users in split are group members
    group_memberships = db.query(GroupMembership).filter(
        GroupMembership.group_id == model.group_id
    ).all()
    group_member_ids = {m.user_id for m in group_memberships}
    
    for user_id in split_config.split_config.keys():
        if user_id not in group_member_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {user_id} is not a member of the group"
            )
    
    try:
        split = GroupRevenueService.create_or_update_split(
            model_id=model_id,
            split_config=split_config.split_config,
            min_percentage=split_config.min_percentage,
            usage_bonus=split_config.usage_bonus,
            db=db
        )
        
        return RevenueSplitResponse(
            model_id=split.model_id,
            group_id=split.group_id,
            split_config=split_config.split_config,
            min_percentage=split_config.min_percentage,
            usage_bonus=split_config.usage_bonus
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/model/{model_id}/split", response_model=RevenueSplitResponse)
async def get_revenue_split(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get revenue split configuration for a model"""
    # Verify user has access to model
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Check if user is owner or group member
    is_owner = model.owner_id == current_user.id
    is_member = db.query(GroupMembership).filter(
        GroupMembership.group_id == model.group_id,
        GroupMembership.user_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    split_data = GroupRevenueService.get_split_config(model_id, db)
    if not split_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No revenue split configuration found"
        )
    
    return RevenueSplitResponse(**split_data)

@router.get("/model/{model_id}/split/default")
async def get_default_split(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get default equal split for a group model"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    if model.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only model owner can view default split"
        )
    
    default_split = GroupRevenueService.get_default_split_for_group(model.group_id, db)
    
    return {
        "model_id": model_id,
        "group_id": model.group_id,
        "default_split": default_split,
        "message": "Equal split among all group members"
    }

@router.get("/model/{model_id}/distribution/{year}/{month}", response_model=RevenueDistributionResponse)
async def get_revenue_distribution(
    model_id: int,
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get revenue distribution for a model for a specific period"""
    # Verify user has access
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    is_owner = model.owner_id == current_user.id
    is_member = db.query(GroupMembership).filter(
        GroupMembership.group_id == model.group_id,
        GroupMembership.user_id == current_user.id
    ).first() is not None
    
    if not (is_owner or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month"
        )
    
    try:
        dist_data = GroupRevenueService.calculate_group_revenue_distribution(
            model_id, year, month, db
        )
        return RevenueDistributionResponse(**dist_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/model/{model_id}/distribute/{year}/{month}")
async def distribute_revenue(
    model_id: int,
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Distribute revenue for a model (owner or admin only)"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model or model.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only model owner can distribute revenue"
        )
    
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month"
        )
    
    try:
        distribution = GroupRevenueService.distribute_revenue(model_id, year, month, db)
        return {
            "message": "Revenue distributed successfully",
            "distribution_id": distribution.id,
            "period": f"{year}-{month:02d}"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/my-group-earnings", response_model=UserGroupEarningsResponse)
async def get_my_group_earnings(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's earnings from group models"""
    if (year and not month) or (month and not year):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both year and month must be provided together"
        )
    
    if month and (month < 1 or month > 12):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month"
        )
    
    earnings = GroupRevenueService.get_user_earnings_from_groups(
        current_user.id, year, month, db
    )
    
    return UserGroupEarningsResponse(**earnings)

