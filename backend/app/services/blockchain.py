# Re-export from blockchain_service.py for backward compatibility
from app.services.blockchain_service import (
    BlockchainService,
    blockchain_service,
    map_loan_status,
)

__all__ = ["BlockchainService", "blockchain_service", "map_loan_status"]
