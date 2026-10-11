from unittest.mock import patch


def test_admin_statistics(client, seed_sample_data):
    """GET /api/admin/statistics aggregates protocol metrics."""
    with patch("app.services.blockchain_service.blockchain_service.is_connected", return_value=True), \
         patch("app.services.blockchain_service.blockchain_service.get_chain_id", return_value=31337), \
         patch("app.services.blockchain_service.blockchain_service.get_contract_address", return_value="0x5FbDB2315678afecb367f032d93F642f64180aa3"), \
         patch("app.services.blockchain_service.blockchain_service.is_contract_deployed", return_value=True), \
         patch("app.services.blockchain_service.blockchain_service.get_loan_count", side_effect=ConnectionError("Fallback")):
        response = client.get("/api/admin/statistics")
        assert response.status_code == 200
        data = response.json()
        assert data["total_loans"] >= 1
        assert "total_volume_eth" in data
        assert "node_connected" in data
        assert "contract_address" in data


def test_admin_node_audit(client):
    """GET /api/admin/audit returns node diagnosis."""
    response = client.get("/api/admin/audit")
    assert response.status_code == 200
    data = response.json()
    assert "rpc_url" in data
    assert "connected" in data
    assert "is_correct_network" in data
