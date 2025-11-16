from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.user import User
from app.models.wallet import AdminWallet, WalletNetwork
from app.models.payment import Payment, PaymentStatus
from app.models.subscription import Subscription
from app.models.node import Node
from app.models.job import Job
from app.models.model import Model
from app.models.nft import NFTShare, NFTReward, NFTRewardPool
from app.models.infrastructure import InfrastructureInvestment
from app.models.api_service import APIService
from app.models.group import Group, GroupMembership
from app.models.model_publishing import ModelPublishing, PublishingStatus, RevenueDistribution, GroupRevenueSplit
from app.models.chat import Conversation, Message
from app.models.api_service import APIRequest
from app.schemas.wallet import AdminWalletCreate, AdminWalletResponse
from app.services.wallet_service import WalletService
from typing import Optional, Dict, Any, Tuple
from decimal import Decimal
from datetime import datetime

router = APIRouter()

async def verify_admin_wallet(
    x_wallet_address: Optional[str] = Header(None),
    x_wallet_network: Optional[str] = Header(None),
    x_wallet_signature: Optional[str] = Header(None)
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
    
    # Verify wallet is in admin whitelist
    if not WalletService.is_admin_wallet(normalized_address, network):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Wallet not authorized as admin"
        )
    
    # TODO: Verify signature in production
    # For now, just check whitelist
    
    return normalized_address, network

@router.get("/stats")
async def get_platform_stats(
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get platform statistics"""
    # User stats
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    
    # Subscription stats
    total_subscriptions = db.query(func.count(Subscription.id)).scalar()
    active_subscriptions = db.query(func.count(Subscription.id)).filter(
        Subscription.status == "active"
    ).scalar()
    
    # Payment stats
    total_payments = db.query(func.count(Payment.id)).scalar()
    confirmed_payments = db.query(func.count(Payment.id)).filter(
        Payment.status == PaymentStatus.CONFIRMED
    ).scalar()
    total_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.status == PaymentStatus.CONFIRMED
    ).scalar() or Decimal("0.00")
    platform_fees = db.query(func.sum(Payment.platform_fee_amount)).filter(
        Payment.status == PaymentStatus.CONFIRMED
    ).scalar() or Decimal("0.00")
    
    # Node stats
    total_nodes = db.query(func.count(Node.id)).scalar()
    active_nodes = db.query(func.count(Node.id)).filter(Node.is_active == True).scalar()
    
    # Job stats
    total_jobs = db.query(func.count(Job.id)).scalar()
    completed_jobs = db.query(func.count(Job.id)).filter(Job.status == "completed").scalar()
    
    # Model stats
    total_models = db.query(func.count(Model.id)).scalar()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "subscriptions": {
            "total": total_subscriptions,
            "active": active_subscriptions
        },
        "payments": {
            "total": total_payments,
            "confirmed": confirmed_payments,
            "total_revenue": str(total_revenue),
            "platform_fees": str(platform_fees)
        },
        "nodes": {
            "total": total_nodes,
            "active": active_nodes
        },
        "jobs": {
            "total": total_jobs,
            "completed": completed_jobs
        },
        "models": {
            "total": total_models
        }
    }

@router.get("/payments")
async def get_all_payments(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all payments (admin only)"""
    offset = (page - 1) * page_size
    payments = db.query(Payment).order_by(Payment.created_at.desc()).offset(offset).limit(page_size).all()
    total = db.query(func.count(Payment.id)).scalar()
    
    return {
        "payments": payments,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/users")
async def get_all_users(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    offset = (page - 1) * page_size
    users = db.query(User).offset(offset).limit(page_size).all()
    total = db.query(func.count(User.id)).scalar()
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/nodes")
async def get_all_nodes(
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all nodes (admin only)"""
    nodes = db.query(Node).all()
    return {"nodes": nodes}

@router.post("/wallets/add", response_model=AdminWalletResponse, status_code=status.HTTP_201_CREATED)
async def add_admin_wallet(
    wallet_data: AdminWalletCreate,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Add a wallet to admin whitelist"""
    wallet = WalletService.add_admin_wallet(
        db=db,
        wallet_address=wallet_data.wallet_address,
        network=wallet_data.network,
        notes=wallet_data.notes
    )
    return wallet

@router.get("/wallets", response_model=list[AdminWalletResponse])
async def get_admin_wallets(
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all admin wallets"""
    wallets = db.query(AdminWallet).all()
    return wallets

@router.delete("/wallets/{wallet_id}")
async def remove_admin_wallet(
    wallet_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Remove a wallet from admin whitelist"""
    wallet = db.query(AdminWallet).filter(AdminWallet.id == wallet_id).first()
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found"
        )
    
    wallet.is_active = False
    db.commit()
    
    return {"message": "Admin wallet deactivated"}

@router.get("/models")
async def get_all_models(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all models (admin only)"""
    offset = (page - 1) * page_size
    models = db.query(Model).order_by(Model.created_at.desc()).offset(offset).limit(page_size).all()
    total = db.query(func.count(Model.id)).scalar()
    
    return {
        "models": models,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.patch("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    return {"message": "User activated", "user": user}

@router.patch("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Deactivate a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    db.commit()
    db.refresh(user)
    
    return {"message": "User deactivated", "user": user}

@router.get("/subscriptions")
async def get_all_subscriptions(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all subscriptions (admin only)"""
    offset = (page - 1) * page_size
    subscriptions = db.query(Subscription).order_by(Subscription.created_at.desc()).offset(offset).limit(page_size).all()
    total = db.query(func.count(Subscription.id)).scalar()
    
    return {
        "subscriptions": subscriptions,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/jobs")
async def get_all_jobs(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all jobs (admin only)"""
    offset = (page - 1) * page_size
    jobs = db.query(Job).order_by(Job.created_at.desc()).offset(offset).limit(page_size).all()
    total = db.query(func.count(Job.id)).scalar()
    
    return {
        "jobs": jobs,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/nfts")
async def get_all_nfts(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all NFT shares (admin only)"""
    offset = (page - 1) * page_size
    nfts = db.query(NFTShare).order_by(NFTShare.created_at.desc()).offset(offset).limit(page_size).all()
    total = db.query(func.count(NFTShare.id)).scalar()
    
    return {
        "nfts": nfts,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/infrastructure")
async def get_all_infrastructure(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all infrastructure investments (admin only)"""
    offset = (page - 1) * page_size
    investments = db.query(InfrastructureInvestment).order_by(InfrastructureInvestment.created_at.desc()).offset(offset).limit(page_size).all()
    total = db.query(func.count(InfrastructureInvestment.id)).scalar()
    
    return {
        "investments": investments,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/api-services")
async def get_all_api_services(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all API services (admin only)"""
    offset = (page - 1) * page_size
    services = db.query(APIService).order_by(APIService.created_at.desc()).offset(offset).limit(page_size).all()
    total = db.query(func.count(APIService.id)).scalar()
    
    return {
        "services": services,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.patch("/models/{model_id}/feature")
async def feature_model(
    model_id: int,
    featured: bool = True,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Feature or unfeature a model"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Note: You may need to add a 'featured' column to Model if it doesn't exist
    # For now, this is a placeholder
    db.commit()
    db.refresh(model)
    
    return {"message": f"Model {'featured' if featured else 'unfeatured'}", "model": model}

# Groups Management
@router.get("/groups")
async def get_all_groups(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all groups (admin only)"""
    offset = (page - 1) * page_size
    groups = db.query(Group).order_by(Group.created_at.desc()).offset(offset).limit(page_size).all()
    total = db.query(func.count(Group.id)).scalar()
    
    # Get member counts and model counts for each group
    result = []
    for group in groups:
        member_count = db.query(func.count(GroupMembership.id)).filter(
            GroupMembership.group_id == group.id
        ).scalar()
        model_count = db.query(func.count(Model.id)).filter(
            Model.group_id == group.id
        ).scalar()
        
        group_dict = {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "owner_id": group.owner_id,
            "is_public": group.is_public,
            "created_at": group.created_at.isoformat() if group.created_at else None,
            "updated_at": group.updated_at.isoformat() if group.updated_at else None,
            "member_count": member_count,
            "model_count": model_count
        }
        result.append(group_dict)
    
    return {
        "groups": result,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/groups/{group_id}")
async def get_group_details(
    group_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get detailed group information (admin only)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Get members
    memberships = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id
    ).all()
    
    # Get models
    models = db.query(Model).filter(Model.group_id == group_id).all()
    
    # Get revenue split configs
    revenue_splits = db.query(GroupRevenueSplit).filter(
        GroupRevenueSplit.group_id == group_id
    ).all()
    
    return {
        "group": {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "owner_id": group.owner_id,
            "is_public": group.is_public,
            "created_at": group.created_at.isoformat() if group.created_at else None,
            "updated_at": group.updated_at.isoformat() if group.updated_at else None
        },
        "members": [
            {
                "id": m.id,
                "user_id": m.user_id,
                "role": m.role.value if m.role else None,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None
            }
            for m in memberships
        ],
        "models": [
            {
                "id": m.id,
                "name": m.name,
                "description": m.description,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in models
        ],
        "revenue_splits": [
            {
                "id": rs.id,
                "model_id": rs.model_id,
                "split_config": rs.split_config
            }
            for rs in revenue_splits
        ]
    }

@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Delete a group (admin only)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    db.delete(group)
    db.commit()
    
    return {"message": "Group deleted successfully"}

# Model Publishing Management
@router.get("/publishing")
async def get_all_publishing(
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = None,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all model publishing records (admin only)"""
    offset = (page - 1) * page_size
    query = db.query(ModelPublishing)
    
    if status_filter:
        try:
            status_enum = PublishingStatus(status_filter)
            query = query.filter(ModelPublishing.status == status_enum)
        except ValueError:
            pass
    
    publishing_records = query.order_by(ModelPublishing.created_at.desc()).offset(offset).limit(page_size).all()
    total = db.query(func.count(ModelPublishing.id)).scalar()
    
    result = []
    for pub in publishing_records:
        model = db.query(Model).filter(Model.id == pub.model_id).first()
        result.append({
            "id": pub.id,
            "model_id": pub.model_id,
            "model_name": model.name if model else None,
            "status": pub.status.value if pub.status else None,
            "publishing_fee_paid": pub.publishing_fee_paid,
            "publishing_fee_amount": str(pub.publishing_fee_amount) if pub.publishing_fee_amount else None,
            "listing_fee_amount": str(pub.listing_fee_amount) if pub.listing_fee_amount else None,
            "listing_fee_paid_until": pub.listing_fee_paid_until.isoformat() if pub.listing_fee_paid_until else None,
            "published_at": pub.published_at.isoformat() if pub.published_at else None,
            "created_at": pub.created_at.isoformat() if pub.created_at else None
        })
    
    return {
        "publishing": result,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.patch("/publishing/{publishing_id}/suspend")
async def suspend_publishing(
    publishing_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Suspend a published model (admin only)"""
    publishing = db.query(ModelPublishing).filter(ModelPublishing.id == publishing_id).first()
    if not publishing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publishing record not found"
        )
    
    publishing.status = PublishingStatus.SUSPENDED
    db.commit()
    db.refresh(publishing)
    
    return {"message": "Model publishing suspended", "publishing": publishing}

@router.patch("/publishing/{publishing_id}/unsuspend")
async def unsuspend_publishing(
    publishing_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Unsuspend a suspended model (admin only)"""
    publishing = db.query(ModelPublishing).filter(ModelPublishing.id == publishing_id).first()
    if not publishing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publishing record not found"
        )
    
    if publishing.status == PublishingStatus.SUSPENDED:
        # Restore to published if fees are still valid
        if publishing.listing_fee_paid_until and publishing.listing_fee_paid_until > datetime.utcnow():
            publishing.status = PublishingStatus.PUBLISHED
        else:
            publishing.status = PublishingStatus.LISTING_EXPIRED
    
    db.commit()
    db.refresh(publishing)
    
    return {"message": "Model publishing unsuspended", "publishing": publishing}

# Revenue & Payouts Management
@router.get("/revenue/distributions")
async def get_revenue_distributions(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all revenue distributions (admin only)"""
    offset = (page - 1) * page_size
    distributions = db.query(RevenueDistribution).order_by(
        RevenueDistribution.created_at.desc()
    ).offset(offset).limit(page_size).all()
    total = db.query(func.count(RevenueDistribution.id)).scalar()
    
    result = []
    for dist in distributions:
        model = db.query(Model).filter(Model.id == dist.model_id).first()
        result.append({
            "id": dist.id,
            "model_id": dist.model_id,
            "model_name": model.name if model else None,
            "period_year": dist.period_year,
            "period_month": dist.period_month,
            "total_revenue": str(dist.total_revenue) if dist.total_revenue else "0",
            "platform_fee": str(dist.platform_fee) if dist.platform_fee else "0",
            "model_pool": str(dist.model_pool) if dist.model_pool else "0",
            "is_distributed": dist.is_distributed,
            "distributed_at": dist.distributed_at.isoformat() if dist.distributed_at else None,
            "created_at": dist.created_at.isoformat() if dist.created_at else None
        })
    
    return {
        "distributions": result,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/revenue/nft-pools")
async def get_nft_reward_pools(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all NFT reward pools (admin only)"""
    offset = (page - 1) * page_size
    pools = db.query(NFTRewardPool).order_by(
        NFTRewardPool.calculated_at.desc()
    ).offset(offset).limit(page_size).all()
    total = db.query(func.count(NFTRewardPool.id)).scalar()
    
    result = []
    for pool in pools:
        result.append({
            "id": pool.id,
            "period": pool.period,
            "subscription_revenue_share": str(pool.subscription_revenue_share) if pool.subscription_revenue_share else "0",
            "api_revenue_share": str(pool.api_revenue_share) if pool.api_revenue_share else "0",
            "total_pool": str(pool.total_pool) if pool.total_pool else "0",
            "total_shares": pool.total_shares,
            "reward_per_share": str(pool.reward_per_share) if pool.reward_per_share else "0",
            "is_distributed": pool.is_distributed,
            "calculated_at": pool.calculated_at.isoformat() if pool.calculated_at else None,
            "distributed_at": pool.distributed_at.isoformat() if pool.distributed_at else None
        })
    
    return {
        "pools": result,
        "total": total,
        "page": page,
        "page_size": page_size
    }

# Chat/Conversations Management
@router.get("/chat/conversations")
async def get_all_conversations(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all conversations (admin only)"""
    offset = (page - 1) * page_size
    conversations = db.query(Conversation).order_by(
        Conversation.created_at.desc()
    ).offset(offset).limit(page_size).all()
    total = db.query(func.count(Conversation.id)).scalar()
    
    result = []
    for conv in conversations:
        message_count = db.query(func.count(Message.id)).filter(
            Message.conversation_id == conv.id
        ).scalar()
        
        result.append({
            "id": conv.id,
            "user_id": conv.user_id,
            "model_id": conv.model_id,
            "title": conv.title,
            "is_active": conv.is_active,
            "message_count": message_count,
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "last_message_at": conv.last_message_at.isoformat() if conv.last_message_at else None
        })
    
    return {
        "conversations": result,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.delete("/chat/conversations/{conversation_id}")
async def delete_conversation_admin(
    conversation_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Delete a conversation (admin only)"""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversation deleted successfully"}

# API Usage & Analytics
@router.get("/api-usage/requests")
async def get_api_requests(
    page: int = 1,
    page_size: int = 20,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get all API requests (admin only)"""
    offset = (page - 1) * page_size
    requests = db.query(APIRequest).order_by(
        APIRequest.created_at.desc()
    ).offset(offset).limit(page_size).all()
    total = db.query(func.count(APIRequest.id)).scalar()
    
    result = []
    for req in requests:
        result.append({
            "id": req.id,
            "subscription_id": req.subscription_id,
            "service_id": req.service_id,
            "tokens_used": req.tokens_used,
            "input_tokens": req.input_tokens,
            "output_tokens": req.output_tokens,
            "cost": str(req.cost) if req.cost else "0",
            "status": req.status,
            "created_at": req.created_at.isoformat() if req.created_at else None
        })
    
    return {
        "requests": result,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/api-usage/stats")
async def get_api_usage_stats(
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get API usage statistics (admin only)"""
    total_requests = db.query(func.count(APIRequest.id)).scalar()
    total_tokens = db.query(func.sum(APIRequest.tokens_used)).scalar() or 0
    total_cost = db.query(func.sum(APIRequest.cost)).scalar() or Decimal("0.00")
    
    successful_requests = db.query(func.count(APIRequest.id)).filter(
        APIRequest.status == "success"
    ).scalar()
    
    failed_requests = db.query(func.count(APIRequest.id)).filter(
        APIRequest.status == "error"
    ).scalar()
    
    return {
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
        "total_tokens": total_tokens,
        "total_cost": str(total_cost)
    }

# Payment Management Enhancements
@router.patch("/payments/{payment_id}/verify")
async def manually_verify_payment(
    payment_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Manually verify a payment (admin only)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    payment.status = PaymentStatus.CONFIRMED
    payment.confirmed_at = datetime.utcnow()
    payment.confirmations = payment.required_confirmations
    db.commit()
    db.refresh(payment)
    
    return {"message": "Payment verified", "payment": payment}

@router.patch("/payments/{payment_id}/cancel")
async def cancel_payment(
    payment_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Cancel a payment (admin only)"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if payment.status == PaymentStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a confirmed payment"
        )
    
    payment.status = PaymentStatus.CANCELLED
    db.commit()
    db.refresh(payment)
    
    return {"message": "Payment cancelled", "payment": payment}

# User Management Enhancements
@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get detailed user information (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user's wallets
    from app.models.wallet import UserWallet
    wallets = db.query(UserWallet).filter(UserWallet.user_id == user_id).all()
    
    # Get user's groups
    group_memberships = db.query(GroupMembership).filter(GroupMembership.user_id == user_id).all()
    
    # Get user's models
    user_models = db.query(Model).filter(Model.owner_id == user_id).all()
    
    # Get user's payments
    user_payments = db.query(Payment).join(UserWallet).filter(UserWallet.user_id == user_id).all()
    total_spent = db.query(func.sum(Payment.amount)).join(UserWallet).filter(
        UserWallet.user_id == user_id,
        Payment.status == PaymentStatus.CONFIRMED
    ).scalar() or Decimal("0.00")
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        },
        "wallets": [
            {
                "id": w.id,
                "address": w.address,
                "network": w.network.value if w.network else None,
                "is_active": w.is_active
            }
            for w in wallets
        ],
        "groups": [
            {
                "id": gm.group_id,
                "role": gm.role.value if gm.role else None,
                "joined_at": gm.joined_at.isoformat() if gm.joined_at else None
            }
            for gm in group_memberships
        ],
        "models": [
            {
                "id": m.id,
                "name": m.name,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in user_models
        ],
        "statistics": {
            "total_models": len(user_models),
            "total_groups": len(group_memberships),
            "total_wallets": len(wallets),
            "total_payments": len(user_payments),
            "total_spent": str(total_spent)
        }
    }

# Job Management Enhancements
@router.patch("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Cancel a job (admin only)"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.status in ["completed", "failed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel a job with status: {job.status}"
        )
    
    job.status = "cancelled"
    db.commit()
    db.refresh(job)
    
    return {"message": "Job cancelled", "job": job}

@router.post("/jobs/{job_id}/retry")
async def retry_job(
    job_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Retry a failed job (admin only)"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.status != "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only retry failed jobs"
        )
    
    job.status = "pending"
    job.error = None
    db.commit()
    db.refresh(job)
    
    return {"message": "Job queued for retry", "job": job}

# Node Management Enhancements
@router.patch("/nodes/{node_id}/activate")
async def activate_node(
    node_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Activate a node (admin only)"""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    node.is_active = True
    db.commit()
    db.refresh(node)
    
    return {"message": "Node activated", "node": node}

@router.patch("/nodes/{node_id}/deactivate")
async def deactivate_node(
    node_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Deactivate a node (admin only)"""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    node.is_active = False
    db.commit()
    db.refresh(node)
    
    return {"message": "Node deactivated", "node": node}

@router.get("/nodes/{node_id}/stats")
async def get_node_stats(
    node_id: int,
    admin_wallet: Tuple[str, WalletNetwork] = Depends(verify_admin_wallet),
    db: Session = Depends(get_db)
):
    """Get node statistics (admin only)"""
    node = db.query(Node).filter(Node.id == node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Get jobs assigned to this node
    jobs_assigned = db.query(func.count(Job.id)).filter(Job.node_id == node_id).scalar()
    jobs_completed = db.query(func.count(Job.id)).filter(
        Job.node_id == node_id,
        Job.status == "completed"
    ).scalar()
    jobs_failed = db.query(func.count(Job.id)).filter(
        Job.node_id == node_id,
        Job.status == "failed"
    ).scalar()
    
    return {
        "node": {
            "id": node.id,
            "name": node.name,
            "is_active": node.is_active,
            "created_at": node.created_at.isoformat() if node.created_at else None
        },
        "statistics": {
            "jobs_assigned": jobs_assigned,
            "jobs_completed": jobs_completed,
            "jobs_failed": jobs_failed,
            "success_rate": (jobs_completed / jobs_assigned * 100) if jobs_assigned > 0 else 0
        }
    }

