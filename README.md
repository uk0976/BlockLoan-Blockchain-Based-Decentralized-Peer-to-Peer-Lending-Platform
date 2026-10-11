# BlockLoan — Blockchain-Based Decentralized Peer-to-Peer Lending Platform

A college mini-project demonstrating a decentralized, non-custodial peer-to-peer (P2P) lending platform built on Ethereum smart contracts.

---

## 📌 Project Overview
Traditional credit and lending systems rely on centralized intermediaries (commercial banks, credit bureaus, brokers) which impose high overheads, lengthy approval delays, and opacity. 

**BlockLoan** introduces a trust-minimized alternative:
- **Borrowers** create transparent loan requests and lock testnet cryptocurrency collateral into an autonomous smart contract escrow.
- **Lenders** inspect available loan proposals, analyze collateral ratios and yields, and fund loans directly.
- **Solidity Smart Contracts** autonomously enforce loan terms, compute interest, disburse repayments, and liquidate collateral upon default without any central intermediary.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Smart Contracts** | Solidity (`0.8.20`), Hardhat, Ethers.js, Chai/Mocha |
| **Local Blockchain** | Hardhat Local Ethereum Network (`chainId: 31337`) |
| **Frontend DApp** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **Web3 Client** | MetaMask, Ethers.js v6 |
| **Backend API & Indexer** | Python 3, FastAPI, Web3.py, Pydantic v2 |
| **Database** | SQLite, SQLAlchemy 2.0 |

---

## 📂 Project Directory Structure

```text
BlockLoan/
├── blockchain/               # Solidity contracts, Hardhat configuration, unit tests
│   ├── contracts/            # Smart contracts (BlockLoan.sol)
│   ├── scripts/              # Deployment and verification scripts
│   ├── test/                 # Hardhat unit tests
│   ├── hardhat.config.js     # Hardhat network & compiler configuration
│   ├── package.json          # Blockchain package dependencies
│   └── .env.example          # Safe environment template
├── backend/                  # Python FastAPI service and blockchain indexer
│   ├── app/
│   │   ├── core/             # Configuration & Pydantic settings
│   │   ├── database/         # SQLite engine, models & session factory
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Web3.py read-only node client
│   │   └── main.py           # FastAPI application entrypoint
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Safe environment template
├── frontend/                 # React + Vite + TypeScript DApp
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contracts/        # Contract addresses & ABIs
│   │   ├── types/            # TypeScript data definitions
│   │   ├── App.tsx           # Main application view & portals
│   │   └── main.tsx          # React application root
│   ├── index.html            # HTML entry point
│   ├── vite.config.ts        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── package.json          # Frontend dependencies
│   └── .env.example          # Safe environment template
├── docs/                     # Architectural & specification documents
│   ├── architecture.md       # Full architecture and dataflow diagram
│   ├── smart-contracts-spec.md# Smart contract lifecycle and function specifications
│   └── development-phases.md # Incremental roadmap breakdown
├── .gitignore                # Root gitignore protecting secrets & build artifacts
├── .env.example              # Monorepo environment configuration template
├── package.json              # Monorepo task orchestration scripts
└── README.md                 # Project documentation
```

---

## 🔒 Security & Academic Integrity Standards

1. **True Smart Contract Custody**: All financial operations (collateral deposit, funding, interest accrual, repayment, and liquidation) reside purely within Solidity smart contracts. SQLite and the backend are purely read-only event indexers.
2. **Zero Custodial Keys**: No private keys or mnemonics are stored in the frontend, backend, or database. Every action is signed via the user's personal MetaMask extension.
3. **Privacy & Identity**: No Personally Identifiable Information (PII) such as real names, emails, or KYC documents are written to the blockchain. Only pseudonymous Ethereum addresses are used.
4. **Test Cryptocurrency Only**: Operates strictly on a local Hardhat network or public testnets (e.g. Sepolia). Real funds are never required or utilized.
5. **Role Separation**: Testing is conducted with two distinct MetaMask accounts:
   - **Account A (Borrower)**: Requests loans and deposits collateral.
   - **Account B (Lender)**: Inspects and funds loans.

---

## 🚀 Setup & Local Execution Guide

### Prerequisites
- Node.js (v18+ or v20+)
- Python (v3.10+)
- MetaMask browser extension installed

---

### Step 1: Blockchain Layer (Hardhat)
Open Terminal 1:
```bash
# Navigate to blockchain directory
cd blockchain

# Install dependencies
npm install

# Run smart contract tests
npx hardhat test

# Start the local Hardhat Ethereum node (leave this terminal open)
npx hardhat node
```
*Note: Hardhat provides 20 pre-funded test accounts with 10,000 test ETH each.*

---

### Step 2: Deploy Smart Contract
Open Terminal 2:
```bash
cd blockchain

# Deploy BlockLoan to local node
npx hardhat run scripts/deploy.js --network localhost
```
*Take note of the deployed contract address output in the terminal.*

---

### Step 3: Backend API Layer (FastAPI)
Open Terminal 3:
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
API Documentation will be accessible at: `http://127.0.0.1:8000/docs`

---

### Step 4: Frontend DApp (React + Vite)
Open Terminal 4:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 📅 Development Phases
- **Phase 1 (Complete)**: Architecture design, monorepo skeleton, environment templates, initial contract data structures, and documentation.
- **Phase 2 (Upcoming)**: Complete Solidity contract implementation (collateral locks, loan funding, repayments, default liquidation) and comprehensive Hardhat unit tests.
- **Phase 3**: Web3.py backend indexing service, SQLite sync, and REST query endpoints.
- **Phase 4**: React borrower and lender dashboards, MetaMask wallet connection, transaction notification flow.
- **Phase 5**: End-to-end multi-account verification, demo scenarios, and project submission report.

---

## 📄 License
This project is licensed under the MIT License.
