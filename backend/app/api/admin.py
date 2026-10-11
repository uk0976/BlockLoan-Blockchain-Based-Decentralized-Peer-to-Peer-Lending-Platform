from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.loan import AdminStatisticsResponse
from app.services.blockchain_service import blockchain_service
from app.services.loan_service import loan_service

router = APIRouter(prefix="/admin", tags=["Admin & Diagnostics"])


@router.get("/statistics", response_model=AdminStatisticsResponse)
def get_admin_statistics(db: Session = Depends(get_db)):
    """
    High-level read-only protocol statistics aggregating total loans, volume,
    settlement rates, and network connectivity.
    """
    return loan_service.get_admin_statistics(db)


@router.get("/audit")
def get_node_audit() -> Dict[str, Any]:
    """
    Comprehensive diagnostics of Hardhat node connectivity, chain ID,
    contract deployment state, and runtime bytecode verification.
    """
    return blockchain_service.get_status_overview()
