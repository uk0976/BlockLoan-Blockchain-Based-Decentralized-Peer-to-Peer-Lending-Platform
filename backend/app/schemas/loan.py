from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LoanBase(BaseModel):
    borrower_address: str = Field(..., pattern="^0x[a-fA-F0-9]{40}$", description="Ethereum address of borrower")
    principal_eth: float = Field(..., gt=0, description="Requested principal amount in ETH")
    collateral_eth: float = Field(..., gt=0, description="Locked collateral amount in ETH")
    interest_rate_bps: int = Field(..., ge=50, le=5000, description="Interest rate in basis points (50 = 0.5%, 5000 = 50%)")
    duration_days: int = Field(..., ge=1, le=365, description="Loan tenure in days")


class LoanResponse(BaseModel):
    loan_id: int
    borrower_address: str
    lender_address: Optional[str] = None
    principal_eth: float
    collateral_eth: float
    interest_rate_bps: int
    duration_seconds: int
    status: str
    created_at: Optional[datetime] = None
    funded_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    tx_hash: Optional[str] = None

    class Config:
        from_attributes = True


class HealthResponse(BaseModel):
    status: str
    project: str
    blockchain_connected: bool
    version: str
