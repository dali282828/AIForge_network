from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from decimal import Decimal

class RevenueSplitConfig(BaseModel):
    split_config: Dict[int, float] = Field(..., description="User ID to percentage mapping, e.g., {1: 50.0, 2: 30.0, 3: 20.0}")
    min_percentage: float = Field(5.0, ge=0, le=100, description="Minimum percentage per member")
    usage_bonus: float = Field(0.0, ge=0, le=20, description="Usage-based bonus percentage (0-20%)")

class RevenueSplitResponse(BaseModel):
    model_id: int
    group_id: int
    split_config: Dict[int, float]
    min_percentage: float
    usage_bonus: float

class RevenueDistributionResponse(BaseModel):
    model_id: int
    period: str
    total_revenue: str  # NET revenue (platform fees already deducted)
    subscription_share: str  # From 70% model pool (30% platform fee already taken)
    usage_revenue: str  # NET after 10% platform fee
    usage_gross_revenue: Optional[str] = None  # Gross before platform fee
    usage_platform_fee: Optional[str] = None  # Platform fee from usage
    distribution: List[Dict]

class UserGroupEarningsResponse(BaseModel):
    user_id: int
    period: str
    total_earnings: str
    by_model: List[Dict]

