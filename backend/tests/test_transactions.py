from unittest.mock import patch


def test_get_transaction_receipt_valid(client):
    """GET /api/transactions/{tx_hash} returns verified receipt and events."""
    tx_hash = "0x" + "b" * 64
    mock_receipt = {
        "tx_hash": tx_hash,
        "status": 1,
        "status_text": "Confirmed",
        "block_number": 105,
        "from_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "to_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "gas_used": 65000,
        "events": [
            {
                "event": "LoanCreated",
                "args": {"loanId": 1, "principalAmount": 2500000000000000000},
            }
        ],
    }

    with patch("app.services.blockchain_service.blockchain_service.get_transaction_receipt", return_value=mock_receipt):
        response = client.get(f"/api/transactions/{tx_hash}")
        assert response.status_code == 200
        data = response.json()
        assert data["tx_hash"] == tx_hash
        assert data["status"] == 1
        assert data["status_text"] == "Confirmed"
        assert len(data["events"]) == 1


def test_get_transaction_receipt_invalid_hash(client):
    """Invalid hash format returns 400 Bad Request."""
    response = client.get("/api/transactions/0xinvalidhash")
    assert response.status_code == 400
    assert "Invalid transaction hash format" in response.json()["detail"]


def test_get_transaction_receipt_not_found(client):
    """Unknown transaction hash returns 404 Not Found."""
    tx_hash = "0x" + "c" * 64
    with patch("app.services.blockchain_service.blockchain_service.get_transaction_receipt", side_effect=LookupError("Receipt not found")):
        response = client.get(f"/api/transactions/{tx_hash}")
        assert response.status_code == 404
