from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.wallet import UserWallet
from app.schemas.wallet import WalletConnect, WalletVerify, UserWalletResponse
from app.services.wallet_service import WalletService
from typing import List

router = APIRouter()

@router.post("/connect", response_model=UserWalletResponse, status_code=status.HTTP_201_CREATED)
async def connect_wallet(
    wallet_data: WalletConnect,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect a wallet to user account (Tron-only for regular users)"""
    # Restrict users to Tron network only
    if wallet_data.network != WalletNetwork.TRON:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Tron network is supported for user wallets. Use TronLink wallet."
        )
    
    # Ensure wallet type is TronLink
    if wallet_data.wallet_type != WalletType.TRONLINK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only TronLink wallet type is supported for users"
        )
    
    wallet = WalletService.connect_wallet(
        db=db,
        user_id=current_user.id,
        wallet_address=wallet_data.wallet_address,
        network=wallet_data.network,
        wallet_type=wallet_data.wallet_type,
        signature=wallet_data.signature
    )
    return wallet

@router.post("/verify", status_code=status.HTTP_200_OK)
async def verify_wallet(
    verify_data: WalletVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify wallet ownership with signature"""
    wallet = db.query(UserWallet).filter(
        UserWallet.id == verify_data.wallet_id,
        UserWallet.user_id == current_user.id
    ).first()
    
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found"
        )
    
    # Generate verification message
    message = WalletService.generate_verification_message(
        wallet.wallet_address,
        current_user.id
    )
    
    is_verified = WalletService.verify_wallet(
        db=db,
        wallet_id=verify_data.wallet_id,
        signature=verify_data.signature,
        message=message
    )
    
    if not is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature"
        )
    
    return {"message": "Wallet verified successfully", "wallet_id": wallet.id}

@router.get("/my-wallets", response_model=List[UserWalletResponse])
async def get_my_wallets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all wallets connected to current user"""
    wallets = db.query(UserWallet).filter(
        UserWallet.user_id == current_user.id
    ).all()
    return wallets

@router.get("/verification-message/{wallet_id}")
async def get_verification_message(
    wallet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get verification message for wallet"""
    wallet = db.query(UserWallet).filter(
        UserWallet.id == wallet_id,
        UserWallet.user_id == current_user.id
    ).first()
    
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found"
        )
    
    message = WalletService.generate_verification_message(
        wallet.wallet_address,
        current_user.id
    )
    
    return {
        "wallet_id": wallet_id,
        "message": message,
        "wallet_address": wallet.wallet_address
    }

