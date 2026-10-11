from unittest.mock import patch


def test_health_check_endpoint(client):
    """Verify GET /api/health returns 200 with required structure."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["project"] == "BlockLoan"
    assert "blockchain_connected" in data
    assert "version" in data


def test_health_check_node_online_mock(client):
    """Test health response when node is connected."""
    with patch("app.services.blockchain_service.blockchain_service.is_connected", return_value=True), \
         patch("app.services.blockchain_service.blockchain_service.get_chain_id", return_value=31337), \
         patch("app.services.blockchain_service.blockchain_service.is_contract_deployed", return_value=True):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["blockchain_connected"] is True
        assert data["chain_id"] == 31337
        assert data["contract_deployed"] is True


def test_blockchain_status_overview(client):
    """Verify GET /api/blockchain/status returns diagnostic metrics."""
    response = client.get("/api/blockchain/status")
    assert response.status_code == 200
    data = response.json()
    assert "rpc_url" in data
    assert "connected" in data
    assert "chain_id" in data
    assert "is_correct_network" in data
    assert "contract_address" in data
