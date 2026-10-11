from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from web3 import Web3

from app.database.database import get_db
from app.schemas.user import UserProfileResponse, UserProfileUpdate
from app.services.loan_service import loan_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{wallet_address}", response_model=UserProfileResponse)
def get_user_profile(wallet_address: str, db: Session = Depends(get_db)):
    """
    Retrieve user profile and loan participation metrics for an Ethereum address.
    Strictly pseudonymous; no private keys, passwords, or PII.
    """
    if not Web3.is_address(wallet_address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Ethereum wallet address: '{wallet_address}'",
        )
    try:
        return loan_service.get_or_create_user_profile(db, wallet_address)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{wallet_address}", response_model=UserProfileResponse)
def update_user_profile(
    wallet_address: str,
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
):
    """
    Update off-chain moniker and bio for a wallet address.
    """
    if not Web3.is_address(wallet_address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Ethereum wallet address: '{wallet_address}'",
        )
    try:
        return loan_service.update_user_profile(
            db,
            wallet_address=wallet_address,
            display_name=payload.display_name,
            bio=payload.bio,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
