"""
Group Revenue Service for managing revenue splits among group members
"""
from typing import Dict, List, Optional
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
import json
from app.models.model import Model
from app.models.group import Group, GroupMembership
from app.models.model_publishing import GroupRevenueSplit, RevenueDistribution
from app.models.api_service import APIService, APIRequest
from app.services.revenue_service import RevenueService

class GroupRevenueService:
    """Service for managing group revenue splits and distributions"""
    
    @staticmethod
    def create_or_update_split(
        model_id: int,
        split_config: Dict[int, float],  # {user_id: percentage}
        min_percentage: float = 5.0,
        usage_bonus: float = 0.0,
        db: Session = None
    ) -> GroupRevenueSplit:
        """Create or update revenue split configuration for a group model"""
        model = db.query(Model).filter(Model.id == model_id).first()
        if not model:
            raise ValueError("Model not found")
        
        # Verify it's a group model
        group = db.query(Group).filter(Group.id == model.group_id).first()
        if not group:
            raise ValueError("Group not found")
        
        # Validate split percentages sum to 100
        total_percent = sum(split_config.values())
        if abs(total_percent - 100.0) > 0.01:  # Allow small floating point errors
            raise ValueError(f"Split percentages must sum to 100%, got {total_percent}%")
        
        # Validate minimum percentage
        for user_id, percent in split_config.items():
            if percent < min_percentage:
                raise ValueError(f"User {user_id} has {percent}% which is below minimum {min_percentage}%")
        
        # Check if split exists
        existing = db.query(GroupRevenueSplit).filter(
            GroupRevenueSplit.model_id == model_id
        ).first()
        
        if existing:
            # Update existing
            existing.split_config = json.dumps(split_config)
            existing.min_percentage_per_member = Decimal(str(min_percentage))
            existing.usage_bonus_percent = Decimal(str(usage_bonus))
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Create new
            split = GroupRevenueSplit(
                model_id=model_id,
                group_id=model.group_id,
                split_config=json.dumps(split_config),
                min_percentage_per_member=Decimal(str(min_percentage)),
                usage_bonus_percent=Decimal(str(usage_bonus))
            )
            db.add(split)
            db.commit()
            db.refresh(split)
            return split
    
    @staticmethod
    def get_split_config(model_id: int, db: Session) -> Optional[Dict]:
        """Get revenue split configuration for a model"""
        split = db.query(GroupRevenueSplit).filter(
            GroupRevenueSplit.model_id == model_id
        ).first()
        
        if not split:
            return None
        
        return {
            "model_id": model_id,
            "group_id": split.group_id,
            "split_config": json.loads(split.split_config),
            "min_percentage": float(split.min_percentage_per_member),
            "usage_bonus": float(split.usage_bonus_percent)
        }
    
    @staticmethod
    def calculate_group_revenue_distribution(
        model_id: int,
        year: int,
        month: int,
        db: Session
    ) -> Dict:
        """Calculate revenue distribution for a group model"""
        # Get split configuration
        split = db.query(GroupRevenueSplit).filter(
            GroupRevenueSplit.model_id == model_id
        ).first()
        
        if not split:
            raise ValueError("No revenue split configuration found for this model")
        
        # Get model usage revenue (already has platform fee deducted)
        usage_revenue = RevenueService.calculate_model_usage_revenue(db, model_id, year, month)
        
        # Get subscription revenue distribution (already has platform fee deducted - 70% model pool)
        subscription_dist = RevenueService.calculate_subscription_revenue_distribution(db, year, month)
        
        # Find this model's share in subscription pool (already net after 30% platform fee)
        model_share = Decimal("0.00")
        for dist in subscription_dist.get("distribution", []):
            if dist["model_id"] == model_id:
                model_share = Decimal(dist["revenue_share"])
                break
        
        # Total NET revenue for this model (platform fees already deducted)
        # - Subscription share: Already 70% of subscription revenue (30% platform fee already taken)
        # - Usage revenue: Already net after 10% platform fee deducted
        total_revenue = model_share + Decimal(usage_revenue["total_revenue"])
        
        # Parse split configuration
        split_config = json.loads(split.split_config)
        
        # Calculate distribution
        distribution = {}
        for user_id_str, percentage in split_config.items():
            user_id = int(user_id_str)
            amount = total_revenue * Decimal(str(percentage)) / Decimal("100.0")
            distribution[user_id] = {
                "user_id": user_id,
                "percentage": percentage,
                "amount": str(amount)
            }
        
        return {
            "model_id": model_id,
            "period": f"{year}-{month:02d}",
            "total_revenue": str(total_revenue),  # NET revenue (platform fees already deducted)
            "subscription_share": str(model_share),  # From 70% model pool (30% platform fee already taken)
            "usage_revenue": usage_revenue["total_revenue"],  # NET after 10% platform fee
            "usage_gross_revenue": usage_revenue.get("gross_revenue", "0.00"),  # Gross before platform fee
            "usage_platform_fee": usage_revenue.get("platform_fee", "0.00"),  # Platform fee from usage
            "distribution": list(distribution.values())
        }
    
    @staticmethod
    def distribute_revenue(
        model_id: int,
        year: int,
        month: int,
        db: Session
    ) -> RevenueDistribution:
        """Create revenue distribution record and mark as distributed"""
        # Calculate distribution
        dist_data = GroupRevenueService.calculate_group_revenue_distribution(
            model_id, year, month, db
        )
        
        # Get subscription distribution to get platform fee
        subscription_dist = RevenueService.calculate_subscription_revenue_distribution(db, year, month)
        platform_fee = Decimal(subscription_dist.get("platform_fee", "0.00"))
        model_pool = Decimal(subscription_dist.get("model_pool", "0.00"))
        
        # Create distribution record
        distribution = RevenueDistribution(
            model_id=model_id,
            period_year=year,
            period_month=month,
            total_revenue=Decimal(dist_data["total_revenue"]),
            platform_fee=platform_fee,
            model_pool=model_pool,
            distribution_details=json.dumps(dist_data["distribution"]),
            is_distributed=True,
            distributed_at=datetime.utcnow()
        )
        
        db.add(distribution)
        db.commit()
        db.refresh(distribution)
        
        return distribution
    
    @staticmethod
    def get_default_split_for_group(group_id: int, db: Session) -> Dict[int, float]:
        """Generate default split based on group membership (equal split)"""
        memberships = db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id
        ).all()
        
        if not memberships:
            return {}
        
        # Equal split
        num_members = len(memberships)
        percentage_per_member = 100.0 / num_members
        
        split = {}
        for membership in memberships:
            split[membership.user_id] = percentage_per_member
        
        return split
    
    @staticmethod
    def get_user_earnings_from_groups(
        user_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None,
        db: Session = None
    ) -> Dict:
        """Get total earnings for a user from all group models"""
        # Get all group memberships
        memberships = db.query(GroupMembership).filter(
            GroupMembership.user_id == user_id
        ).all()
        
        group_ids = [m.group_id for m in memberships]
        
        if not group_ids:
            return {
                "user_id": user_id,
                "total_earnings": "0.00",
                "by_model": []
            }
        
        # Get all models in these groups
        models = db.query(Model).filter(Model.group_id.in_(group_ids)).all()
        model_ids = [m.id for m in models]
        
        if not model_ids:
            return {
                "user_id": user_id,
                "total_earnings": "0.00",
                "by_model": []
            }
        
        # Get revenue splits for these models
        splits = db.query(GroupRevenueSplit).filter(
            GroupRevenueSplit.model_id.in_(model_ids)
        ).all()
        
        total_earnings = Decimal("0.00")
        by_model = []
        
        for split in splits:
            split_config = json.loads(split.split_config)
            user_percentage = split_config.get(str(user_id), 0.0)
            
            if user_percentage > 0:
                # Get model revenue
                if year and month:
                    dist_data = GroupRevenueService.calculate_group_revenue_distribution(
                        split.model_id, year, month, db
                    )
                    model_revenue = Decimal(dist_data["total_revenue"])
                    user_earnings = model_revenue * Decimal(str(user_percentage)) / Decimal("100.0")
                    
                    total_earnings += user_earnings
                    by_model.append({
                        "model_id": split.model_id,
                        "model_name": None,  # Could fetch from model
                        "percentage": user_percentage,
                        "earnings": str(user_earnings)
                    })
        
        return {
            "user_id": user_id,
            "period": f"{year}-{month:02d}" if year and month else "all",
            "total_earnings": str(total_earnings),
            "by_model": by_model
        }

