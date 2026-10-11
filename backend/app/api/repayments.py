from typing import List
from fastapi import APIRouter, HTTPException, status

from app.schemas.loan import RepaymentRecord, TransactionReceiptResponse
from app.services.blockchain_service import blockchain_service

router = APIRouter(tags=["Repayments & Transactions"])


@router.get("/repayments/{loan_id}", response_model=List[RepaymentRecord])
def get_repayments_by_loan(loan_id: int):
    """
    Look up all verified on-chain repayments recorded for a loan ID.
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


@router.get("/transactions/{tx_hash}", response_model=TransactionReceiptResponse)
def get_transaction_receipt(tx_hash: str):
    """
    Look up verified transaction receipt and decoded smart contract events on-chain.
    """
    if not tx_hash.startswith("0x") or len(tx_hash) != 66:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction hash format. Expected 0x + 64 hexadecimal characters.",
        )
    try:
        return blockchain_service.get_transaction_receipt(tx_hash)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (ConnectionError, ValueError) as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
