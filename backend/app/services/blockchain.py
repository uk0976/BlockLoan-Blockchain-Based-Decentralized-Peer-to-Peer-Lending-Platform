import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from web3 import Web3
from web3.contract import Contract
from app.core.config import settings

logger = logging.getLogger(__name__)


class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        self._contract_address: Optional[str] = settings.BLOCKLOAN_CONTRACT_ADDRESS or None
        self._contract_abi: Optional[list] = None
        self._load_deployment_artifact()

    def _load_deployment_artifact(self) -> None:
        """Attempt to load deployment metadata and ABI from disk if not set in environment."""
        search_paths = [
            Path(__file__).resolve().parent.parent.parent / "deployments" / "localhost.json",
            Path(__file__).resolve().parent.parent.parent.parent / "blockchain" / "deployments" / "localhost.json",
        ]

        for p in search_paths:
            if p.exists():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if not self._contract_address:
                            self._contract_address = data.get("contractAddress")
                        self._contract_abi = data.get("abi")
                        logger.info(f"Loaded contract deployment artifact from: {p}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to read deployment artifact at {p}: {e}")

    def is_connected(self) -> bool:
        """Check if local blockchain RPC is reachable."""
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def get_chain_id(self) -> Optional[int]:
        """Fetch chain ID from connected RPC."""
        if self.is_connected():
            try:
                return self.w3.eth.chain_id
            except Exception:
                return None
        return None

    def get_latest_block_number(self) -> int:
        """Get latest block number from connected node."""
        if self.is_connected():
            try:
                return self.w3.eth.block_number
            except Exception:
                return 0
        return 0

    def get_contract_address(self) -> Optional[str]:
        if not self._contract_address:
            self._load_deployment_artifact()
        return self._contract_address

    def is_contract_deployed(self) -> bool:
        """Verify that bytecode exists at the configured contract address on-chain."""
        addr = self.get_contract_address()
        if not addr or not self.is_connected():
            return False
        try:
            checksummed = Web3.to_checksum_address(addr)
            code = self.w3.eth.get_code(checksummed)
            return len(code) > 0 and code != b"" and code != b"\x00"
        except Exception:
            return False

    def get_contract(self) -> Optional[Contract]:
        """
        Return web3.eth.contract instance with descriptive exception handling
        when node is offline or contract is undeployed.
        """
        if not self.is_connected():
            raise ConnectionError(
                f"Local blockchain node is offline at {settings.BLOCKCHAIN_RPC_URL}. "
                f"Please start the node using 'npx hardhat node'."
            )

        addr = self.get_contract_address()
        if not addr:
            raise ValueError(
                "Contract address is not configured. Please run deployment script: "
                "'npx hardhat run scripts/deploy.js --network localhost'."
            )

        if not self.is_contract_deployed():
            raise RuntimeError(
                f"No contract bytecode found at {addr} on local node (Chain ID: {self.get_chain_id()}). "
                f"Did you restart the node? Please redeploy the contract."
            )

        if not self._contract_abi:
            self._load_deployment_artifact()
            if not self._contract_abi:
                raise ValueError("Smart contract ABI not found. Run 'npx hardhat compile'.")

        checksummed = Web3.to_checksum_address(addr)
        return self.w3.eth.contract(address=checksummed, abi=self._contract_abi)

    def get_status_overview(self) -> Dict[str, Any]:
        """Detailed health and network diagnosis."""
        connected = self.is_connected()
        chain_id = self.get_chain_id() if connected else None
        contract_deployed = self.is_contract_deployed() if connected else False

        return {
            "rpc_url": settings.BLOCKCHAIN_RPC_URL,
            "connected": connected,
            "chain_id": chain_id,
            "is_correct_network": chain_id == 31337,
            "latest_block": self.get_latest_block_number() if connected else 0,
            "contract_address": self.get_contract_address(),
            "contract_deployed": contract_deployed,
        }


blockchain_service = BlockchainService()
