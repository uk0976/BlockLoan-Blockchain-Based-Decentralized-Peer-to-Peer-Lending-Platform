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
| **Local Blockchain** | Hardhat Local Ethereum Network (`chainId: 31337`, `http://127.0.0.1:8545`) |
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
│   ├── deployments/          # Exported deployment JSON artifacts (localhost.json)
│   ├── scripts/              # Deploy, seed demo, and verification scripts
│   ├── test/                 # Hardhat unit tests (23 passing tests)
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
│   ├── deployments/          # Synchronized contract deployment metadata
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Safe environment template
├── frontend/                 # React + Vite + TypeScript DApp
│   ├── src/
│   │   ├── components/       # Reusable UI components (Navbar, Modal, StatCard)
│   │   ├── contracts/        # Contract addresses & ABIs (contractConfig.ts, BlockLoan.json)
│   │   ├── context/          # WalletContext & ToastContext
│   │   ├── types/            # TypeScript data definitions
│   │   ├── pages/            # 8 complete DApp views
│   │   ├── App.tsx           # Main application view & router
│   │   └── main.tsx          # React application root
│   ├── index.html            # HTML entry point
│   ├── vite.config.ts        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── package.json          # Frontend dependencies
│   └── .env.example          # Safe environment template
├── docs/                     # Architectural & specification documents
│   ├── architecture.md       # Full architecture and dataflow diagram
│   ├── smart-contracts-spec.md# Smart contract lifecycle and function specifications
│   ├── local-network-setup.md# Local Hardhat & MetaMask network setup guide
│   └── development-phases.md # Incremental roadmap breakdown
├── .gitignore                # Root gitignore protecting secrets & build artifacts
├── .env.example              # Monorepo environment configuration template
├── package.json              # Monorepo task orchestration scripts
└── README.md                 # Project documentation
```

---

## 🔒 Security & Academic Integrity Standards

1. **True Smart Contract Custody**: All financial operations (borrowing, funding, interest accrual, repayment, and liquidation) reside purely within Solidity smart contracts. SQLite and the backend are purely read-only event indexers.
2. **Zero Custodial Keys**: No private keys or mnemonics are stored in the frontend, backend, or database. Every action is signed via the user's personal MetaMask extension.
3. **Privacy & Identity**: No Personally Identifiable Information (PII) such as real names, emails, or KYC documents are written to the blockchain. Only pseudonymous Ethereum addresses are used.
4. **Test Cryptocurrency Only**: Operates strictly on a local Hardhat network (`chainId: 31337`) or public testnets. Real funds are never required or utilized.
5. **Role Separation**: Testing is conducted with two distinct MetaMask accounts:
   - **Account #1 (Borrower)**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - **Account #2 (Lender)**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

> [!CAUTION]
> The private keys provided for local development are public Hardhat test keys. NEVER use these keys on Ethereum Mainnet or any live network. Never deposit real money into them.

---

## 🚀 Setup & Local Execution Guide (Windows PowerShell)

### Prerequisites
- Node.js (v18+ or v20+)
- Python (v3.10+)
- MetaMask browser extension installed

---

### Step 1: Start the Local Hardhat Node
Open **Terminal 1 (PowerShell)**:
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\blockchain"
npx hardhat node
```
*Keep this terminal running. It generates 20 pre-funded test accounts with 10,000 test ETH each on `http://127.0.0.1:8545` (Chain ID `31337`).*

---

### Step 2: Deploy Contract and Sync Artifacts
Open **Terminal 2 (PowerShell)**:
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\blockchain"

# Run automated tests
npx hardhat test

# Deploy BlockLoan to local node
npm run deploy:local
```
This automatically deploys `BlockLoan.sol` and syncs the address and ABI to both `frontend/src/contracts/` and `backend/deployments/`.

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
Audits:
- Node connectivity at `http://127.0.0.1:8545`
- Chain ID (`31337`)
- Contract runtime bytecode existence
- Mathematical calculation functions
- Test accounts and balances

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

# Run pytest test suite
& .\venv\Scripts\python.exe -m pytest -v

# Start FastAPI server
& .\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```
- Interactive API Swagger UI: `http://127.0.0.1:8000/docs`
- Health & Connectivity Check: `http://127.0.0.1:8000/api/health`
- Node Diagnostics: `http://127.0.0.1:8000/api/blockchain/status`
- Platform Admin Stats: `http://127.0.0.1:8000/api/admin/statistics`

---

## 🦊 MetaMask Configuration Guide

### 1. Add Network Manually in MetaMask
- **Network Name**: `Hardhat Localhost`
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`

### 2. Import Development Accounts
In MetaMask &rarr; **Add Account** &rarr; **Import Account**:
- **Borrower Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Lender Key**: `0x5de4111afa1a4b94908f83103eb294414ac2b7127ecb030c37d195c405102ca`

*Detailed instructions and troubleshooting are available in [`docs/local-network-setup.md`](file:///c:/Users/Umer%20Khan/OneDrive/Desktop/BT%20Mini%20Project/docs/local-network-setup.md).*

---

## 📅 Development Phases
- **Phase 1 (Complete)**: Complete React frontend UI and design system across 8 DApp pages.
- **Phase 2 (Complete)**: Secure Solidity smart contract (`BlockLoan.sol`) with 23 passing unit tests.
- **Phase 3 (Complete)**: Local blockchain deployment pipeline, MetaMask configuration, demo seeding, and verification audit.
- **Phase 4 (Complete)**: Full frontend-to-contract Web3 integration with Ethers.js v6 & MetaMask (real on-chain loan creation, peer funding, partial/full repayment, and event log querying).
- **Phase 5 (Complete)**: Python FastAPI backend with Web3.py v8, SQLite persistence, and 26 test suite cases.
- **Phase 6 (Complete)**: Full end-to-end integration across React frontend, Solidity smart contracts, MetaMask wallet, and FastAPI Web3.py backend with automated two-wallet lifecycle tests.

### Run Automated End-to-End Integration Test
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\blockchain"
npm run test:e2e
```


---

## 📄 License
This project is licensed under the MIT License.
