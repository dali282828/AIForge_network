from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.revenue_service import RevenueService
from app.services.wallet_service import WalletService
from app.models.wallet import WalletNetwork
from typing import Optional, Tuple

router = APIRouter()

async def verify_admin_wallet(
    x_wallet_address: Optional[str] = Header(None),
    x_wallet_network: Optional[str] = Header(None),
) -> Tuple[str, WalletNetwork]:
    """Verify admin wallet from headers (Ethereum or Tron for admin)"""
    if not x_wallet_address or not x_wallet_network:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin wallet headers required"
        )
    
    try:
        network = WalletNetwork(x_wallet_network.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid network. Must be 'ethereum' or 'tron'"
        )
    
    # Admin can use both Ethereum and Tron networks
    # Normalize address based on network
    if network == WalletNetwork.ETHEREUM:
        normalized_address = x_wallet_address.lower()
    else:  # Tron
        normalized_address = x_wallet_address  # Tron addresses are case-sensitive
    
    if not WalletService.is_admin_wallet(normalized_address, network):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Wallet not authorized as admin"
        )
    
    return normalized_address, network

@router.get("/summary")
async def get_revenue_summary(
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get overall platform revenue summary (admin only)"""
    return RevenueService.get_platform_revenue_summary(db)

@router.get("/monthly/{year}/{month}")
async def get_monthly_revenue(
    year: int,
    month: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get revenue breakdown for a specific month (admin only)"""
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month"
        )
    
    return RevenueService.calculate_monthly_revenue(db, year, month)

@router.get("/distribution/{year}/{month}")
async def get_revenue_distribution(
    year: int,
    month: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get subscription revenue distribution to model creators (admin only)"""
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month"
        )
    
    return RevenueService.calculate_subscription_revenue_distribution(db, year, month)

@router.get("/model/{model_id}/{year}/{month}")
async def get_model_revenue(
    model_id: int,
    year: int,
    month: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get revenue for a specific model (admin only)"""
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month"
        )
    
    return RevenueService.calculate_model_usage_revenue(db, model_id, year, month)

@router.get("/my-earnings")
async def get_my_earnings(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get earnings for current user (model creator)"""
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
    
    return RevenueService.get_model_creator_earnings(db, current_user.id, year, month)

