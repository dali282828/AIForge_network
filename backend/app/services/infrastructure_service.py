"""
Infrastructure Investment Service
"""
from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.infrastructure import (
    InfrastructureInvestment, InfrastructureUsage, InfrastructurePayout,
    InfrastructureProvider, InfrastructureType, InfrastructureStatus
)
from app.models.user import User
from app.models.model import Model

class InfrastructureService:
    """Service for managing infrastructure investments"""
    
    @staticmethod
    def create_investment(
        db: Session,
        investor_id: int,
        provider: InfrastructureProvider,
        infrastructure_type: InfrastructureType,
        resource_specs: Dict,
        group_id: Optional[int] = None,
        connection_info: Optional[Dict] = None
    ) -> InfrastructureInvestment:
        """Create a new infrastructure investment"""
        investment = InfrastructureInvestment(
            investor_id=investor_id,
            group_id=group_id,
            provider=provider,
            infrastructure_type=infrastructure_type,
            resource_specs=resource_specs,
            connection_info=connection_info,
            status=InfrastructureStatus.PENDING
        )
        
        db.add(investment)
        db.commit()
        db.refresh(investment)
        
        return investment
    
    @staticmethod
    def activate_investment(
        db: Session,
        investment_id: int
    ) -> InfrastructureInvestment:
        """Activate an infrastructure investment"""
        investment = db.query(InfrastructureInvestment).filter(
            InfrastructureInvestment.id == investment_id
        ).first()
        
        if not investment:
            raise ValueError("Investment not found")
        
        investment.status = InfrastructureStatus.ACTIVE
        db.commit()
        db.refresh(investment)
        
        return investment
    
    @staticmethod
    def allocate_to_model(
        db: Session,
        investment_id: int,
        model_id: int
    ) -> InfrastructureInvestment:
        """Allocate infrastructure to a model"""
        investment = db.query(InfrastructureInvestment).filter(
            InfrastructureInvestment.id == investment_id
        ).first()
        
        if not investment:
            raise ValueError("Investment not found")
        
        if investment.status != InfrastructureStatus.ACTIVE:
            raise ValueError("Investment must be active to allocate")
        
        # Verify model exists
        model = db.query(Model).filter(Model.id == model_id).first()
        if not model:
            raise ValueError("Model not found")
        
        investment.allocated_to_model_id = model_id
        investment.allocated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(investment)
        
        return investment
    
    @staticmethod
    def deallocate_from_model(
        db: Session,
        investment_id: int
    ) -> InfrastructureInvestment:
        """Deallocate infrastructure from model"""
        investment = db.query(InfrastructureInvestment).filter(
            InfrastructureInvestment.id == investment_id
        ).first()
        
        if not investment:
            raise ValueError("Investment not found")
        
        investment.allocated_to_model_id = None
        investment.allocated_at = None
        
        db.commit()
        db.refresh(investment)
        
        return investment
    
    @staticmethod
    def record_usage(
        db: Session,
        investment_id: int,
        model_id: int,
        period_year: int,
        period_month: int,
        hours_used: Decimal,
        requests_processed: int = 0,
        tokens_processed: int = 0,
        earnings: Decimal = Decimal("0.00"),
        earnings_rate: Decimal = Decimal("0.00"),
        job_id: Optional[int] = None
    ) -> InfrastructureUsage:
        """Record infrastructure usage"""
        # Check if usage record already exists for this period
        existing = db.query(InfrastructureUsage).filter(
            and_(
                InfrastructureUsage.investment_id == investment_id,
                InfrastructureUsage.model_id == model_id,
                InfrastructureUsage.period_year == period_year,
                InfrastructureUsage.period_month == period_month
            )
        ).first()
        
        if existing:
            # Update existing record
            existing.hours_used += hours_used
            existing.requests_processed += requests_processed
            existing.tokens_processed += tokens_processed
            existing.earnings += earnings
            db.commit()
            db.refresh(existing)
            return existing
        
        # Create new usage record
        usage = InfrastructureUsage(
            investment_id=investment_id,
            model_id=model_id,
            job_id=job_id,
            period_year=period_year,
            period_month=period_month,
            hours_used=hours_used,
            requests_processed=requests_processed,
            tokens_processed=tokens_processed,
            earnings=earnings,
            earnings_rate=earnings_rate
        )
        
        db.add(usage)
        
        # Update investment total earnings
        investment = db.query(InfrastructureInvestment).filter(
            InfrastructureInvestment.id == investment_id
        ).first()
        if investment:
            investment.total_earnings += earnings
        
        db.commit()
        db.refresh(usage)
        
        return usage
    
    @staticmethod
    def get_user_investments(
        db: Session,
        user_id: int
    ) -> List[InfrastructureInvestment]:
        """Get all investments for a user"""
        return db.query(InfrastructureInvestment).filter(
            InfrastructureInvestment.investor_id == user_id
        ).order_by(InfrastructureInvestment.created_at.desc()).all()
    
    @staticmethod
    def get_available_investments(
        db: Session,
        infrastructure_type: Optional[InfrastructureType] = None
    ) -> List[InfrastructureInvestment]:
        """Get available (active, not allocated) investments"""
        query = db.query(InfrastructureInvestment).filter(
            InfrastructureInvestment.status == InfrastructureStatus.ACTIVE,
            InfrastructureInvestment.allocated_to_model_id == None
        )
        
        if infrastructure_type:
            query = query.filter(
                InfrastructureInvestment.infrastructure_type == infrastructure_type
            )
        
        return query.all()
    
    @staticmethod
    def get_investment_earnings(
        db: Session,
        investment_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get earnings for an investment"""
        query = db.query(InfrastructureUsage).filter(
            InfrastructureUsage.investment_id == investment_id
        )
        
        if year and month:
            query = query.filter(
                and_(
                    InfrastructureUsage.period_year == year,
                    InfrastructureUsage.period_month == month
                )
            )
        
        usage_records = query.all()
        
        total_earnings = sum(Decimal(str(r.earnings)) for r in usage_records)
        total_hours = sum(Decimal(str(r.hours_used)) for r in usage_records)
        total_requests = sum(r.requests_processed for r in usage_records)
        
        return {
            "investment_id": investment_id,
            "total_earnings": str(total_earnings),
            "total_hours": str(total_hours),
            "total_requests": total_requests,
            "usage_records": usage_records
        }
    
    @staticmethod
    def create_payout(
        db: Session,
        investment_id: int,
        period_year: int,
        period_month: int,
        amount: Decimal,
        to_wallet_address: str,
        network: str = "tron",
        currency: str = "USDT"
    ) -> InfrastructurePayout:
        """Create a payout record"""
        payout = InfrastructurePayout(
            investment_id=investment_id,
            period_year=period_year,
            period_month=period_month,
            amount=amount,
            currency=currency,
            to_wallet_address=to_wallet_address,
            network=network,
            payment_status="pending"
        )
        
        db.add(payout)
        
        # Update investment last payout
        investment = db.query(InfrastructureInvestment).filter(
            InfrastructureInvestment.id == investment_id
        ).first()
        if investment:
            investment.last_payout_at = datetime.utcnow()
        
        db.commit()
        db.refresh(payout)
        
        return payout
    
    @staticmethod
    def get_infrastructure_stats(db: Session) -> Dict[str, Any]:
        """Get infrastructure statistics"""
        total = db.query(func.count(InfrastructureInvestment.id)).scalar() or 0
        active = db.query(func.count(InfrastructureInvestment.id)).filter(
            InfrastructureInvestment.status == InfrastructureStatus.ACTIVE
        ).scalar() or 0
        allocated = db.query(func.count(InfrastructureInvestment.id)).filter(
            InfrastructureInvestment.allocated_to_model_id != None
        ).scalar() or 0
        
        total_earnings = db.query(func.sum(InfrastructureInvestment.total_earnings)).scalar() or Decimal("0.00")
        
        return {
            "total_investments": total,
            "active_investments": active,
            "allocated_investments": allocated,
            "available_investments": active - allocated,
            "total_earnings": str(total_earnings)
        }

