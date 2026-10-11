import pytest
from app.services.blockchain_service import blockchain_service


@pytest.mark.skipif(
    not blockchain_service.is_connected(),
    reason="Local Hardhat node is not running on 127.0.0.1:8545",
)
def test_live_node_integration():
    """Live integration test against running Hardhat node."""
    chain_id = blockchain_service.get_chain_id()
    assert chain_id == 31337

    is_deployed = blockchain_service.is_contract_deployed()
    assert is_deployed is True

    loan_count = blockchain_service.get_loan_count()
    assert isinstance(loan_count, int)
    assert loan_count >= 0
