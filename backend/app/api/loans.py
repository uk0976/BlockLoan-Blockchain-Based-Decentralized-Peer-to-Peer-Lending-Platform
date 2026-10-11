from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.loan import (
    LoanDetailResponse,
    LoanStatusResponse,
    RepaymentRecord,
    LoanMetadataCreate,
    LoanMetadataResponse,
)
from app.services.blockchain_service import blockchain_service
from app.services.loan_service import loan_service

router = APIRouter(prefix="/loans", tags=["Loans"])


@router.get("", response_model=List[LoanDetailResponse])
def get_loans(
    status: Optional[str] = Query(None, description="Filter by status: OPEN, ACTIVE, COMPLETED, DEFAULTED, CANCELLED"),
    db: Session = Depends(get_db),
):
    """
    Retrieve all peer-to-peer loans. Combines immutable on-chain financial parameters
    with off-chain metadata (title, purpose).
    """
    return loan_service.get_all_loans(db, status_filter=status)


@router.get("/{loan_id}", response_model=LoanDetailResponse)
def get_loan_details(loan_id: int, db: Session = Depends(get_db)):
    """
    Retrieve verified parameters and metadata for a specific loan contract.
    """
    if loan_id < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan ID must be a positive integer, received {loan_id}",
        )
    try:
        return loan_service.get_loan_by_id(db, loan_id=loan_id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ConnectionError, RuntimeError, ValueError) as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))


@router.get("/{loan_id}/status", response_model=LoanStatusResponse)
def get_loan_status(loan_id: int):
    """
    Lightweight on-chain status verification and remaining due amount for a loan.
    """
    if loan_id < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan ID must be a positive integer, received {loan_id}",
        )
    try:
        return blockchain_service.get_loan_status(loan_id=loan_id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ConnectionError, RuntimeError, ValueError) as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))


@router.get("/{loan_id}/repayments", response_model=List[RepaymentRecord])
def get_loan_repayments(loan_id: int):
    """
    Query confirmed on-chain RepaymentMade event logs for a specific loan ID.
    """
    if loan_id < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan ID must be a positive integer, received {loan_id}",
        )
    try:
        return blockchain_service.get_loan_repayments(loan_id=loan_id)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ConnectionError, RuntimeError, ValueError) as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))


@router.post("/{loan_id}/metadata", response_model=LoanMetadataResponse)
def set_loan_metadata(
    loan_id: int,
    payload: LoanMetadataCreate,
    db: Session = Depends(get_db),
):
    """
    Save or update off-chain descriptive metadata (proposal title and purpose)
    in the SQLite database for a loan ID.
    """
    if loan_id < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan ID must be a positive integer, received {loan_id}",
        )
    try:
        meta = loan_service.set_loan_metadata(
            db, loan_id=loan_id, title=payload.title, purpose=payload.purpose
        )
        return meta
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
