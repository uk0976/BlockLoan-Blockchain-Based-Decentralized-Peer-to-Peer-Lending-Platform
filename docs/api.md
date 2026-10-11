# BlockLoan — Backend REST API Specification

**Framework**: FastAPI (`0.115+`) & Pydantic v2  
**Web3 Client**: Web3.py v8  
**Database**: SQLite with SQLAlchemy 2.0  
**Base URL**: `http://127.0.0.1:8000`  
**Interactive Docs**: `http://127.0.0.1:8000/docs` (Swagger UI) & `http://127.0.0.1:8000/redoc` (ReDoc)

---

## 1. Architecture & Design Principles

The BlockLoan backend serves as a **read-only indexer and off-chain metadata layer**:
1. **Zero Custodial Keys**: The backend holds **NO** private keys. It never executes value-bearing transactions on behalf of users.
2. **On-Chain Truth**: Financial metrics (loan state, principal, due amount, repaid amount) are fetched directly from the deployed Solidity smart contract via Web3.py JSON-RPC calls.
3. **Off-Chain Complement**: User profiles (custom display names, bios) and descriptive loan metadata (proposals, purpose) are stored in SQLite to keep smart contract gas costs minimal.
4. **Resilient Fallback**: If the local blockchain RPC node is temporarily restarting, cached loan structures from SQLite are returned with status indicators.

---

## 2. Standard Error Response Format

All error responses adhere to standard HTTP status codes and return a JSON payload with a descriptive detail message:

```json
{
  "detail": "Loan with ID 999 does not exist on-chain or in cache",
  "type": "NotFoundError"
}
```

### Common HTTP Status Codes
| Status Code | Reason | Description |
| :---: | :--- | :--- |
| `200 OK` | Success | Request succeeded. |
| `400 Bad Request` | Validation Error | Invalid loan ID, malformed Ethereum address, or invalid transaction hash. |
| `404 Not Found` | Resource Missing | Specified loan ID, user profile, or transaction receipt does not exist. |
| `500 Internal Error` | Database/Internal | Unexpected error handled with generic message to prevent stack leakage. |
| `503 Service Unavailable` | RPC Offline | Hardhat local node is down or contract is undeployed at configured address. |

---

## 3. Endpoints Reference

### 3.1 Health & Diagnostics

#### `GET /api/health`
Verifies backend operational status, RPC node connectivity, and contract deployment.

- **Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/health"
  ```
- **Response** (`200 OK`):
  ```json
  {
    "status": "ok",
    "project": "BlockLoan",
    "blockchain_connected": true,
    "chain_id": 31337,
    "contract_deployed": true,
    "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "version": "0.1.0"
  }
  ```

---

#### `GET /api/blockchain/status`
Returns in-depth RPC diagnostics, current block number, network chain ID, and contract bytecode existence.

- **Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/blockchain/status"
  ```
- **Response** (`200 OK`):
  ```json
  {
    "connected": true,
    "rpc_url": "http://127.0.0.1:8545",
    "chain_id": 31337,
    "current_block": 18,
    "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "contract_deployed": true,
    "bytecode_size_bytes": 6248
  }
  ```

---

### 3.2 Loans

#### `GET /api/loans`
Retrieves all loans on the platform. Combines smart contract variables with SQLite metadata.

- **Query Parameters**:
  - `status` (*optional*, `string`): Filter by `OPEN`, `ACTIVE`, `COMPLETED`, `DEFAULTED`, or `CANCELLED`.
- **Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/loans?status=OPEN"
  ```
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": 1,
      "borrower": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "lender": "0x0000000000000000000000000000000000000000",
      "principal": "1.5",
      "interest_rate_bps": 850,
      "interest_rate_percent": 8.5,
      "duration_seconds": 2592000,
      "duration_days": 30.0,
      "created_at": 1775904800,
      "funded_at": null,
      "repayment_deadline": null,
      "total_due": "1.51047945205479452",
      "total_repaid": "0",
      "remaining_due": "1.51047945205479452",
      "status": "OPEN",
      "title": "Inventory Expansion Loan",
      "purpose": "Procure seasonal stock for retail expansion"
    }
  ]
  ```

---

#### `GET /api/loans/{loan_id}`
Retrieves detailed information and real-time on-chain parameters for a single loan.

- **Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/loans/1"
  ```
- **Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "borrower": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "lender": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "principal": "1.5",
    "interest_rate_bps": 850,
    "interest_rate_percent": 8.5,
    "duration_seconds": 2592000,
    "duration_days": 30.0,
    "created_at": 1775904800,
    "funded_at": 1775904900,
    "repayment_deadline": 1778496900,
    "total_due": "1.51047945205479452",
    "total_repaid": "1.51047945205479452",
    "remaining_due": "0",
    "status": "COMPLETED",
    "title": "Inventory Expansion Loan",
    "purpose": "Procure seasonal stock for retail expansion"
  }
  ```

---

#### `GET /api/loans/{loan_id}/status`
Lightweight query returning real-time status and remaining outstanding debt in wei and ETH.

- **Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/loans/1/status"
  ```
- **Response** (`200 OK`):
  ```json
  {
    "loan_id": 1,
    "status": "COMPLETED",
    "remaining_due_wei": 0,
    "remaining_due_eth": "0.0"
  }
  ```

---

#### `POST /api/loans/{loan_id}/metadata`
Saves or updates off-chain title and loan purpose description for a specific loan ID.

- **Request**:
  ```bash
  curl -X POST "http://127.0.0.1:8000/api/loans/1/metadata" \
       -H "Content-Type: application/json" \
       -d '{"title": "Peer Business Loan", "purpose": "Equipment upgrade"}'
  ```
- **Response** (`200 OK`):
  ```json
  {
    "loan_id": 1,
    "title": "Peer Business Loan",
    "purpose": "Equipment upgrade",
    "updated_at": "2026-10-11T16:14:06"
  }
  ```

---

### 3.3 Repayments & Transactions

#### `GET /api/repayments/{loan_id}`
Returns all confirmed `RepaymentMade` events parsed directly from smart contract event logs.

- **Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/repayments/4"
  ```
- **Response** (`200 OK`):
  ```json
  [
    {
      "loan_id": 4,
      "borrower": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "amount_paid_eth": "0.5",
      "remaining_due_eth": "0.506575342465753424",
      "block_number": 16,
      "transaction_hash": "0x6ae9e74f9d33462ddb7a27618bb74b42b7983c434061ac995769775301038d68"
    },
    {
      "loan_id": 4,
      "borrower": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "amount_paid_eth": "0.506575342465753424",
      "remaining_due_eth": "0.0",
      "block_number": 17,
      "transaction_hash": "0xc79d5f2f08ed4bacee91b1018d69e49e36f54a54acd7629658f49a12d64258f5"
    }
  ]
  ```

---

#### `GET /api/transactions/{tx_hash}`
Fetches transaction receipt and decodes emitted logs for any transaction hash.

- **Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/transactions/0x6ae9e74f9d33462ddb7a27618bb74b42b7983c434061ac995769775301038d68"
  ```
- **Response** (`200 OK`):
  ```json
  {
    "transaction_hash": "0x6ae9e74f9d33462ddb7a27618bb74b42b7983c434061ac995769775301038d68",
    "status": 1,
    "block_number": 16,
    "from_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "to_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "gas_used": 68412,
    "effective_gas_price": "1875000000"
  }
  ```

---

### 3.4 Users

#### `GET /api/users/{wallet_address}`
Retrieves off-chain profile and loans participation summary for an Ethereum address.

- **Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/users/0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  ```
- **Response** (`200 OK`):
  ```json
  {
    "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "display_name": "Alice Borrower",
    "bio": "Verified small-business borrower on BlockLoan testnet",
    "created_at": "2026-10-11T14:30:00",
    "total_borrowed_loans": 2,
    "total_funded_loans": 0
  }
  ```

---

#### `PUT /api/users/{wallet_address}`
Updates custom display name and bio for a connected wallet address.

- **Request**:
  ```bash
  curl -X PUT "http://127.0.0.1:8000/api/users/0x70997970C51812dc3A010C7d01b50e0d17dc79C8" \
       -H "Content-Type: application/json" \
       -d '{"display_name": "Alice Enterprise", "bio": "High-volume hardware importer"}'
  ```
- **Response** (`200 OK`):
  ```json
  {
    "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "display_name": "Alice Enterprise",
    "bio": "High-volume hardware importer",
    "created_at": "2026-10-11T14:30:00",
    "total_borrowed_loans": 2,
    "total_funded_loans": 0
  }
  ```

---

### 3.5 Admin & Protocol Diagnostics

#### `GET /api/admin/statistics`
Aggregates platform volume, loan counts by status, default rate, and repayment metrics.

- **Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/admin/statistics"
  ```
- **Response** (`200 OK`):
  ```json
  {
    "total_loans": 4,
    "open_loans": 0,
    "active_loans": 0,
    "completed_loans": 4,
    "defaulted_loans": 0,
    "cancelled_loans": 0,
    "total_volume_eth": "4.0",
    "total_repaid_volume_eth": "4.0263",
    "active_debt_eth": "0.0",
    "average_interest_rate_bps": 750,
    "repayment_rate_percent": 100.0
  }
  ```

---

#### `GET /api/admin/audit`
Returns system-wide diagnostics of the local node, chain ID, and contract bytecode.

- **Request**:
  ```bash
  curl -X GET "http://127.0.0.1:8000/api/admin/audit"
  ```
- **Response** (`200 OK`):
  ```json
  {
    "connected": true,
    "rpc_url": "http://127.0.0.1:8545",
    "chain_id": 31337,
    "current_block": 18,
    "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "contract_deployed": true,
    "bytecode_size_bytes": 6248
  }
  ```
