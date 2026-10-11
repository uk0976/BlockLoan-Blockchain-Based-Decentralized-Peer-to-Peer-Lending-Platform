# BlockLoan — System Architecture & Data Flow

**Document**: System Architecture Specification  
**System Name**: BlockLoan Decentralized P2P Lending Platform  
**Target Environment**: Hardhat Local Network (`31337`) / Ethereum Sepolia Testnet  

---

## 1. Architectural Overview & System Topology

BlockLoan is architected as a **non-custodial decentralized financial application (DApp)**. The system decouples financial consensus and transaction execution from off-chain presentation and indexing:

1. **Decentralized Settlement Layer (Solidity on EVM)**:
   The ultimate source of truth for all loan states, balances, interest accrual, and funds routing.
2. **Client Presentation Layer (React + Vite + Tailwind)**:
   A responsive, client-side Web3 dashboard connecting directly to the user's browser-injected Ethereum provider (MetaMask via Ethers.js v6).
3. **Indexer & Application Service Layer (FastAPI + Web3.py)**:
   A read-only backend that listens for blockchain events, caches loan states in SQLite, and provides high-speed queries, system health diagnostics, and off-chain descriptive metadata without requiring private keys.

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Browser)"]
        BW["Borrower Web UI\n(React / Vite)"]
        LW["Lender Web UI\n(React / Vite)"]
        MM["MetaMask Extension\n(Ethers.js v6 Client-Side Signer)"]
        BW --> MM
        LW --> MM
    end

    subgraph BlockchainLayer ["Blockchain Settlement Layer (EVM)"]
        SC["BlockLoan.sol Smart Contract\n(Hardhat Local Node :8545)\nAddress: 0x5FbDB2315678afecb367f032d93F642f64180aa3"]
        EV["Event Logs:\nLoanCreated, LoanFunded,\nRepaymentMade, LoanCompleted"]
        SC --> EV
    end

    subgraph BackendLayer ["Backend Indexer & API Layer (:8000)"]
        FA["FastAPI Application Server"]
        W3["Web3.py Event Poller & RPC Client"]
        SQL[("SQLite Database\n(Off-chain Metadata & Cache)")]
        FA <--> SQL
        W3 --> SQL
    end

    %% Client Interactions
    MM -- "eth_sendTransaction\n(Signed via User Private Key)" --> SC
    MM -- "eth_call (Read Operations)" --> SC
    BW -- "REST API Queries (Cached Lists & Metadata)" --> FA
    LW -- "REST API Queries" --> FA

    %% Backend Blockchain Read
    W3 -- "JSON-RPC (eth_getLogs, eth_call)" --> SC
```

---

## 2. Core Protocol Sequence Diagrams

### 2.1 Loan Request Creation Flow
The borrower initiates a loan request. The transaction is signed locally by MetaMask and broadcasted to the EVM. The backend indexes the event and stores the user-provided title/purpose in SQLite.

```mermaid
sequenceDiagram
    autonumber
    actor Borrower as Borrower (Wallet #1)
    participant UI as React Frontend
    participant MM as MetaMask Signer
    participant EVM as BlockLoan.sol
    participant API as FastAPI Backend
    participant DB as SQLite Database

    Borrower->>UI: Fills Loan Proposal (1.5 ETH, 8.5% APR, 30 days)
    UI->>MM: Request transaction signature for createLoan()
    MM->>Borrower: Prompt Approval Modal
    Borrower->>MM: Confirm & Sign
    MM->>EVM: Broadcast createLoan(1500000000000000000, 850, 2592000)
    EVM->>EVM: Validate bounds & increment loanCounter
    EVM-->>MM: Emit LoanCreated(loanId=1) & Tx Receipt
    MM-->>UI: Return transaction hash & confirmed receipt
    UI->>API: POST /api/loans/1/metadata (Title, Purpose)
    API->>DB: INSERT into loan_metadata
    API-->>UI: Metadata saved
    UI-->>Borrower: Display Success Toast & redirect to Marketplace
```

---

### 2.2 Peer Funding Flow
A lender inspects open proposals in the marketplace, selects a loan, and supplies the exact principal in test ETH. The smart contract immediately transfers the principal to the borrower's address and activates the loan.

```mermaid
sequenceDiagram
    autonumber
    actor Lender as Lender (Wallet #2)
    participant UI as React Frontend
    participant MM as MetaMask Signer
    participant EVM as BlockLoan.sol
    actor Borrower as Borrower (Wallet #1)
    participant W3 as Web3.py Indexer
    participant DB as SQLite Database

    Lender->>UI: Select Loan #1 in Marketplace & Click "Fund Loan"
    UI->>MM: Request fundLoan(1) with msg.value = 1.5 ETH
    MM->>Lender: Prompt Approval Modal (Value: 1.5 ETH + gas)
    Lender->>MM: Confirm & Sign
    MM->>EVM: Broadcast fundLoan(1) {value: 1.5 ETH}
    EVM->>EVM: Assert status == OPEN & caller != borrower
    EVM->>EVM: Calculate totalDue (1.510479 ETH) & set dueDate
    EVM->>Borrower: Low-level transfer 1.5 ETH directly to borrower
    EVM->>EVM: Update status = ACTIVE, lender = Wallet #2
    EVM-->>MM: Emit LoanFunded(loanId=1) & Receipt
    MM-->>UI: Confirmed receipt
    UI-->>Lender: Display Active Investment in Dashboard
    W3->>EVM: Poll for LoanFunded events
    W3->>DB: UPDATE loan_cache SET status='ACTIVE', lender=Wallet2
```

---

### 2.3 Repayment & Settlement Flow
The borrower services their debt by calling `repayLoan`. Funds are forwarded directly to the lender. When total repayments equal total due, the loan status transitions to `COMPLETED`.

```mermaid
sequenceDiagram
    autonumber
    actor Borrower as Borrower (Wallet #1)
    participant UI as React Frontend
    participant MM as MetaMask Signer
    participant EVM as BlockLoan.sol
    actor Lender as Lender (Wallet #2)

    Borrower->>UI: Selects Active Loan #1 & inputs Repayment (0.5 ETH)
    UI->>MM: Request repayLoan(1) with msg.value = 0.5 ETH
    MM->>Borrower: Prompt Approval Modal (0.5 ETH + gas)
    Borrower->>MM: Confirm & Sign
    MM->>EVM: Broadcast repayLoan(1) {value: 0.5 ETH}
    EVM->>EVM: Assert status == ACTIVE & caller == borrower
    EVM->>EVM: Assert payment <= remainingDue & deadline not expired
    EVM->>EVM: Update totalRepaid += 0.5 ETH
    EVM->>Lender: Low-level transfer 0.5 ETH directly to lender
    EVM-->>MM: Emit RepaymentMade(remainingDue = 1.010479 ETH)
    MM-->>UI: Receipt confirmed
    UI-->>Borrower: Update Outstanding Balance Display
```

---

## 3. Trust Boundaries & Security Model

| Boundary | Interaction | Trust Level | Security Enforcement |
| :--- | :--- | :---: | :--- |
| **User &rarr; MetaMask** | Key storage and signing | **Zero Trust** | Private keys are locked inside user's local browser extension; never transmitted over network. |
| **MetaMask &rarr; EVM** | Value-bearing transactions | **Algorithmic Trust** | Enforced by EVM opcodes and smart contract code (`nonReentrant`, explicit reverts). |
| **Frontend &rarr; Backend** | Read queries & metadata | **Low Trust** | Backend is read-only; compromised backend cannot steal user funds or alter blockchain state. |
| **Backend &rarr; EVM** | Web3.py RPC indexer | **Read-Only** | Uses read-only calls (`eth_getLogs`, `eth_call`). Backend holds zero private keys. |
| **Backend &rarr; Database** | SQLite persistence | **Local Enclave** | Parameterized queries with SQLAlchemy ORM; generic error handlers prevent SQL injection and schema leakage. |

---

## 4. Data Layer Architecture

### 4.1 On-Chain Data Model (`BlockLoan.sol`)
Stores state variables required for financial execution:
- `id`: Sequential `uint256`
- `borrower`: `address payable`
- `lender`: `address payable`
- `principalAmount`: `uint256` (wei)
- `interestRateBps`: `uint256` (basis points)
- `durationSeconds`: `uint256` (seconds)
- `createdAt`: `uint256` (timestamp)
- `fundedAt`: `uint256` (timestamp)
- `repaymentDeadline`: `uint256` (timestamp)
- `totalDue`: `uint256` (wei)
- `totalRepaid`: `uint256` (wei)
- `status`: `enum LoanStatus { OPEN, ACTIVE, COMPLETED, DEFAULTED, CANCELLED }`

### 4.2 Off-Chain Database Model (`backend/app/database/models.py`)
- **`LoanMetadata`**:
  - `loan_id` (`Integer`, Primary Key)
  - `title` (`String(120)`)
  - `purpose` (`Text`)
  - `created_at` (`DateTime`)
  - `updated_at` (`DateTime`)
- **`UserProfile`**:
  - `wallet_address` (`String(42)`, Primary Key, checksummed)
  - `display_name` (`String(60)`)
  - `bio` (`Text`)
  - `created_at` (`DateTime`)
- **`LoanCache`**:
  - Mirrored copy of on-chain fields to accelerate marketplace queries when node is under heavy load.
