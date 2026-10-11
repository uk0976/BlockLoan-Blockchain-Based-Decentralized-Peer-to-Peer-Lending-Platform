def test_get_user_profile_existing(client, seed_sample_data):
    """GET /api/users/{address} retrieves profile with loan counts."""
    address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    response = client.get(f"/api/users/{address}")
    assert response.status_code == 200
    data = response.json()
    assert data["wallet_address"] == address
    assert data["display_name"] == "Borrower One"
    assert data["borrowed_loans_count"] >= 1


def test_get_user_profile_invalid_address(client):
    """Invalid Ethereum address returns 400 Bad Request."""
    response = client.get("/api/users/notanaddress")
    assert response.status_code == 400
    assert "Invalid Ethereum wallet address" in response.json()["detail"]


def test_update_user_profile(client):
    """PUT /api/users/{address} updates display name and bio."""
    address = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    payload = {
        "display_name": "Lender Prime",
        "bio": "Yield fund manager and liquidity provider",
    }
    response = client.put(f"/api/users/{address}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["wallet_address"] == address
    assert data["display_name"] == "Lender Prime"
    assert data["bio"] == payload["bio"]
