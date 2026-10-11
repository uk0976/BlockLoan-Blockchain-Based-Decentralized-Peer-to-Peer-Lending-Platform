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
---

## Phase 6: Full Integration (Frontend + Smart Contract + MetaMask + FastAPI Backend)
- [x] Configure frontend API client (`apiService.ts`) with configurable base URL (`VITE_BACKEND_API_URL`).
- [x] Integrate frontend pages with FastAPI loan-reading, status, and metadata synchronization endpoints.
- [x] Enforce contract reads as the single source of truth for all financial amounts and states; reconcile metadata from backend without fake mock fallbacks.
- [x] Implement instant UI state refresh (balances, loans, events) upon confirmed on-chain transactions.
- [x] Strict wallet-based filtering for Borrower and Lender dashboards with actionable empty states.
- [x] Connect Admin Dashboard to live FastAPI telemetries (`/api/admin/statistics`, `/api/blockchain/status`) and on-chain contract audits.
- [x] Prevent duplicate submissions during pending transactions and catch user rejections (`ACTION_REJECTED`) and custom Solidity errors cleanly.
- [x] Run complete automated two-wallet end-to-end integration test (`e2ePhase6Integration.js`) covering loan creation, peer funding, partial and full repayments, loan completion, persistent state reload, and backend reconciliation.
- [x] Verify 100% test pass rate across frontend build (`tsc -b && vite build`), smart contract tests (29 tests), and backend test suite (26 tests).

---

## Phase 7: Security Review, Negative Testing & Bug Fixing
- [x] Conduct rigorous smart contract audit on `BlockLoan.sol`: duplicate funding prevention, non-payable direct transfer reverts, balance invariant ($0$ held outside transactions), bounds checking, unauthorized repayment prevention, and deadline timelocks.
- [x] Create comprehensive contract security test suite (`SecurityNegative.test.js`) bringing test count from 29 to 58 passing tests.
- [x] Harden FastAPI backend with exception handlers for `RuntimeError` and `SQLAlchemyError` to mask internal SQL schemas and database traces.
- [x] Add backend security test suite (`test_security_negative.py`) testing SQL injection, XSS parameterization, negative/zero IDs, malformed addresses/tx hashes, CORS enforcement, and sensitive data leakage checks (36 passing tests).
- [x] Harden frontend wallet handling (`WalletContext.tsx` and `contractService.ts`) to immediately catch wallet disconnections, network failures, nonce conflicts, and MetaMask signature rejections (`ACTION_REJECTED`).
- [x] Document non-custodial pull-payment vs push-payment trade-offs and remaining prototype constraints (disclaimer: educational mini-project, not formally audited for mainnet).



