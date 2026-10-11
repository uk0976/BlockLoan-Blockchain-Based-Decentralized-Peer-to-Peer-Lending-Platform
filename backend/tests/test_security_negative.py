import pytest
from unittest.mock import patch
from starlette.testclient import TestClient
from sqlalchemy.exc import OperationalError


def test_invalid_loan_id_negative(client: TestClient):
    """Negative loan IDs should be cleanly rejected with HTTP 400."""
    response = client.get("/api/loans/-5")
    assert response.status_code == 400
    assert "positive integer" in response.json()["detail"]


def test_invalid_loan_id_zero(client: TestClient):
    """Zero loan ID should be rejected with HTTP 400."""
    response = client.get("/api/loans/0")
    assert response.status_code == 400
    assert "positive integer" in response.json()["detail"]


def test_invalid_address_format(client: TestClient):
    """Invalid Ethereum address format should return HTTP 400."""
    response = client.get("/api/users/not-an-eth-address")
    assert response.status_code == 400
    assert "Invalid Ethereum" in response.json()["detail"]


def test_invalid_tx_hash_format(client: TestClient):
    """Invalid transaction hash should return HTTP 400."""
    response = client.get("/api/transactions/0x1234short")
    assert response.status_code == 400
    assert "Invalid transaction hash format" in response.json()["detail"]


def test_sql_injection_attempt_in_metadata(client: TestClient):
    """
    SQL injection attempt in loan title/purpose must be parameterized safely
    by SQLAlchemy without leaking SQL syntax or executing arbitrary queries.
    """
    sql_injection_payload = {
        "title": "'; DROP TABLE cached_loans; --",
        "purpose": "' UNION SELECT * FROM user_profiles; --",
        "collateral_description": "Normal collateral",
    }
    # Create or set metadata
    response = client.post("/api/loans/10/metadata", json=sql_injection_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "'; DROP TABLE cached_loans; --"
    assert data["purpose"] == "' UNION SELECT * FROM user_profiles; --"

    # Query again to verify table still exists and data was parameterized
    read_res = client.get("/api/loans/10")
    assert read_res.status_code in (200, 404)


def test_xss_payload_in_user_profile(client: TestClient):
    """XSS payloads must be stored as literal text and not executed."""
    valid_address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    xss_payload = {
        "display_name": "<script>alert('xss')</script>",
        "bio": "<img src=x onerror=alert(1)>",
    }
    response = client.put(f"/api/users/{valid_address}", json=xss_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["display_name"] == "<script>alert('xss')</script>"
    assert data["bio"] == "<img src=x onerror=alert(1)>"


def test_cors_authorized_origin(client: TestClient):
    """CORS should grant access to authorized frontend origins (localhost:5173)."""
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_unauthorized_origin(client: TestClient):
    """CORS should deny or not reflect unauthorized origins."""
    headers = {
        "Origin": "http://malicious-attacker-domain.com",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/health", headers=headers)
    allow_origin = response.headers.get("access-control-allow-origin")
    assert allow_origin != "http://malicious-attacker-domain.com"


def test_no_sensitive_private_key_leakage(client: TestClient):
    """Ensure no endpoint inadvertently exposes private keys, mnemonics, or secrets."""
    endpoints = [
        "/api/health",
        "/api/blockchain/status",
        "/api/admin/statistics",
        "/api/admin/audit",
    ]
    sensitive_keywords = ["private_key", "secret", "mnemonic", "password"]

    for ep in endpoints:
        response = client.get(ep)
        body_text = response.text.lower()
        for kw in sensitive_keywords:
            assert kw not in body_text, f"Potential sensitive leak of '{kw}' in {ep}"


def test_database_error_handler_masking(client: TestClient):
    """Database errors should be handled with HTTP 500 without leaking SQL traces."""
    with patch("app.services.loan_service.loan_service.get_admin_statistics") as mock_stats:
        mock_stats.side_effect = OperationalError("SELECT * FROM secret", params={}, orig=Exception("disk error"))
        response = client.get("/api/admin/statistics")
        assert response.status_code == 500
        data = response.json()
        assert data["type"] == "DatabaseError"
        assert "SELECT" not in data["detail"]
