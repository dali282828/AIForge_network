"""
NFT Service for managing NFT shares, minting, and reward distribution
"""
from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.nft import NFTShare, NFTReward, NFTRewardPool
from app.models.user import User
from app.core.config import settings
from app.services.revenue_service import RevenueService

class NFTService:
    """Service for managing NFT shares and rewards"""
    
    @staticmethod
    def get_next_token_id(db: Session) -> int:
        """Get next available token ID"""
        max_token = db.query(func.max(NFTShare.token_id)).scalar()
        return (max_token or 0) + 1
    
    @staticmethod
    def get_next_share_number(db: Session) -> int:
        """Get next share number"""
        max_share = db.query(func.max(NFTShare.share_number)).scalar()
        return (max_share or 0) + 1
    
    @staticmethod
    def create_nft_share(
        db: Session,
        wallet_address: str,
        token_id: int,
        contract_address: str,
        tx_hash: Optional[str] = None,
        block_number: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> NFTShare:
        """Create NFT share record after minting"""
        share_number = NFTService.get_next_share_number(db)
        
        nft_share = NFTShare(
            token_id=token_id,
            owner_wallet_address=wallet_address,
            owner_user_id=user_id,
            share_number=share_number,
            contract_address=contract_address,
            tx_hash=tx_hash,
            block_number=block_number,
            is_active=True
        )
        
        db.add(nft_share)
        db.commit()
        db.refresh(nft_share)
        
        return nft_share
    
    @staticmethod
    def get_user_nfts(db: Session, user_id: Optional[int] = None, wallet_address: Optional[str] = None) -> List[NFTShare]:
        """Get NFTs owned by user or wallet"""
        query = db.query(NFTShare).filter(NFTShare.is_active == True)
        
        if user_id:
            query = query.filter(NFTShare.owner_user_id == user_id)
        elif wallet_address:
            query = query.filter(NFTShare.owner_wallet_address == wallet_address)
        else:
            return []
        
        return query.order_by(NFTShare.share_number).all()
    
    @staticmethod
    def get_active_shares_count(db: Session) -> int:
        """Get total number of active NFT shares"""
        return db.query(func.count(NFTShare.id)).filter(NFTShare.is_active == True).scalar() or 0
    
    @staticmethod
    def get_total_holders(db: Session) -> int:
        """Get total number of unique NFT holders"""
        return db.query(func.count(func.distinct(NFTShare.owner_wallet_address))).filter(
            NFTShare.is_active == True
        ).scalar() or 0
    
    @staticmethod
    def calculate_reward_pool(db: Session, year: int, month: int) -> NFTRewardPool:
        """Calculate NFT reward pool for a period"""
        # Check if pool already exists
        existing_pool = db.query(NFTRewardPool).filter(
            and_(
                NFTRewardPool.period_year == year,
                NFTRewardPool.period_month == month
            )
        ).first()
        
        if existing_pool:
            return existing_pool
        
        # Get total active shares
        total_shares = NFTService.get_active_shares_count(db)
        
        if total_shares == 0:
            # No shares, create empty pool
            pool = NFTRewardPool(
                period_year=year,
                period_month=month,
                subscription_revenue_share=Decimal("0.00"),
                api_revenue_share=Decimal("0.00"),
                total_pool=Decimal("0.00"),
                total_shares=0,
                reward_per_share=Decimal("0.00"),
                is_distributed=False
            )
            db.add(pool)
            db.commit()
            db.refresh(pool)
            return pool
        
        # Calculate subscription revenue share (30% of subscription revenue)
        subscription_revenue = RevenueService.calculate_monthly_revenue(db, year, month)
        subscription_total = Decimal(str(subscription_revenue.get("subscription_revenue", {}).get("total_revenue", "0.00")))
        subscription_share = subscription_total * Decimal(str(settings.NFT_REWARD_SUBSCRIPTION_PERCENT))
        
        # Calculate API revenue share (10% of API revenue)
        api_revenue = subscription_revenue.get("api_revenue", {})
        api_total = Decimal(str(api_revenue.get("total_revenue", "0.00")))
        api_share = api_total * Decimal(str(settings.NFT_REWARD_API_PERCENT))
        
        # Total pool
        total_pool = subscription_share + api_share
        
        # Reward per share
        reward_per_share = total_pool / Decimal(str(total_shares)) if total_shares > 0 else Decimal("0.00")
        
        # Create pool
        pool = NFTRewardPool(
            period_year=year,
            period_month=month,
            subscription_revenue_share=subscription_share,
            api_revenue_share=api_share,
            total_pool=total_pool,
            total_shares=total_shares,
            reward_per_share=reward_per_share,
            is_distributed=False
        )
        
        db.add(pool)
        db.commit()
        db.refresh(pool)
        
        return pool
    
    @staticmethod
    def distribute_rewards(db: Session, year: int, month: int) -> List[NFTReward]:
        """Distribute rewards to all NFT holders for a period"""
        # Get or calculate reward pool
        pool = NFTService.calculate_reward_pool(db, year, month)
        
        if pool.is_distributed:
            # Already distributed, return existing rewards
            return db.query(NFTReward).filter(
                and_(
                    NFTReward.period_year == year,
                    NFTReward.period_month == month
                )
            ).all()
        
        if pool.total_pool == 0 or pool.total_shares == 0:
            # No rewards to distribute
            pool.is_distributed = True
            pool.distributed_at = datetime.utcnow()
            db.commit()
            return []
        
        # Get all active NFT shares
        nft_shares = db.query(NFTShare).filter(NFTShare.is_active == True).all()
        
        rewards = []
        for nft_share in nft_shares:
            # Calculate reward for this share
            reward_amount = pool.reward_per_share
            reward_percentage = (Decimal("1.0") / Decimal(str(pool.total_shares))) * Decimal("100.0")
            
            # Create reward record
            reward = NFTReward(
                nft_share_id=nft_share.id,
                period_year=year,
                period_month=month,
                reward_amount=reward_amount,
                reward_percentage=reward_percentage,
                total_pool_amount=pool.total_pool,
                total_shares=pool.total_shares,
                payment_status="pending"
            )
            
            db.add(reward)
            rewards.append(reward)
        
        # Mark pool as distributed
        pool.is_distributed = True
        pool.distributed_at = datetime.utcnow()
        
        db.commit()
        
        return rewards
    
    @staticmethod
    def get_user_rewards(
        db: Session,
        user_id: Optional[int] = None,
        wallet_address: Optional[str] = None
    ) -> List[NFTReward]:
        """Get rewards for user's NFTs"""
        # Get user's NFTs
        nfts = NFTService.get_user_nfts(db, user_id, wallet_address)
        nft_ids = [nft.id for nft in nfts]
        
        if not nft_ids:
            return []
        
        # Get rewards for these NFTs
        return db.query(NFTReward).filter(
            NFTReward.nft_share_id.in_(nft_ids)
        ).order_by(
            NFTReward.period_year.desc(),
            NFTReward.period_month.desc()
        ).all()
    
    @staticmethod
    def get_nft_stats(db: Session) -> Dict[str, Any]:
        """Get NFT statistics"""
        total_shares = NFTService.get_active_shares_count(db)
        total_holders = NFTService.get_total_holders(db)
        
        # Get current period pool (this month)
        now = datetime.utcnow()
        current_pool = db.query(NFTRewardPool).filter(
            and_(
                NFTRewardPool.period_year == now.year,
                NFTRewardPool.period_month == now.month
            )
        ).first()
        
        return {
            "total_shares": total_shares,
            "active_shares": total_shares,
            "total_holders": total_holders,
            "current_period_pool": str(current_pool.total_pool) if current_pool else None,
            "reward_per_share": str(current_pool.reward_per_share) if current_pool else None
        }

