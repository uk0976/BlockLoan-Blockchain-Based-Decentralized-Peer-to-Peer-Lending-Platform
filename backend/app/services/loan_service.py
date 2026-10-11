import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from web3 import Web3

from app.database.models import CachedLoan, LoanMetadata, UserProfile
from app.services.blockchain_service import blockchain_service

logger = logging.getLogger(__name__)


class LoanService:
    @staticmethod
    def get_all_loans(db: Session, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieve all loans. Merges verified on-chain parameters with off-chain
        SQLite metadata (title, purpose).
        Gracefully falls back to SQLite cache with source='cached_offline' if node is offline.
        """
        results: List[Dict[str, Any]] = []

        try:
            loan_count = blockchain_service.get_loan_count()
            for i in range(1, loan_count + 1):
                try:
                    on_chain_loan = blockchain_service.get_loan(i)

                    # Look up SQLite metadata
                    meta = db.query(LoanMetadata).filter(LoanMetadata.loan_id == i).first()
                    title = meta.title if meta else f"Loan Proposal #{i}"
                    purpose = (
                        meta.purpose
                        if meta
                        else f"Peer credit facility for {on_chain_loan['principal_eth']} ETH at {on_chain_loan['apr_percent']}% APR"
                    )

                    on_chain_loan["title"] = title
                    on_chain_loan["purpose"] = purpose

                    # Upsert into CachedLoan table
                    cached = db.query(CachedLoan).filter(CachedLoan.loan_id == i).first()
                    if not cached:
                        cached = CachedLoan(loan_id=i)
                        db.add(cached)

                    cached.borrower_address = on_chain_loan["borrower"]
                    cached.lender_address = on_chain_loan["lender"]
                    cached.principal_eth = on_chain_loan["principal_eth"]
                    cached.principal_wei = on_chain_loan["principal_wei"]
                    cached.interest_rate_bps = on_chain_loan["interest_rate_bps"]
                    cached.duration_seconds = on_chain_loan["duration_seconds"]
                    cached.status = on_chain_loan["status"]
                    cached.total_due_eth = on_chain_loan["total_due_eth"]
                    cached.total_repaid_eth = on_chain_loan["total_repaid_eth"]
                    cached.created_at = on_chain_loan["created_at"].replace(tzinfo=None) if on_chain_loan["created_at"] else datetime.utcnow()
                    cached.funded_at = on_chain_loan["funded_at"].replace(tzinfo=None) if on_chain_loan["funded_at"] else None
                    cached.repayment_deadline = on_chain_loan["repayment_deadline"].replace(tzinfo=None) if on_chain_loan["repayment_deadline"] else None
                    cached.is_synced_with_chain = True
                    cached.last_synced_at = datetime.utcnow()

                    if not status_filter or on_chain_loan["status"].upper() == status_filter.upper():
                        results.append(on_chain_loan)
                except Exception as inner_e:
                    logger.warning(f"Error fetching loan #{i}: {inner_e}")

            db.commit()
            return results

        except Exception as e:
            logger.warning(f"Blockchain query failed ({e}); falling back to SQLite cache.")
            # Fall back to SQLite cache
            query = db.query(CachedLoan)
            if status_filter:
                query = query.filter(CachedLoan.status == status_filter.upper())

            cached_items = query.all()
            for c in cached_items:
                meta = db.query(LoanMetadata).filter(LoanMetadata.loan_id == c.loan_id).first()
                title = meta.title if meta else f"Loan Proposal #{c.loan_id}"
                purpose = meta.purpose if meta else f"Cached loan facility for {c.principal_eth} ETH"

                results.append({
                    "id": c.loan_id,
                    "title": title,
                    "purpose": purpose,
                    "borrower": c.borrower_address,
                    "lender": c.lender_address,
                    "principal_eth": c.principal_eth,
                    "principal_wei": c.principal_wei,
                    "interest_rate_bps": c.interest_rate_bps,
                    "apr_percent": c.interest_rate_bps / 100.0,
                    "duration_days": max(1, round(c.duration_seconds / 86400)),
                    "duration_seconds": c.duration_seconds,
                    "status": c.status,
                    "status_code": 0,
                    "created_at": c.created_at,
                    "funded_at": c.funded_at,
                    "repayment_deadline": c.repayment_deadline,
                    "total_due_eth": c.total_due_eth,
                    "total_repaid_eth": c.total_repaid_eth,
                    "remaining_due_eth": max(0.0, c.total_due_eth - c.total_repaid_eth),
                    "is_on_chain": False,
                    "source": "cached_offline",
                })
            return results

    @staticmethod
    def get_loan_by_id(db: Session, loan_id: int) -> Dict[str, Any]:
        """
        Fetch a specific loan by ID. Prioritizes verified on-chain state,
        enriched with SQLite metadata.
        """
        try:
            on_chain_loan = blockchain_service.get_loan(loan_id)
            meta = db.query(LoanMetadata).filter(LoanMetadata.loan_id == loan_id).first()
            title = meta.title if meta else f"Loan Proposal #{loan_id}"
            purpose = (
                meta.purpose
                if meta
                else f"Peer credit facility for {on_chain_loan['principal_eth']} ETH at {on_chain_loan['apr_percent']}% APR"
            )

            on_chain_loan["title"] = title
            on_chain_loan["purpose"] = purpose
            return on_chain_loan

        except (ConnectionError, RuntimeError, ValueError) as chain_err:
            # Fall back to SQLite cache if blockchain is unavailable
            cached = db.query(CachedLoan).filter(CachedLoan.loan_id == loan_id).first()
            if not cached:
                raise chain_err

            meta = db.query(LoanMetadata).filter(LoanMetadata.loan_id == loan_id).first()
            title = meta.title if meta else f"Loan Proposal #{loan_id}"
            purpose = meta.purpose if meta else f"Cached loan facility for {cached.principal_eth} ETH"

            return {
                "id": cached.loan_id,
                "title": title,
                "purpose": purpose,
                "borrower": cached.borrower_address,
                "lender": cached.lender_address,
                "principal_eth": cached.principal_eth,
                "principal_wei": cached.principal_wei,
                "interest_rate_bps": cached.interest_rate_bps,
                "apr_percent": cached.interest_rate_bps / 100.0,
                "duration_days": max(1, round(cached.duration_seconds / 86400)),
                "duration_seconds": cached.duration_seconds,
                "status": cached.status,
                "status_code": 0,
                "created_at": cached.created_at,
                "funded_at": cached.funded_at,
                "repayment_deadline": cached.repayment_deadline,
                "total_due_eth": cached.total_due_eth,
                "total_repaid_eth": cached.total_repaid_eth,
                "remaining_due_eth": max(0.0, cached.total_due_eth - cached.total_repaid_eth),
                "is_on_chain": False,
                "source": "cached_offline",
            }

    @staticmethod
    def set_loan_metadata(db: Session, loan_id: int, title: str, purpose: str) -> LoanMetadata:
        """Create or update descriptive off-chain metadata for a loan."""
        if loan_id < 1:
            raise ValueError(f"Invalid loan ID: {loan_id}")

        meta = db.query(LoanMetadata).filter(LoanMetadata.loan_id == loan_id).first()
        if not meta:
            meta = LoanMetadata(loan_id=loan_id, title=title, purpose=purpose)
            db.add(meta)
        else:
            meta.title = title
            meta.purpose = purpose
            meta.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(meta)
        return meta

    @staticmethod
    def get_or_create_user_profile(db: Session, wallet_address: str) -> Dict[str, Any]:
        """Fetch or create pseudonymous user profile in SQLite."""
        if not Web3.is_address(wallet_address):
            raise ValueError(f"Invalid Ethereum address: {wallet_address}")

        checksummed = Web3.to_checksum_address(wallet_address)
        profile = db.query(UserProfile).filter(UserProfile.wallet_address == checksummed).first()
        if not profile:
            profile = UserProfile(
                wallet_address=checksummed,
                display_name=None,
                bio=None,
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

        # Count loans in SQLite cache
        borrowed_count = db.query(CachedLoan).filter(CachedLoan.borrower_address == checksummed).count()
        funded_count = db.query(CachedLoan).filter(CachedLoan.lender_address == checksummed).count()

        return {
            "wallet_address": profile.wallet_address,
            "display_name": profile.display_name,
            "bio": profile.bio,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
            "borrowed_loans_count": borrowed_count,
            "funded_loans_count": funded_count,
        }

    @staticmethod
    def update_user_profile(
        db: Session, wallet_address: str, display_name: Optional[str], bio: Optional[str]
    ) -> Dict[str, Any]:
        """Update off-chain profile metadata."""
        if not Web3.is_address(wallet_address):
            raise ValueError(f"Invalid Ethereum address: {wallet_address}")

        checksummed = Web3.to_checksum_address(wallet_address)
        profile = db.query(UserProfile).filter(UserProfile.wallet_address == checksummed).first()
        if not profile:
            profile = UserProfile(wallet_address=checksummed)
            db.add(profile)

        if display_name is not None:
            profile.display_name = display_name
        if bio is not None:
            profile.bio = bio
        profile.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(profile)

        return LoanService.get_or_create_user_profile(db, checksummed)

    @staticmethod
    def get_admin_statistics(db: Session) -> Dict[str, Any]:
        """Aggregate protocol health and volume metrics."""
        is_node_up = blockchain_service.is_connected()
        chain_id = blockchain_service.get_chain_id() if is_node_up else None
        contract_addr = blockchain_service.get_contract_address()
        contract_deployed = blockchain_service.is_contract_deployed() if is_node_up else False

        # Gather loans from on-chain if live, else from SQLite
        loans = LoanService.get_all_loans(db)

        total_loans = len(loans)
        open_loans = sum(1 for l in loans if l["status"] == "OPEN")
        active_loans = sum(1 for l in loans if l["status"] == "ACTIVE")
        completed_loans = sum(1 for l in loans if l["status"] == "COMPLETED")
        defaulted_loans = sum(1 for l in loans if l["status"] == "DEFAULTED")
        total_volume_eth = sum(l["principal_eth"] for l in loans)
        total_repaid_eth = sum(l["total_repaid_eth"] for l in loans)

        return {
            "total_loans": total_loans,
            "open_loans": open_loans,
            "active_loans": active_loans,
            "completed_loans": completed_loans,
            "defaulted_loans": defaulted_loans,
            "total_volume_eth": round(total_volume_eth, 4),
            "total_repaid_eth": round(total_repaid_eth, 4),
            "chain_id": chain_id,
            "node_connected": is_node_up,
            "contract_address": contract_addr,
            "contract_deployed": contract_deployed,
        }


loan_service = LoanService()
