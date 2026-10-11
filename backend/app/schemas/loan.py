from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    project: str
    blockchain_connected: bool
    chain_id: Optional[int] = None
    contract_deployed: bool = False
    contract_address: Optional[str] = None
    version: str = "0.1.0"


class LoanMetadataCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=120, description="Brief proposal title")
    purpose: str = Field(..., min_length=10, max_length=2000, description="Detailed intended use of funds")


class LoanMetadataResponse(BaseModel):
    loan_id: int
    title: str
    purpose: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LoanDetailResponse(BaseModel):
    id: int
    title: str
    purpose: str
    borrower: str = Field(..., pattern="^0x[a-fA-F0-9]{40}$")
    lender: Optional[str] = None
    principal_eth: float
    principal_wei: str
    interest_rate_bps: int
    apr_percent: float
    duration_days: int
    duration_seconds: int
    status: str
    created_at: Optional[datetime] = None
    funded_at: Optional[datetime] = None
    repayment_deadline: Optional[datetime] = None
    total_due_eth: float
    total_repaid_eth: float
    remaining_due_eth: float
    is_on_chain: bool = True
    source: str = "on_chain_verified"


class LoanStatusResponse(BaseModel):
    loan_id: int
    status: str
    is_open: bool
    is_active: bool
    is_completed: bool
    is_defaulted: bool
    repayment_deadline: Optional[datetime] = None
    remaining_due_eth: float = 0.0


class RepaymentRecord(BaseModel):
    loan_id: int
    amount_paid_eth: float
    remaining_due_eth: float
    borrower_address: str
    tx_hash: str
    block_number: int
    timestamp: Optional[datetime] = None


class TransactionReceiptResponse(BaseModel):
    tx_hash: str
    status: int
    status_text: str
    block_number: int
    from_address: str
    to_address: Optional[str] = None
    gas_used: int
    events: List[Dict[str, Any]] = []


class AdminStatisticsResponse(BaseModel):
    total_loans: int
    open_loans: int
    active_loans: int
    completed_loans: int
    defaulted_loans: int
    total_volume_eth: float
    total_repaid_eth: float
    chain_id: Optional[int] = None
    node_connected: bool
    contract_address: Optional[str] = None
    contract_deployed: bool
