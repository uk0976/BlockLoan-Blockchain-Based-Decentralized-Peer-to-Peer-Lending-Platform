from unittest.mock import patch
from datetime import datetime, timezone


def test_list_loans_cached_fallback(client, seed_sample_data):
    """When node is offline, GET /api/loans returns cached loans with source='cached_offline'."""
    with patch("app.services.blockchain_service.blockchain_service.get_loan_count", side_effect=ConnectionError("Node offline")):
        response = client.get("/api/loans")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        loan = data[0]
        assert loan["id"] == 1
        assert loan["title"] == "Compute Server Expansion"
        assert loan["source"] == "cached_offline"
        assert loan["is_on_chain"] is False


def test_list_loans_on_chain(client, seed_sample_data):
    """When node is online, GET /api/loans returns verified on-chain data."""
    mock_loan = {
        "id": 1,
        "borrower": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "lender": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "principal_eth": 2.5,
        "principal_wei": "2500000000000000000",
        "interest_rate_bps": 950,
        "apr_percent": 9.5,
        "duration_days": 60,
        "duration_seconds": 5184000,
        "status": "ACTIVE",
        "status_code": 1,
        "created_at": datetime.now(timezone.utc),
        "funded_at": datetime.now(timezone.utc),
        "repayment_deadline": datetime.now(timezone.utc),
        "total_due_eth": 2.539,
        "total_repaid_eth": 1.0,
        "remaining_due_eth": 1.539,
        "is_on_chain": True,
        "source": "on_chain_verified",
    }

    with patch("app.services.blockchain_service.blockchain_service.get_loan_count", return_value=1), \
         patch("app.services.blockchain_service.blockchain_service.get_loan", return_value=mock_loan):
        response = client.get("/api/loans")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == 1
        assert data[0]["status"] == "ACTIVE"
        assert data[0]["title"] == "Compute Server Expansion"
        assert data[0]["is_on_chain"] is True


def test_get_loan_by_id_success(client, seed_sample_data):
    """GET /api/loans/{id} returns loan details with off-chain metadata."""
    mock_loan = {
        "id": 1,
        "borrower": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "lender": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "principal_eth": 2.5,
        "principal_wei": "2500000000000000000",
        "interest_rate_bps": 950,
        "apr_percent": 9.5,
        "duration_days": 60,
        "duration_seconds": 5184000,
        "status": "ACTIVE",
        "status_code": 1,
        "created_at": datetime.now(timezone.utc),
        "funded_at": None,
        "repayment_deadline": None,
        "total_due_eth": 2.539,
        "total_repaid_eth": 0.0,
        "remaining_due_eth": 2.539,
        "is_on_chain": True,
        "source": "on_chain_verified",
    }

    with patch("app.services.blockchain_service.blockchain_service.get_loan", return_value=mock_loan):
        response = client.get("/api/loans/1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["principal_eth"] == 2.5
        assert data["title"] == "Compute Server Expansion"


def test_get_loan_invalid_id(client):
    """GET /api/loans/{id} with zero or negative ID returns 400."""
    response = client.get("/api/loans/0")
    assert response.status_code == 400
    assert "positive integer" in response.json()["detail"]


def test_get_loan_not_found(client):
    """GET /api/loans/{id} with non-existent ID returns 404."""
    with patch("app.services.blockchain_service.blockchain_service.get_loan", side_effect=LookupError("Loan #999 not found")):
        response = client.get("/api/loans/999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


def test_get_loan_status(client):
    """GET /api/loans/{id}/status returns lightweight status."""
    mock_status = {
        "loan_id": 1,
        "status": "ACTIVE",
        "is_open": False,
        "is_active": True,
        "is_completed": False,
        "is_defaulted": False,
        "repayment_deadline": None,
        "remaining_due_eth": 1.5,
    }
    with patch("app.services.blockchain_service.blockchain_service.get_loan_status", return_value=mock_status):
        response = client.get("/api/loans/1/status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ACTIVE"
        assert data["is_active"] is True
        assert data["remaining_due_eth"] == 1.5


def test_set_and_get_loan_metadata(client):
    """POST /api/loans/{id}/metadata persists descriptive title and purpose in SQLite."""
    payload = {
        "title": "Decentralized Solar Rig",
        "purpose": "Rooftop photovoltaic arrays with lithium battery backup power.",
    }
    response = client.post("/api/loans/2/metadata", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["loan_id"] == 2
    assert data["title"] == "Decentralized Solar Rig"
    assert data["purpose"] == payload["purpose"]


def test_get_loan_repayments(client):
    """GET /api/loans/{id}/repayments returns confirmed repayment events."""
    mock_repayments = [
        {
            "loan_id": 1,
            "amount_paid_eth": 1.0,
            "remaining_due_eth": 1.539,
            "borrower_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            "tx_hash": "0x" + "a" * 64,
            "block_number": 42,
            "timestamp": datetime.now(timezone.utc),
        }
    ]
    with patch("app.services.blockchain_service.blockchain_service.get_loan_repayments", return_value=mock_repayments):
        response = client.get("/api/loans/1/repayments")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["amount_paid_eth"] == 1.0
        assert data[0]["block_number"] == 42
