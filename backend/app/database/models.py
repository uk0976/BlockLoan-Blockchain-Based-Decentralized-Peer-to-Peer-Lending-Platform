from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum
import enum
from app.database.session import Base


class LoanStatusEnum(str, enum.Enum):
    REQUESTED = "Requested"
    FUNDED = "Funded"
    REPAID = "Repaid"
    DEFAULTED = "Defaulted"
    LIQUIDATED = "Liquidated"
    CANCELLED = "Cancelled"


class CachedLoan(Base):
    """
    Read-only cache of on-chain loans to accelerate search, filtering,
    and historical statistics. All source of truth and state changes remain on-chain.
    """
    __tablename__ = "cached_loans"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, unique=True, index=True, nullable=False)
    borrower_address = Column(String(42), index=True, nullable=False)
    lender_address = Column(String(42), index=True, nullable=True)
    principal_eth = Column(Float, nullable=False)
    collateral_eth = Column(Float, nullable=False)
    interest_rate_bps = Column(Integer, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    status = Column(SQLEnum(LoanStatusEnum), default=LoanStatusEnum.REQUESTED, nullable=False)
    
    # On-chain timestamp records
    created_at = Column(DateTime, default=datetime.utcnow)
    funded_at = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    tx_hash = Column(String(66), nullable=True)
