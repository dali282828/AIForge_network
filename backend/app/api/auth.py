from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import time
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.user import User
from app.models.wallet import UserWallet, WalletNetwork, WalletType
from app.schemas.auth import Token, WalletLoginRequest, WalletAuthMessage
from app.schemas.user import UserCreate, UserResponse
from app.api.dependencies import get_current_user
from app.services.wallet_service import WalletService

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        auth_method="email"
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username, "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_user)):
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(current_user.id), "username": current_user.username, "email": current_user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": current_user.id}

@router.get("/wallet/auth-message", response_model=WalletAuthMessage)
async def get_wallet_auth_message(
    wallet_address: str,
    network: WalletNetwork,
    db: Session = Depends(get_db)
):
    """Get authentication message for wallet sign-in (Tron-only for users)"""
    if network != WalletNetwork.TRON:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Tron network is supported for user authentication. Use TronLink wallet."
        )
    
    normalized_address = wallet_address # Tron addresses are case-sensitive
    
    message = WalletService.generate_auth_message(normalized_address)
    timestamp = int(time.time())
    
    return WalletAuthMessage(
        message=message,
        wallet_address=normalized_address,
        timestamp=timestamp
    )

@router.post("/wallet/login", response_model=Token)
async def wallet_login(
    login_data: WalletLoginRequest,
    db: Session = Depends(get_db)
):
    """Login or register using wallet address and signature (Tron-only for users)"""
    if login_data.network != WalletNetwork.TRON:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Tron network is supported for user authentication. Use TronLink wallet."
        )
    
    if login_data.wallet_type != WalletType.TRONLINK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only TronLink wallet type is supported for users"
        )
    
    normalized_address = login_data.wallet_address # Tron addresses are case-sensitive
    
    is_valid = WalletService.verify_wallet_signature(
        normalized_address,
        login_data.message,
        login_data.signature,
        login_data.network
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Find or create user
    wallet = db.query(UserWallet).filter(
        UserWallet.wallet_address == normalized_address,
        UserWallet.network == login_data.network
    ).first()
    
    if wallet:
        user = wallet.user
    else:
        # Create new user with wallet
        user = User(
            email=f"{normalized_address}@wallet.local",
            username=f"user_{normalized_address[:8]}",
            auth_method="wallet",
            is_verified=True
        )
        db.add(user)
        db.flush()
        
        # Create wallet
        wallet = WalletService.connect_wallet(
            db=db,
            user_id=user.id,
            wallet_address=normalized_address,
            network=login_data.network,
            wallet_type=login_data.wallet_type,
            signature=login_data.signature
        )
        wallet.is_verified = True
        wallet.verified_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username, "email": user.email},
        expires_delta=access_token_expires
    )
    
    # Check if wallet is admin
    is_admin = WalletService.is_admin_wallet(normalized_address, login_data.network)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": is_admin,
        "wallet_address": normalized_address
    }

@router.get("/check-admin")
async def check_admin_status(
    wallet_address: str,
    network: WalletNetwork
):
    """Check if a wallet address is an admin wallet (public endpoint, no auth required)"""
    normalized_address = wallet_address.lower() if network == WalletNetwork.ETHEREUM else wallet_address
    is_admin = WalletService.is_admin_wallet(normalized_address, network)
    
    return {
        "wallet_address": normalized_address,
        "network": network.value,
        "is_admin": is_admin
    }
