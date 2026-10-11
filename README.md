# BlockLoan — Blockchain-Based Decentralized Peer-to-Peer Lending Platform

A college mini-project demonstrating a decentralized, non-custodial peer-to-peer (P2P) lending platform built on Ethereum smart contracts.

---

## 📌 Project Overview
Traditional credit and lending systems rely on centralized intermediaries (commercial banks, credit bureaus, loan brokers) which impose high transaction overheads, opaque underwriting criteria, geographic restrictions, and prolonged settlement latency. 

**BlockLoan** introduces a trust-minimized, transparent alternative:
- **Borrowers** submit on-chain loan proposals with custom principal, interest rates, and durations.
- **Lenders** inspect available loan proposals in an open marketplace and supply liquidity directly to borrowers.
- **Solidity Smart Contracts** autonomously enforce loan terms, compute simple interest, disburse repayments, and manage lifecycle states without any centralized escrow custodian.
- **FastAPI & Web3.py** index on-chain contract events and serve off-chain metadata, while **React, TypeScript & Tailwind CSS** deliver a modern decentralized finance dashboard.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Smart Contracts** | Solidity (`^0.8.20`), Hardhat, Ethers.js, Chai/Mocha |
| **Local Blockchain** | Hardhat Local EVM Network (`chainId: 31337`, `http://127.0.0.1:8545`) |
| **Frontend DApp** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **Web3 Client** | MetaMask Browser Extension, Ethers.js v6 |
| **Backend API & Indexer** | Python 3.14, FastAPI (`0.115+`), Web3.py (`v8`), Pydantic v2 |
| **Database** | SQLite, SQLAlchemy 2.0 |

---

## 📚 Complete Project Documentation Index

| Document | Description |
| :--- | :--- |
| **[`docs/project-report.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/project-report.md)** | **Formal College Project Report** covering all 17 academic sections for faculty evaluation. |
| **[`docs/demo-guide.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/demo-guide.md)** | **Live Demonstration Guide** with a 7-stage script, 2 negative tests, and screenshot checklist. |
| **[`docs/architecture.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/architecture.md)** | **System Architecture & Data Flow** featuring Mermaid diagrams, sequence flows, and trust boundaries. |
| **[`docs/smart-contract.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/smart-contract.md)** | **Smart Contract Specification** detailing functions, events, mathematical formulas, and security invariants. |
| **[`docs/api.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/api.md)** | **Backend REST API Specification** with endpoints, request/response models, and curl examples. |
| **[`docs/testing.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/testing.md)** | **Testing & Verification Report** documenting all 58 contract tests, 36 backend tests, and E2E results. |
| **[`docs/user-guide.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/user-guide.md)** | **End-User Guide** covering Borrower, Lender, and Protocol Administrator workflows. |
| **[`docs/limitations.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/limitations.md)** | **Architectural Limitations & Engineering Critique** analyzing push vs. pull payments, interest mechanics, and oracles. |
| **[`docs/local-network-setup.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/local-network-setup.md)** | **Local Network Setup** guide for Hardhat node and MetaMask manual network addition. |
| **[`docs/development-phases.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/development-phases.md)** | **Development Roadmap Breakdown** detailing Phases 1 through 8. |

---

## 📂 Project Directory Structure

```text
BlockLoan/
├── blockchain/               # Solidity contracts, Hardhat configuration, unit & negative tests
│   ├── contracts/            # Smart contracts (BlockLoan.sol)
│   ├── deployments/          # Exported deployment JSON artifacts (localhost.json)
│   ├── scripts/              # Deploy, seed demo, E2E integration, and audit scripts
│   ├── test/                 # Hardhat test suites (58 passing tests)
│   ├── hardhat.config.js     # Hardhat network & compiler configuration
│   ├── package.json          # Blockchain package dependencies
│   └── .env.example          # Safe environment template
├── backend/                  # Python FastAPI service and blockchain indexer
│   ├── app/
│   │   ├── api/              # REST routers (loans, repayments, users, admin)
│   │   ├── core/             # Configuration & Pydantic settings
│   │   ├── database/         # SQLite engine, models & session factory
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Web3.py read-only node client & loan services
│   │   └── main.py           # FastAPI application entrypoint
│   ├── deployments/          # Synchronized contract deployment metadata
│   ├── tests/                # Pytest test suite (36 passing tests)
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Safe environment template
├── frontend/                 # React + Vite + TypeScript DApp
│   ├── src/
│   │   ├── components/       # Reusable UI components (Navbar, Modal, StatCard, Badge)
│   │   ├── contracts/        # Contract addresses & ABIs (contractConfig.ts, BlockLoan.json)
│   │   ├── context/          # WalletContext & ToastContext
│   │   ├── types/            # TypeScript data definitions
│   │   ├── pages/            # 8 complete DApp views (Landing, Borrower, Lender, Marketplace, Admin)
│   │   ├── App.tsx           # Main application view & router
│   │   └── main.tsx          # React application root
│   ├── index.html            # HTML entry point
│   ├── vite.config.ts        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── package.json          # Frontend dependencies
│   └── .env.example          # Safe environment template
├── docs/                     # Comprehensive project documentation
│   ├── project-report.md     # 17-section formal academic college report
│   ├── demo-guide.md         # Live demonstration presentation script
│   ├── architecture.md       # Full architecture and sequence dataflow diagram
│   ├── smart-contract.md     # Smart contract lifecycle and function specifications
│   ├── api.md                # FastAPI REST API documentation
│   ├── testing.md            # Comprehensive test results report
│   ├── user-guide.md         # Step-by-step user walkthrough
│   ├── limitations.md        # Architectural critique and security limitations
│   ├── local-network-setup.md# Local Hardhat & MetaMask network setup guide
│   └── development-phases.md # Incremental roadmap breakdown
├── .gitignore                # Root gitignore protecting secrets & build artifacts
├── .env.example              # Monorepo environment configuration template
├── package.json              # Monorepo task orchestration scripts
└── README.md                 # Project README
```

---

## 🔒 Security & Academic Integrity Standards

1. **True Smart Contract Custody**: All financial operations (borrowing, funding, interest accrual, repayment, and state changes) reside purely within Solidity smart contracts. SQLite and the backend are strictly read-only event indexers.
2. **Zero Custodial Keys**: No private keys or mnemonics are stored in the frontend, backend, or database. Every action is signed via the user's personal MetaMask extension.
3. **No PII on Blockchain**: Only pseudonymous Ethereum addresses (`0x...`), amounts, durations, basis point interest rates, and loan IDs are recorded on the public ledger.
4. **Test Cryptocurrency Only**: Operates strictly on a local Hardhat network (`chainId: 31337`) or public testnets. Real funds are never required or utilized.
5. **Role Separation**: Testing and demonstrations use two distinct MetaMask accounts:
   - **Account #1 (Borrower)**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - **Account #2 (Lender)**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

> [!CAUTION]
> The private keys provided for local development are public Hardhat test keys. NEVER use these keys on Ethereum Mainnet or any live network. Never deposit real money into them.

---

## 🚀 Setup & Local Execution Guide (Windows PowerShell)

### Prerequisites
- **Node.js** (v18+ or v20+ LTS)
- **Python** (v3.10 to v3.14)
- **MetaMask browser extension** installed

---

### Step 1: Start the Local Hardhat Node
Open **Terminal 1 (PowerShell)**:
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\blockchain"
npx hardhat node
```
*Keep this terminal running. It creates 20 pre-funded test accounts with 10,000 test ETH each on `http://127.0.0.1:8545` (Chain ID `31337`).*

---

### Step 2: Deploy Contract and Sync Artifacts
Open **Terminal 2 (PowerShell)**:
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\blockchain"

# Run automated smart contract tests
npx hardhat test

# Deploy BlockLoan to local node
npm run deploy:local
```
This automatically deploys `BlockLoan.sol` to `0x5FbDB2315678afecb367f032d93F642f64180aa3` and syncs the address and ABI to both `frontend/src/contracts/` and `backend/deployments/`.

---

### Step 3: Seed Realistic On-Chain Demo Loans
In **Terminal 2 (PowerShell)**:
```powershell
npm run seed:local
```
This executes real transactions on your local node creating:
- **Loan #1 (`OPEN`)**: 1.5 ETH, 8.5% APR &rarr; Ready for lender funding in the DApp.
- **Loan #2 (`ACTIVE`)**: 2.5 ETH, 10.0% APR &rarr; Funded by lender; ready for borrower repayment.
- **Loan #3 (`COMPLETED`)**: 0.5 ETH, 6.0% APR &rarr; Created, funded, and fully repaid with interest.

---

### Step 4: Run Verification Audit
In **Terminal 2 (PowerShell)**:
```powershell
npm run verify:local
```

---

### Step 5: Start Frontend DApp
Open **Terminal 3 (PowerShell)**:
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\frontend"
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

### Step 6: Start Backend API (FastAPI) & Run Tests
Open **Terminal 4 (PowerShell)**:
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\backend"

# Run backend tests
& .\venv\Scripts\python.exe -m pytest -v

# Start FastAPI server
& .\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`
- Node Diagnostics: `http://127.0.0.1:8000/api/blockchain/status`
- Platform Admin Stats: `http://127.0.0.1:8000/api/admin/statistics`

---

## 🧪 Comprehensive Automated Test Suites

Run all test suites across the monorepo:

```powershell
# 1. Smart Contract Test Suite (58 passing tests)
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\blockchain"
npx hardhat test

# 2. Multi-Wallet End-to-End Integration Test (7 stages passing)
npm run test:e2e

# 3. Backend Test Suite (36 passing tests)
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\backend"
& .\venv\Scripts\python.exe -m pytest -v

# 4. Frontend Production Build & Typecheck (0 errors)
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\frontend"
npm run build
```

---

## 🦊 MetaMask Configuration Guide

### 1. Add Network Manually in MetaMask
- **Network Name**: `Hardhat Localhost`
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`

### 2. Import Development Accounts
In MetaMask &rarr; **Add Account** &rarr; **Import Account**:
- **Borrower Key (Account #1)**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Lender Key (Account #2)**: `0x5de4111afa1a4b94908f83103eb294414ac2b7127ecb030c37d195c405102ca`

---

## 📄 License
This project is licensed under the MIT License.
