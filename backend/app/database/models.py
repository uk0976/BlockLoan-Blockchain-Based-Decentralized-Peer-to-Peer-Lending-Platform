from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from app.database.database import Base


class CachedLoan(Base):
    """
    Read-only cache of on-chain loans to accelerate search, filtering,
    and historical statistics.
    IMPORTANT: The smart contract remains the sole source of truth for all financial state.
    """
    __tablename__ = "cached_loans"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, unique=True, index=True, nullable=False)
    borrower_address = Column(String(42), index=True, nullable=False)
    lender_address = Column(String(42), index=True, nullable=True)
    principal_eth = Column(Float, nullable=False)
    principal_wei = Column(String(78), nullable=False)
    interest_rate_bps = Column(Integer, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="OPEN")
    
    # Financial progress
    total_due_eth = Column(Float, nullable=False, default=0.0)
    total_repaid_eth = Column(Float, nullable=False, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    funded_at = Column(DateTime, nullable=True)
    repayment_deadline = Column(DateTime, nullable=True)
    
    # Cache integrity tracking
    is_synced_with_chain = Column(Boolean, default=True)
    last_synced_at = Column(DateTime, default=datetime.utcnow)


class LoanMetadata(Base):
    """
    Off-chain descriptive metadata provided by the borrower (e.g. project title,
    detailed description of funds usage).
    """
    __tablename__ = "loan_metadata"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, unique=True, index=True, nullable=False)
    title = Column(String(120), nullable=False)
    purpose = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserProfile(Base):
    """
    Off-chain user profile associated with a public Ethereum address.
    Strictly pseudonymous; stores no private keys, passwords, or PII.
    """
    __tablename__ = "user_profiles"

    wallet_address = Column(String(42), primary_key=True, index=True)
    display_name = Column(String(64), nullable=True)
    bio = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CachedEventLog(Base):
    """
    Cryptographically verified on-chain event log indexed from the BlockLoan smart contract.
    """
    __tablename__ = "cached_event_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String(32), index=True, nullable=False)
    transaction_hash = Column(String(66), index=True, nullable=False)
    block_number = Column(Integer, index=True, nullable=False)
    loan_id = Column(Integer, index=True, nullable=False)
    from_address = Column(String(42), nullable=False)
    to_address = Column(String(42), nullable=True)
    value_eth = Column(Float, nullable=False, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)
