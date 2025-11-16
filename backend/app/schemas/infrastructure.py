"""
Infrastructure Investment Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
from decimal import Decimal
from app.models.infrastructure import InfrastructureProvider, InfrastructureType, InfrastructureStatus

class InfrastructureInvestmentCreate(BaseModel):
    """Create infrastructure investment"""
    group_id: Optional[int] = Field(None, description="Optional: pool with group")
    provider: InfrastructureProvider
    infrastructure_type: InfrastructureType
    resource_specs: Dict = Field(..., description="Resource specifications: {gpu_type, cpu_cores, memory, etc.}")
    connection_info: Optional[Dict] = Field(None, description="Connection details (encrypted in production)")

class InfrastructureInvestmentResponse(BaseModel):
    """Infrastructure investment response"""
    id: int
    investor_id: int
    group_id: Optional[int] = None
    provider: InfrastructureProvider
    infrastructure_type: InfrastructureType
    resource_specs: Dict
    status: InfrastructureStatus
    allocated_to_model_id: Optional[int] = None
    allocated_at: Optional[datetime] = None
    total_earnings: str
    last_payout_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class InfrastructureUsageResponse(BaseModel):
    """Infrastructure usage response"""
    id: int
    investment_id: int
    model_id: int
    job_id: Optional[int] = None
    period: str  # "YYYY-MM"
    hours_used: str
    requests_processed: int
    tokens_processed: int
    earnings: str
    earnings_rate: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class InfrastructurePayoutResponse(BaseModel):
    """Infrastructure payout response"""
    id: int
    investment_id: int
    period: str  # "YYYY-MM"
    amount: str
    currency: str
    payment_tx_hash: Optional[str] = None
    payment_status: str
    to_wallet_address: str
    network: str
    paid_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AllocateInfrastructureRequest(BaseModel):
    """Allocate infrastructure to model"""
    model_id: int

class MyInfrastructureResponse(BaseModel):
    """User's infrastructure investments"""
    investments: List[InfrastructureInvestmentResponse]
    total_earnings: str
    active_investments: int

class InfrastructureStatsResponse(BaseModel):
    """Infrastructure statistics"""
    total_investments: int
    active_investments: int
    total_earnings: str
    allocated_investments: int
    available_investments: int

