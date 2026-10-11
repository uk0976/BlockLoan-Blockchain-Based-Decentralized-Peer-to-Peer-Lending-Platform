# BlockLoan — Incremental Development Roadmap

## Phase 1: Skeleton & Environment Scaffolding (Current Phase)
- [x] Create project monorepo structure (`frontend`, `backend`, `blockchain`, `docs`).
- [x] Configure root and component `.gitignore` and `.env.example` templates.
- [x] Establish Hardhat smart contract configuration and contract data structure stubs.
- [x] Configure FastAPI backend structure with SQLite, SQLAlchemy, Web3.py, and Pydantic schemas.
- [x] Configure React + Vite + TypeScript + Tailwind CSS frontend boilerplate with ethers.js support.
- [x] Provide initial root documentation and push to GitHub repository.

---

## Phase 2: Solidity Smart Contract Implementation & Hardhat Testing
- [ ] Implement `requestLoan(principal, interestBps, duration)` with required collateral deposit.
- [ ] Implement `fundLoan(loanId)` with direct transfer of principal to borrower.
- [ ] Implement `repayLoan(loanId)` with interest calculation and collateral return.
- [ ] Implement `liquidateLoan(loanId)` enabling lender to seize collateral upon loan default.
- [ ] Implement `cancelLoan(loanId)` for unfunded loans.
- [ ] Add reentrancy guards and security checks (Checks-Effects-Interactions pattern).
- [ ] Write comprehensive unit tests in Hardhat covering 100% of state transitions and edge cases (underfunding, double repayments, late repayments).

---

## Phase 3: Backend Event Indexer & REST APIs
- [ ] Build background event listener service using Web3.py listening for `LoanRequested`, `LoanFunded`, `LoanRepaid`, and `LoanLiquidated`.
- [ ] Store synchronized loan records in SQLite via SQLAlchemy.
- [ ] Expose RESTful endpoints for querying active loans, borrower loans, lender loans, and platform statistics.

---

## Phase 4: Frontend Web3 Integration & UI Dashboards
- [ ] Implement MetaMask wallet connect button and network verification (Hardhat 31337).
- [ ] Build Borrower Dashboard: Loan request form with collateral estimation, active debt view, and one-click repayment.
- [ ] Build Lender Marketplace: Open loan explorer, risk/collateral analysis, funding modal, and liquidation actions.
- [ ] Real-time status notifications and transaction receipt modals.

---

## Phase 5: End-to-End Integration, Demonstration & Final Report
- [ ] End-to-end testing with two distinct MetaMask accounts (Borrower Account & Lender Account).
- [ ] Complete project report, presentation deck, and demonstration scripts.
