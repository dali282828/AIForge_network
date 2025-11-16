from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.payment import Payment
from app.models.wallet import WalletNetwork
from app.schemas.payment import PaymentCreate, PaymentVerify, PaymentResponse, PaymentHistory
from app.services.payment_service import PaymentService
from typing import List, Optional

router = APIRouter()

@router.post("/create", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new payment record (Tron-only for users)"""
    # Restrict users to Tron network only
    if payment_data.network != WalletNetwork.TRON:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Tron network is supported for user payments. Use USDT TRC-20."
        )
    
    # Verify wallet belongs to user
    from app.models.wallet import UserWallet
    wallet = db.query(UserWallet).filter(
        UserWallet.id == payment_data.from_wallet_id,
        UserWallet.user_id == current_user.id
    ).first()
    
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found"
        )
    
    # Ensure wallet is Tron network
    if wallet.network != WalletNetwork.TRON:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Tron wallets are supported for user payments"
        )
    
    if not wallet.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wallet must be verified before making payments"
        )
    
    # Get platform wallet (Tron only for users)
    to_address = PaymentService.get_platform_wallet(WalletNetwork.TRON)
    if not to_address or to_address.startswith("T0000"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Platform wallet not configured"
        )
    
    payment = PaymentService.create_payment(
        db=db,
        payment_type=payment_data.payment_type,
        amount=payment_data.amount,
        from_wallet_id=payment_data.from_wallet_id,
        from_address=wallet.wallet_address,
        to_address=to_address,
        network=payment_data.network,
        currency=payment_data.currency,
        subscription_id=payment_data.subscription_id,
        job_id=payment_data.job_id,
        model_id=payment_data.model_id,
        api_subscription_id=payment_data.api_subscription_id,
        payment_metadata=payment_data.metadata if hasattr(payment_data, 'metadata') else None
    )
    
    return payment

@router.post("/verify", response_model=PaymentResponse)
async def verify_payment(
    verify_data: PaymentVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify a payment transaction"""
    payment = db.query(Payment).filter(Payment.id == verify_data.payment_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Verify wallet belongs to user
    if payment.wallet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Users can only verify Tron payments
    # Determine network (users restricted to Tron)
    if payment.network == "ethereum":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ethereum payments are not supported for regular users. Only Tron network is supported."
        )
    network = WalletNetwork.TRON
    
    # Verify transaction
    is_verified = PaymentService.verify_payment(
        db=db,
        payment_id=verify_data.payment_id,
        tx_hash=verify_data.tx_hash,
        network=network
    )
    
    if not is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to verify transaction"
        )
    
    db.refresh(payment)
    
    # If payment is confirmed, handle different payment types
    if payment.status.value == "confirmed":
        # Handle subscription payments
        if payment.payment_type.value == "subscription":
            from app.services.subscription_service import SubscriptionService
            if payment.subscription_id:
                SubscriptionService.renew_subscription(db, payment.subscription_id)
        
        # Handle publishing fee payments
        if payment.model_id and payment.payment_metadata and payment.payment_metadata.get("fee_type") == "publishing":
            from app.services.publishing_service import PublishingService
            try:
                PublishingService.confirm_publishing_fee(payment.model_id, payment.id, db)
            except Exception as e:
                print(f"Error confirming publishing fee: {e}")
        
        # Handle listing fee payments
        if payment.model_id and payment.payment_metadata and payment.payment_metadata.get("fee_type") == "listing":
            from app.services.publishing_service import PublishingService
            try:
                PublishingService.confirm_listing_fee(payment.model_id, payment.id, db)
            except Exception as e:
                print(f"Error confirming listing fee: {e}")
    
    return payment

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment details"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Verify wallet belongs to user
    if payment.wallet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return payment

@router.get("/history/all", response_model=PaymentHistory)
async def get_payment_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment history for current user"""
    # Get user's wallets
    from app.models.wallet import UserWallet
    wallets = db.query(UserWallet).filter(UserWallet.user_id == current_user.id).all()
    wallet_ids = [w.id for w in wallets]
    
    # Get payments
    offset = (page - 1) * page_size
    payments = db.query(Payment).filter(
        Payment.from_wallet_id.in_(wallet_ids)
    ).order_by(Payment.created_at.desc()).offset(offset).limit(page_size).all()
    
    total = db.query(Payment).filter(
        Payment.from_wallet_id.in_(wallet_ids)
    ).count()
    
    return PaymentHistory(
        payments=payments,
        total=total,
        page=page,
        page_size=page_size
    )

