from web3 import Web3
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))

    def is_connected(self) -> bool:
        """Check if local blockchain RPC is reachable."""
        try:
            return self.w3.is_connected()
        except Exception as e:
            logger.warning(f"Unable to connect to blockchain RPC: {e}")
            return False

    def get_latest_block_number(self) -> int:
        """Get latest block number from connected node."""
        if self.is_connected():
            return self.w3.eth.block_number
        return 0


blockchain_service = BlockchainService()
