import pytest
from unittest.mock import patch, MagicMock
from app.services.blockchain_service import BlockchainService, map_loan_status


def test_map_loan_status():
    """Verify mapping of Solidity enum indices to status strings."""
    assert map_loan_status(0) == "OPEN"
    assert map_loan_status(1) == "ACTIVE"
    assert map_loan_status(2) == "COMPLETED"
    assert map_loan_status(3) == "DEFAULTED"
    assert map_loan_status(4) == "CANCELLED"
    assert map_loan_status(99) == "UNKNOWN"


def test_blockchain_service_offline_error():
    """get_contract raises ConnectionError when RPC is unreachable."""
    service = BlockchainService(rpc_url="http://127.0.0.1:9999")
    with patch.object(service, "is_connected", return_value=False):
        with pytest.raises(ConnectionError) as excinfo:
            service.get_contract()
        assert "offline" in str(excinfo.value).lower()


def test_blockchain_service_chain_id_mismatch():
    """get_contract raises ValueError when connected to wrong network (e.g. Mainnet 1)."""
    service = BlockchainService()
    with patch.object(service, "is_connected", return_value=True), \
         patch.object(service, "get_chain_id", return_value=1):
        with pytest.raises(ValueError) as excinfo:
            service.get_contract()
        assert "Chain ID mismatch" in str(excinfo.value)


def test_blockchain_service_missing_address():
    """get_contract raises ValueError when contract address is missing."""
    service = BlockchainService()
    service._contract_address = None
    with patch.object(service, "is_connected", return_value=True), \
         patch.object(service, "get_chain_id", return_value=31337), \
         patch.object(service, "_load_deployment_artifact"):
        with pytest.raises(ValueError) as excinfo:
            service.get_contract()
        assert "not configured" in str(excinfo.value)


def test_blockchain_service_invalid_address():
    """get_contract raises ValueError when contract address is invalid."""
    service = BlockchainService()
    service._contract_address = "invalid_eth_address"
    with patch.object(service, "is_connected", return_value=True), \
         patch.object(service, "get_chain_id", return_value=31337):
        with pytest.raises(ValueError) as excinfo:
            service.get_contract()
        assert "Invalid Ethereum contract address" in str(excinfo.value)


def test_blockchain_service_undeployed_contract():
    """get_contract raises RuntimeError when contract has zero bytecode on-chain."""
    service = BlockchainService()
    service._contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    with patch.object(service, "is_connected", return_value=True), \
         patch.object(service, "get_chain_id", return_value=31337), \
         patch.object(service, "is_contract_deployed", return_value=False):
        with pytest.raises(RuntimeError) as excinfo:
            service.get_contract()
        assert "No contract bytecode found" in str(excinfo.value)
