# BlockLoan — Incremental Development Roadmap

## Phase 1: Frontend UI & DApp Interface
- [x] Create project monorepo structure (`frontend`, `backend`, `blockchain`, `docs`).
- [x] Configure root and component `.gitignore` and `.env.example` templates.
- [x] Build dark navy / teal financial design system.
- [x] Build 8 complete responsive pages (Landing, Borrower, Lender, Marketplace, Create Loan, Details, Admin, Transactions).

---

## Phase 2: Solidity Smart Contract Implementation & Hardhat Testing
- [x] Implement `BlockLoan.sol` with `OPEN`, `ACTIVE`, `COMPLETED`, `DEFAULTED`, `CANCELLED` states.
- [x] Implement `createLoan()`, `fundLoan()`, `repayLoan()`, `markDefaulted()`, `cancelLoan()`.
- [x] Implement simple-interest mathematical calculations and custom errors.
- [x] Implement reentrancy protection (Checks-Effects-Interactions pattern).
- [x] Write 23 passing unit tests in Hardhat covering 100% of state transitions and edge cases.

---

## Phase 3: Local Blockchain Deployment Pipeline & MetaMask Configuration
- [x] Configure local Hardhat node (`chainId: 31337`, `http://127.0.0.1:8545`).
- [x] Create automated deployment script (`deploy.js`) exporting address and ABI to frontend and backend.
- [x] Create demo seeding script (`seedDemo.js`) and deployment verification audit (`verifyDeployment.js`).
- [x] Document MetaMask connection setup and test account importing in `docs/local-network-setup.md`.

---

## Phase 4: Frontend Web3 Contract Integration with Ethers.js & MetaMask
- [x] Implement live MetaMask wallet connect/disconnect with shortened address, balance display, and 1-click network switcher (`31337`).
- [x] Implement `CreateLoanPage` calling `createLoan()` on-chain with tx receipt confirmation and assigned ID parsing.
- [x] Implement `MarketplacePage` reading live loans on-chain and funding via `fundLoan()` with native test ETH.
- [x] Implement `BorrowerDashboardPage` showing real debt obligations and partial/full repayments via `repayLoan()`.
- [x] Implement `LenderDashboardPage` tracking funded investments and asserting defaults via `markDefaulted()`.
- [x] Implement `LoanDetailsPage` and `TransactionHistoryPage` querying live events via `queryFilter()`.
- [x] Test end-to-end two-wallet lifecycle (`Phase4Integration.test.js`) with 29 passing tests.
- [x] Verify production build (`npm run build`) compiles with zero errors.

---

## Phase 5: Backend REST API, Web3.py Service & SQLite Storage
- [x] Build modular FastAPI application with routers for `/api/loans`, `/api/repayments`, `/api/users`, `/api/admin`, and `/api/health`.
- [x] Implement `BlockchainService` via Web3.py v8 reading on-chain loans, contract counts, transaction receipts, and decoding contract events (`LoanCreated`, `LoanFunded`, `RepaymentMade`, `LoanCompleted`, `LoanDefaulted`, `LoanCancelled`).
- [x] Add robust node diagnostics with error detection for offline RPC, chain ID mismatch, and undeployed contract address.
- [x] Configure SQLite persistence via SQLAlchemy models (`CachedLoan`, `LoanMetadata`, `UserProfile`, `CachedEventLog`) without treating cached data as live blockchain state.
- [x] Implement Pydantic v2 schemas with Ethereum address and hash validators.
- [x] Maintain zero custodial private keys, strictly read-only node client, and CORS whitelist for frontend (`5173`).
- [x] Add comprehensive test suite in `backend/tests/` with 26 tests (25 passing, 1 live integration test for running node).


