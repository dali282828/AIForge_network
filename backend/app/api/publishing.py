from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.model import Model
from app.models.payment import Payment, PaymentStatus
from app.schemas.publishing import (
    PublishingInfoResponse, PayPublishingFeeRequest, PayListingFeeRequest, PublishingFeeResponse
)
from app.services.publishing_service import PublishingService
from app.services.payment_service import PaymentService
from app.models.model_publishing import PublishingStatus
from datetime import datetime, timedelta
from decimal import Decimal

router = APIRouter()

@router.get("/model/{model_id}/publishing", response_model=PublishingInfoResponse)
async def get_publishing_info(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get publishing information for a model"""
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
            detail="Not authorized"
        )
    
    publishing = PublishingService.get_publishing_info(model_id, db)
    if not publishing:
        # Initialize if doesn't exist
        publishing = PublishingService.initialize_publishing(model_id, db)
    
    return publishing

@router.post("/model/{model_id}/publish", response_model=PublishingFeeResponse)
async def pay_publishing_fee(
    model_id: int,
    request: PayPublishingFeeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pay publishing fee to publish a model"""
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
            detail="Not authorized"
        )
    
    # Check if first model is free
    is_first_model = PublishingService.get_first_model_free(current_user.id, db)
    
    try:
        if is_first_model:
            # First model is free - auto-publish
            publishing = PublishingService.initialize_publishing(model_id, db)
            publishing.publishing_fee_paid = True
            publishing.status = PublishingStatus.PUBLISHED
            publishing.published_at = datetime.utcnow()
            publishing.listing_fee_paid_until = datetime.utcnow() + timedelta(days=30)
            publishing.next_listing_payment_due = publishing.listing_fee_paid_until
            db.commit()
            
            return PublishingFeeResponse(
                payment_id=0,
                amount=Decimal("0.00"),
                status="free",
                message="First model is free! Model published successfully."
            )
        else:
            # Create payment
            payment = PublishingService.pay_publishing_fee(
                model_id=model_id,
                wallet_id=request.wallet_id,
                db=db
            )
            
            return PublishingFeeResponse(
                payment_id=payment.id,
                amount=payment.amount,
                status="pending",
                message="Publishing fee payment created. Verify transaction to complete publishing."
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/model/{model_id}/listing-fee", response_model=PublishingFeeResponse)
async def pay_listing_fee(
    model_id: int,
    request: PayListingFeeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pay listing fee to keep model published"""
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
            detail="Not authorized"
        )
    
    try:
        payment = PublishingService.pay_listing_fee(
            model_id=model_id,
            wallet_id=request.wallet_id,
            months=request.months,
            db=db
        )
        
        return PublishingFeeResponse(
            payment_id=payment.id,
            amount=payment.amount,
            status="pending",
            message=f"Listing fee payment created for {request.months} month(s). Verify transaction to extend listing period."
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/model/{model_id}/confirm-publishing")
async def confirm_publishing_payment(
    model_id: int,
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm publishing fee payment (called after payment verification)"""
    # Verify model ownership
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model or model.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    try:
        publishing = PublishingService.confirm_publishing_fee(model_id, payment_id, db)
        return {"message": "Model published successfully", "publishing": publishing}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/model/{model_id}/confirm-listing")
async def confirm_listing_payment(
    model_id: int,
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm listing fee payment (called after payment verification)"""
    # Verify model ownership
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model or model.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    try:
        publishing = PublishingService.confirm_listing_fee(model_id, payment_id, db)
        return {"message": "Listing fee confirmed", "publishing": publishing}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

