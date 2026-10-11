import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List
from web3 import Web3
from web3.contract import Contract
from app.core.config import settings

logger = logging.getLogger(__name__)


def map_loan_status(status_code: int) -> str:
    """Map Solidity LoanStatus enum index to standard string."""
    mapping = {
        0: "OPEN",
        1: "ACTIVE",
        2: "COMPLETED",
        3: "DEFAULTED",
        4: "CANCELLED",
    }
    return mapping.get(status_code, "UNKNOWN")


class BlockchainService:
    def __init__(self, rpc_url: Optional[str] = None):
        self.rpc_url = rpc_url or settings.BLOCKCHAIN_RPC_URL
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self._contract_address: Optional[str] = settings.BLOCKLOAN_CONTRACT_ADDRESS or None
        self._contract_abi: Optional[list] = None
        self._load_deployment_artifact()

    def _load_deployment_artifact(self) -> None:
        """Attempt to load deployment metadata and ABI from disk if not configured in environment."""
        search_paths = [
            Path(__file__).resolve().parent.parent.parent / "deployments" / "localhost.json",
            Path(__file__).resolve().parent.parent.parent.parent / "blockchain" / "deployments" / "localhost.json",
            Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "src" / "contracts" / "BlockLoan.json",
        ]

        for p in search_paths:
            if p.exists():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if not self._contract_address and "contractAddress" in data:
                            self._contract_address = data["contractAddress"]
                        if not self._contract_abi:
                            self._contract_abi = data.get("abi")
                        if self._contract_address and self._contract_abi:
                            logger.info(f"Loaded contract deployment artifact from: {p}")
                            break
                except Exception as e:
                    logger.warning(f"Failed reading deployment artifact at {p}: {e}")

    # =========================================================================
    # CONNECTIVITY & HEALTH
    # =========================================================================

    def is_connected(self) -> bool:
        """Check if local blockchain RPC is reachable."""
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def get_chain_id(self) -> Optional[int]:
        """Fetch chain ID from connected RPC."""
        if not self.is_connected():
            return None
        try:
            return self.w3.eth.chain_id
        except Exception:
            return None

    def get_latest_block_number(self) -> int:
        """Get latest block number from connected node."""
        if not self.is_connected():
            return 0
        try:
            return self.w3.eth.block_number
        except Exception:
            return 0

    def get_contract_address(self) -> Optional[str]:
        if not self._contract_address:
            self._load_deployment_artifact()
        return self._contract_address

    def is_contract_deployed(self) -> bool:
        """Verify that runtime bytecode exists at the configured contract address on-chain."""
        addr = self.get_contract_address()
        if not addr or not self.is_connected():
            return False
        try:
            checksummed = Web3.to_checksum_address(addr)
            code = self.w3.eth.get_code(checksummed)
            return len(code) > 0 and code != b"" and code != b"\x00"
        except Exception:
            return False

    def get_contract(self) -> Contract:
        """
        Return web3.eth.contract instance with descriptive, actionable exceptions
        for unavailable nodes, chain mismatches, and undeployed contracts.
        """
        if not self.is_connected():
            raise ConnectionError(
                f"Blockchain node is offline at {self.rpc_url}. "
                f"Please start the local Hardhat node using 'npx hardhat node'."
            )

        current_chain = self.get_chain_id()
        if current_chain is not None and settings.EXPECTED_CHAIN_ID and current_chain != settings.EXPECTED_CHAIN_ID:
            raise ValueError(
                f"Chain ID mismatch: Node returned chain {current_chain}, "
                f"expected {settings.EXPECTED_CHAIN_ID} (Hardhat localhost)."
            )

        addr = self.get_contract_address()
        if not addr:
            raise ValueError(
                "BlockLoan contract address is not configured. "
                "Please run deployment: 'npx hardhat run scripts/deploy.js --network localhost'."
            )

        if not Web3.is_address(addr):
            raise ValueError(f"Invalid Ethereum contract address format: '{addr}'")

        if not self.is_contract_deployed():
            raise RuntimeError(
                f"No contract bytecode found at {addr} on local node (Chain ID: {current_chain}). "
                f"Did you restart the node? Please run 'npm run deploy:local' to redeploy the contract."
            )

        if not self._contract_abi:
            self._load_deployment_artifact()
            if not self._contract_abi:
                raise ValueError("Smart contract ABI is missing. Please compile with 'npx hardhat compile'.")

        checksummed = Web3.to_checksum_address(addr)
        return self.w3.eth.contract(address=checksummed, abi=self._contract_abi)

    # =========================================================================
    # CONTRACT READ OPERATIONS
    # =========================================================================

    def get_loan_count(self) -> int:
        """Query total loan count on-chain."""
        contract = self.get_contract()
        return contract.functions.getLoanCount().call()

    def get_loan(self, loan_id: int) -> Dict[str, Any]:
        """
        Retrieve complete loan struct directly from the smart contract.
        Computes accurate ETH conversions, APR percentages, and remaining balance due.
        """
        if loan_id < 1:
            raise ValueError(f"Loan ID must be a positive integer, received {loan_id}")

        contract = self.get_contract()
        total_count = contract.functions.getLoanCount().call()

        if loan_id > total_count:
            raise LookupError(f"Loan #{loan_id} does not exist on-chain. Total loans: {total_count}")

        raw = contract.functions.getLoan(loan_id).call()

        # Unpack raw tuple/struct
        # struct: (id, borrower, lender, principalAmount, interestRateBps, durationSeconds, createdAt, fundedAt, repaymentDeadline, totalDue, totalRepaid, status)
        l_id = raw[0]
        borrower = raw[1]
        lender = raw[2] if raw[2] != "0x0000000000000000000000000000000000000000" else None
        principal_wei = raw[3]
        interest_rate_bps = raw[4]
        duration_seconds = raw[5]
        created_at_ts = raw[6]
        funded_at_ts = raw[7]
        repayment_deadline_ts = raw[8]
        total_due_wei = raw[9]
        total_repaid_wei = raw[10]
        status_num = raw[11]

        status_str = map_loan_status(status_num)

        # Query remaining balance due if loan is active
        remaining_due_eth = 0.0
        if status_str == "ACTIVE":
            try:
                rem_wei = contract.functions.getRepaymentAmount(loan_id).call()
                remaining_due_eth = float(self.w3.from_wei(rem_wei, "ether"))
            except Exception:
                remaining_due_eth = max(0.0, float(self.w3.from_wei(total_due_wei - total_repaid_wei, "ether")))
        elif status_str == "DEFAULTED":
            remaining_due_eth = max(0.0, float(self.w3.from_wei(total_due_wei - total_repaid_wei, "ether")))

        principal_eth = float(self.w3.from_wei(principal_wei, "ether"))
        total_due_eth = float(self.w3.from_wei(total_due_wei, "ether"))
        total_repaid_eth = float(self.w3.from_wei(total_repaid_wei, "ether"))
        duration_days = max(1, round(duration_seconds / 86400))

        return {
            "id": l_id,
            "borrower": borrower,
            "lender": lender,
            "principal_eth": principal_eth,
            "principal_wei": str(principal_wei),
            "interest_rate_bps": interest_rate_bps,
            "apr_percent": interest_rate_bps / 100.0,
            "duration_days": duration_days,
            "duration_seconds": duration_seconds,
            "status": status_str,
            "status_code": status_num,
            "created_at": datetime.fromtimestamp(created_at_ts, tz=timezone.utc) if created_at_ts > 0 else None,
            "funded_at": datetime.fromtimestamp(funded_at_ts, tz=timezone.utc) if funded_at_ts > 0 else None,
            "repayment_deadline": datetime.fromtimestamp(repayment_deadline_ts, tz=timezone.utc) if repayment_deadline_ts > 0 else None,
            "total_due_eth": total_due_eth,
            "total_repaid_eth": total_repaid_eth,
            "remaining_due_eth": remaining_due_eth,
            "is_on_chain": True,
            "source": "on_chain_verified",
        }

    def get_loan_status(self, loan_id: int) -> Dict[str, Any]:
        """Fetch lightweight status assessment for a specific loan."""
        loan_data = self.get_loan(loan_id)
        status = loan_data["status"]
        return {
            "loan_id": loan_id,
            "status": status,
            "is_open": status == "OPEN",
            "is_active": status == "ACTIVE",
            "is_completed": status == "COMPLETED",
            "is_defaulted": status == "DEFAULTED",
            "repayment_deadline": loan_data["repayment_deadline"],
            "remaining_due_eth": loan_data["remaining_due_eth"],
        }

    # =========================================================================
    # CONTRACT EVENTS & RECEIPTS
    # =========================================================================

    def get_loan_repayments(self, loan_id: int) -> List[Dict[str, Any]]:
        """
        Query verified RepaymentMade and LoanCompleted event logs for a specific loan.
        """
        if loan_id < 1:
            raise ValueError(f"Loan ID must be positive: {loan_id}")

        contract = self.get_contract()
        repayments: List[Dict[str, Any]] = []

        try:
            # Query RepaymentMade event logs
            repay_filter = contract.events.RepaymentMade.get_logs(from_block=0)
            for event in repay_filter:
                args = event.get("args", {})
                if args.get("loanId") == loan_id:
                    repayments.append({
                        "loan_id": loan_id,
                        "amount_paid_eth": float(self.w3.from_wei(args.get("amountPaid", 0), "ether")),
                        "remaining_due_eth": float(self.w3.from_wei(args.get("remainingDue", 0), "ether")),
                        "borrower_address": args.get("borrower", ""),
                        "tx_hash": event.get("transactionHash").hex() if hasattr(event.get("transactionHash"), "hex") else str(event.get("transactionHash")),
                        "block_number": event.get("blockNumber", 0),
                        "timestamp": datetime.utcnow(),
                    })
        except Exception as e:
            logger.warning(f"Failed querying RepaymentMade event logs: {e}")

        return repayments

    def get_transaction_receipt(self, tx_hash: str) -> Dict[str, Any]:
        """
        Look up verified transaction receipt and decode any BlockLoan contract events.
        """
        if not tx_hash.startswith("0x") or len(tx_hash) != 66:
            raise ValueError(f"Invalid transaction hash format. Expected 0x + 64 hex characters: '{tx_hash}'")

        if not self.is_connected():
            raise ConnectionError(f"Cannot lookup transaction receipt: node is offline at {self.rpc_url}")

        try:
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
        except Exception as e:
            raise LookupError(f"Transaction receipt not found for hash: {tx_hash}. Error: {e}")

        status = receipt.get("status", 0)
        status_text = "Confirmed" if status == 1 else "Reverted"
        block_num = receipt.get("blockNumber", 0)
        from_addr = receipt.get("from", "")
        to_addr = receipt.get("to")
        gas_used = receipt.get("gasUsed", 0)

        # Parse contract events if contract is deployed
        parsed_events: List[Dict[str, Any]] = []
        try:
            contract = self.get_contract()
            event_classes = [
                contract.events.LoanCreated,
                contract.events.LoanFunded,
                contract.events.RepaymentMade,
                contract.events.LoanCompleted,
                contract.events.LoanDefaulted,
                contract.events.LoanCancelled,
            ]
            for evt_cls in event_classes:
                try:
                    processed = evt_cls().process_receipt(receipt)
                    for p in processed:
                        parsed_events.append({
                            "event": p.get("event"),
                            "args": {
                                k: (v.hex() if hasattr(v, "hex") else v)
                                for k, v in p.get("args", {}).items()
                            },
                        })
                except Exception:
                    pass
        except Exception:
            pass

        return {
            "tx_hash": tx_hash,
            "status": status,
            "status_text": status_text,
            "block_number": block_num,
            "from_address": from_addr,
            "to_address": to_addr,
            "gas_used": gas_used,
            "events": parsed_events,
        }

    def get_status_overview(self) -> Dict[str, Any]:
        """Health diagnostics of local node, chain ID, and contract."""
        connected = self.is_connected()
        chain_id = self.get_chain_id() if connected else None
        contract_deployed = self.is_contract_deployed() if connected else False

        return {
            "rpc_url": self.rpc_url,
            "connected": connected,
            "chain_id": chain_id,
            "is_correct_network": chain_id == settings.EXPECTED_CHAIN_ID,
            "latest_block": self.get_latest_block_number() if connected else 0,
            "contract_address": self.get_contract_address(),
            "contract_deployed": contract_deployed,
        }


blockchain_service = BlockchainService()
