"""
Infrastructure Investment API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.model import Model
from app.models.infrastructure import (
    InfrastructureInvestment, InfrastructureUsage, InfrastructurePayout,
    InfrastructureProvider, InfrastructureType, InfrastructureStatus
)
from app.schemas.infrastructure import (
    InfrastructureInvestmentCreate, InfrastructureInvestmentResponse,
    InfrastructureUsageResponse, InfrastructurePayoutResponse,
    AllocateInfrastructureRequest, MyInfrastructureResponse,
    InfrastructureStatsResponse
)
from app.services.infrastructure_service import InfrastructureService
from decimal import Decimal

router = APIRouter()

@router.post("/invest", response_model=InfrastructureInvestmentResponse, status_code=status.HTTP_201_CREATED)
async def create_investment(
    investment_data: InfrastructureInvestmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new infrastructure investment"""
    # Verify group if provided
    if investment_data.group_id:
        from app.models.group import Group, GroupMembership
        group = db.query(Group).filter(Group.id == investment_data.group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )
        
        # Verify user is member of group
        membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == investment_data.group_id,
            GroupMembership.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a member of the group to invest"
            )
    
    investment = InfrastructureService.create_investment(
        db=db,
        investor_id=current_user.id,
        provider=investment_data.provider,
        infrastructure_type=investment_data.infrastructure_type,
        resource_specs=investment_data.resource_specs,
        group_id=investment_data.group_id,
        connection_info=investment_data.connection_info
    )
    
    return InfrastructureInvestmentResponse.model_validate(investment)

@router.get("/my-investments", response_model=MyInfrastructureResponse)
async def get_my_investments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's infrastructure investments"""
    investments = InfrastructureService.get_user_investments(db, current_user.id)
    
    total_earnings = sum(Decimal(str(inv.total_earnings)) for inv in investments)
    active_count = sum(1 for inv in investments if inv.status == InfrastructureStatus.ACTIVE)
    
    return MyInfrastructureResponse(
        investments=[InfrastructureInvestmentResponse.model_validate(inv) for inv in investments],
        total_earnings=str(total_earnings),
        active_investments=active_count
    )

@router.get("/available", response_model=List[InfrastructureInvestmentResponse])
async def get_available_investments(
    infrastructure_type: Optional[InfrastructureType] = Query(None),
    db: Session = Depends(get_db)
):
    """Get available infrastructure investments"""
    investments = InfrastructureService.get_available_investments(
        db, infrastructure_type
    )
    return [InfrastructureInvestmentResponse.model_validate(inv) for inv in investments]

@router.post("/{investment_id}/activate", response_model=InfrastructureInvestmentResponse)
async def activate_investment(
    investment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Activate an infrastructure investment"""
    investment = db.query(InfrastructureInvestment).filter(
        InfrastructureInvestment.id == investment_id,
        InfrastructureInvestment.investor_id == current_user.id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    investment = InfrastructureService.activate_investment(db, investment_id)
    return InfrastructureInvestmentResponse.model_validate(investment)

@router.post("/{investment_id}/allocate", response_model=InfrastructureInvestmentResponse)
async def allocate_investment(
    investment_id: int,
    allocation_data: AllocateInfrastructureRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allocate infrastructure to a model"""
    investment = db.query(InfrastructureInvestment).filter(
        InfrastructureInvestment.id == investment_id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    # Verify user owns investment or is model owner
    model = db.query(Model).filter(Model.id == allocation_data.model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    if investment.investor_id != current_user.id and model.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must own the investment or the model to allocate"
        )
    
    investment = InfrastructureService.allocate_to_model(
        db, investment_id, allocation_data.model_id
    )
    return InfrastructureInvestmentResponse.model_validate(investment)

@router.post("/{investment_id}/deallocate", response_model=InfrastructureInvestmentResponse)
async def deallocate_investment(
    investment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deallocate infrastructure from model"""
    investment = db.query(InfrastructureInvestment).filter(
        InfrastructureInvestment.id == investment_id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    if investment.investor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the investor can deallocate"
        )
    
    investment = InfrastructureService.deallocate_from_model(db, investment_id)
    return InfrastructureInvestmentResponse.model_validate(investment)

@router.get("/{investment_id}/earnings")
async def get_investment_earnings(
    investment_id: int,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get earnings for an investment"""
    investment = db.query(InfrastructureInvestment).filter(
        InfrastructureInvestment.id == investment_id
    ).first()
    
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    if investment.investor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    earnings = InfrastructureService.get_investment_earnings(
        db, investment_id, year, month
    )
    
    return {
        **earnings,
        "usage_records": [
            InfrastructureUsageResponse(
                id=r.id,
                investment_id=r.investment_id,
                model_id=r.model_id,
                job_id=r.job_id,
                period=f"{r.period_year}-{r.period_month:02d}",
                hours_used=str(r.hours_used),
                requests_processed=r.requests_processed,
                tokens_processed=r.tokens_processed,
                earnings=str(r.earnings),
                earnings_rate=str(r.earnings_rate),
                created_at=r.created_at
            )
            for r in earnings["usage_records"]
        ]
    }

@router.get("/stats", response_model=InfrastructureStatsResponse)
async def get_infrastructure_stats(
    db: Session = Depends(get_db)
):
    """Get infrastructure statistics (public)"""
    stats = InfrastructureService.get_infrastructure_stats(db)
    return InfrastructureStatsResponse(**stats)

