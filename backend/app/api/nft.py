"""
NFT API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Tuple
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.wallet import WalletNetwork
from app.models.nft import NFTShare, NFTReward, NFTRewardPool
from app.schemas.nft import (
    NFTShareResponse, MintNFTRequest, MintNFTResponse,
    NFTRewardResponse, NFTRewardPoolResponse, MyNFTsResponse, NFTStatsResponse
)
from app.services.nft_service import NFTService
from app.services.wallet_service import WalletService
from app.core.config import settings
from decimal import Decimal

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
    if network == WalletNetwork.ETHEREUM:
        normalized_address = x_wallet_address.lower()
    else:  # Tron
        normalized_address = x_wallet_address
    
    if not WalletService.is_admin_wallet(normalized_address, network):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Wallet not authorized as admin"
        )
    
    return normalized_address, network

@router.post("/mint", response_model=MintNFTResponse, status_code=status.HTTP_201_CREATED)
async def mint_nft(
    mint_data: MintNFTRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mint an NFT share (user pays $0.10 gas fee directly to Tron network)
    """
    # Verify wallet address is Tron format
    if not mint_data.wallet_address.startswith("T"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Tron wallet address. Must start with 'T'"
        )
    
    # Check if contract is configured
    if not settings.NFT_CONTRACT_TRON:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="NFT contract not configured. Please contact administrator."
        )
    
    # Get next token ID
    token_id = NFTService.get_next_token_id(db)
    
    # Create NFT share record (will be updated after minting transaction)
    # For now, we create it with pending status
    nft_share = NFTService.create_nft_share(
        db=db,
        wallet_address=mint_data.wallet_address,
        token_id=token_id,
        contract_address=settings.NFT_CONTRACT_TRON,
        user_id=current_user.id
    )
    
    # Return instructions for user to mint
    return MintNFTResponse(
        nft_share_id=nft_share.id,
        token_id=token_id,
        contract_address=settings.NFT_CONTRACT_TRON,
        gas_fee_estimate=f"${settings.NFT_MINT_GAS_FEE:.2f}",
        message=f"Please mint NFT #{token_id} using your TronLink wallet. Gas fee: ~${settings.NFT_MINT_GAS_FEE:.2f}. After minting, provide the transaction hash to confirm."
    )

@router.post("/confirm-mint/{nft_share_id}")
async def confirm_mint(
    nft_share_id: int,
    tx_hash: str,
    block_number: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm NFT minting after user has minted on blockchain"""
    nft_share = db.query(NFTShare).filter(
        NFTShare.id == nft_share_id,
        NFTShare.owner_user_id == current_user.id
    ).first()
    
    if not nft_share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NFT share not found"
        )
    
    # Update with transaction details
    nft_share.tx_hash = tx_hash
    if block_number:
        nft_share.block_number = block_number
    
    db.commit()
    db.refresh(nft_share)
    
    return {"message": "NFT minting confirmed", "nft_share": NFTShareResponse.model_validate(nft_share)}

@router.get("/my-nfts", response_model=MyNFTsResponse)
async def get_my_nfts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's NFTs"""
    # Get user's wallets
    from app.models.wallet import UserWallet
    wallets = db.query(UserWallet).filter(
        UserWallet.user_id == current_user.id,
        UserWallet.network == WalletNetwork.TRON
    ).all()
    
    # Get NFTs by user ID and wallet addresses
    nfts = NFTService.get_user_nfts(db, user_id=current_user.id)
    
    # Also check by wallet addresses
    for wallet in wallets:
        wallet_nfts = NFTService.get_user_nfts(db, wallet_address=wallet.wallet_address)
        for nft in wallet_nfts:
            if nft not in nfts:
                nfts.append(nft)
    
    # Get total rewards
    rewards = NFTService.get_user_rewards(db, user_id=current_user.id)
    total_rewards = sum(Decimal(str(r.reward_amount)) for r in rewards)
    
    return MyNFTsResponse(
        nfts=[NFTShareResponse.model_validate(nft) for nft in nfts],
        total_rewards=str(total_rewards),
        total_rewards_count=len(rewards)
    )

@router.get("/stats", response_model=NFTStatsResponse)
async def get_nft_stats(
    db: Session = Depends(get_db)
):
    """Get NFT statistics (public)"""
    stats = NFTService.get_nft_stats(db)
    return NFTStatsResponse(**stats)

@router.get("/rewards/my", response_model=list[NFTRewardResponse])
async def get_my_rewards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's NFT rewards"""
    rewards = NFTService.get_user_rewards(db, user_id=current_user.id)
    return [NFTRewardResponse.model_validate(r) for r in rewards]

@router.get("/rewards/pool/{year}/{month}", response_model=NFTRewardPoolResponse)
async def get_reward_pool(
    year: int,
    month: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get reward pool for a period (admin only)"""
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month"
        )
    
    pool = NFTService.calculate_reward_pool(db, year, month)
    return NFTRewardPoolResponse(
        id=pool.id,
        period=f"{year}-{month:02d}",
        subscription_revenue_share=str(pool.subscription_revenue_share),
        api_revenue_share=str(pool.api_revenue_share),
        total_pool=str(pool.total_pool),
        total_shares=pool.total_shares,
        reward_per_share=str(pool.reward_per_share),
        is_distributed=pool.is_distributed,
        calculated_at=pool.calculated_at,
        distributed_at=pool.distributed_at
    )

@router.post("/rewards/distribute/{year}/{month}")
async def distribute_rewards(
    year: int,
    month: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Distribute rewards to NFT holders for a period (admin only)"""
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month"
        )
    
    rewards = NFTService.distribute_rewards(db, year, month)
    
    return {
        "message": f"Rewards distributed for {year}-{month:02d}",
        "total_rewards": len(rewards),
        "rewards": [NFTRewardResponse.model_validate(r) for r in rewards]
    }

@router.get("/holders")
async def get_all_holders(
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all NFT holders (admin only)"""
    # Get unique holders with NFT count
    from sqlalchemy import distinct
    holders_query = db.query(
        NFTShare.owner_wallet_address,
        NFTShare.owner_user_id,
        func.count(NFTShare.id).label('nft_count')
    ).filter(
        NFTShare.is_active == True
    ).group_by(
        NFTShare.owner_wallet_address,
        NFTShare.owner_user_id
    ).all()
    
    return {
        "total_holders": len(holders_query),
        "holders": [
            {
                "wallet_address": holder.owner_wallet_address,
                "user_id": holder.owner_user_id,
                "nft_count": holder.nft_count
            }
            for holder in holders_query
        ]
    }

