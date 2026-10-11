# BlockLoan — College Demonstration Guide & Presentation Script

**Document**: Live Demonstration Protocol & Presentation Walkthrough  
**Project**: BlockLoan — Decentralized Peer-to-Peer Lending Platform  
**Target Duration**: 8 to 12 minutes  
**Target Audience**: Academic Project Evaluators, Professors, and Peer Reviewers

---

## 1. Demonstration Overview & Setup Checklist

Before beginning your live evaluation demonstration, verify that the following terminal windows are open and active:

| Terminal | Process | Command | Status Indicator |
| :---: | :--- | :--- | :--- |
| **Terminal 1** | Local Hardhat EVM Node | `npx hardhat node` | Port `8545` active (`Chain ID: 31337`) |
| **Terminal 2** | FastAPI Backend Server | `uvicorn app.main:app --reload --port 8000` | Port `8000` active (`Docs at /docs`) |
| **Terminal 3** | React Web Application | `npm run dev` | Port `5173` active (`http://localhost:5173`) |
| **Browser** | Chrome / Brave / Edge | MetaMask Extension | Accounts #1 and #2 imported |

### Verified Test Accounts in MetaMask
- **Account #1 (Borrower)**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Account #2 (Lender)**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

---

## 2. Seven-Stage Live Demonstration Script

### Stage 1: Platform Introduction & System Health Audit (1 Minute)
1. Open the landing page at [`http://localhost:5173`](http://localhost:5173).
2. **Presenter Talking Point**:
   > *"Good morning professors and evaluators. Today we present BlockLoan, a decentralized, non-custodial peer-to-peer lending platform. BlockLoan replaces commercial bank intermediaries and predatory loan underwriting with transparent, immutable Ethereum smart contracts."*
3. Highlight the hero statistics ribbon (Protocol Volume, Custody Model: 100% Non-Custodial, Fixed APR).
4. Navigate to [`/admin`](http://localhost:5173/admin) to demonstrate real-time node diagnostics:
   - Point out **RPC Node Status**: `Connected` (`http://127.0.0.1:8545`).
   - Point out **Smart Contract**: Deployed at `0x5FbDB2315678afecb367f032d93F642f64180aa3`.

---

### Stage 2: Connecting Borrower Wallet & Creating a Loan Request (2 Minutes)
1. In MetaMask, select **Account #1 (Borrower)**.
2. Click **Connect Wallet** in the top navigation bar. Point out that the button updates to show the shortened address `0x7099...79C8` and current test ETH balance.
3. Click **Create Loan Request** or navigate to [`/borrower/create`](http://localhost:5173/borrower/create).
4. Fill in the loan application form:
   - **Loan Title**: `Inventory Expansion Loan`
   - **Purpose**: `Procuring seasonal retail inventory`
   - **Principal Amount**: `1.0 ETH`
   - **Annual Interest Rate**: `8.0%`
   - **Tenure**: `30 Days`
5. Show how the dynamic calculation widget computes the estimated interest (`0.006575 ETH`) and total debt obligation (`1.006575 ETH`).
6. Click **Submit Loan Request**. MetaMask opens a signing modal calling `createLoan()`.
7. Click **Confirm**. Show the live block inclusion toast notification:
   *"Loan #X created successfully on-chain! Transaction confirmed."*

---

### Stage 3: Negative Test Demonstration #1 — Borrower Self-Funding Rejection (1.5 Minutes)
1. **Presenter Talking Point**:
   > *"In peer-to-peer lending, a critical economic threat is wash trading—where a borrower attempts to fund their own loan to artificially inflate credit reputation or manipulate platform metrics. Our smart contract strictly forbids this on the EVM level."*
2. Navigate to the **Marketplace** ([`/marketplace`](http://localhost:5173/marketplace)).
3. With **Account #1 (Borrower)** still selected in MetaMask, click on the newly created loan proposal.
4. Attempt to click **Fund Loan**.
5. The UI/Contract detects that `msg.sender == loan.borrower` and reverts with custom error `BorrowerCannotFund()`.
6. Show the evaluators that the platform safely catches this error and displays an alert:
   *"Borrowers cannot fund their own loan requests."*

---

### Stage 4: Peer Funding by Lender Account #2 (2 Minutes)
1. Switch MetaMask active account to **Account #2 (Lender)** (`0x3C44...93BC`).
2. Refresh the Marketplace. Point out that the **Fund Loan** button is now active.
3. Show the current balances:
   - Borrower's balance prior to funding.
   - Lender's balance prior to funding.
4. Click **Fund Loan**. MetaMask prompts the lender to send exactly `1.0 ETH` to `fundLoan(loanId)`.
5. Click **Confirm**. Upon block inclusion:
   - The loan status transitions from `OPEN` to `ACTIVE`.
   - The borrower receives the 1.0 ETH principal into their wallet immediately.
   - The contract begins the countdown to the repayment deadline.
6. Navigate to **Lender Dashboard** ([`/lender`](http://localhost:5173/lender)) to view the active investment.

---

### Stage 5: Negative Test Demonstration #2 — Unauthorized Stranger Repayment Rejection (1.5 Minutes)
1. **Presenter Talking Point**:
   > *"Another critical security invariant is unauthorized debt tampering. Only the original borrower who entered the credit contract has the legal right to service that loan. Lenders or third-party strangers cannot execute debt adjustments."*
2. While still connected as **Account #2 (Lender)**, navigate to the borrower dashboard or attempt to execute a repayment on this loan.
3. The smart contract validates `msg.sender == loan.borrower` and rejects the transaction with custom error `OnlyBorrowerCanRepay()`.
4. Point out to the evaluators how access control is enforced in Solidity bytecode, not just hidden in the frontend UI.

---

### Stage 6: Debt Servicing (Partial & Full Repayment) (2 Minutes)
1. Switch MetaMask back to **Account #1 (Borrower)**.
2. Navigate to **Borrower Dashboard** ([`/borrower`](http://localhost:5173/borrower)).
3. Locate the active loan. Click **Repay Loan**:
   - Submit a partial repayment of `0.5 ETH`.
   - Confirm the transaction in MetaMask.
   - Point out that Lender Account #2 immediately received the `0.5 ETH`, and the remaining debt decreased to `0.506575 ETH`.
4. Click **Repay Full Balance** to settle the remaining `0.506575 ETH`.
5. Confirm in MetaMask. Upon transaction receipt:
   - The smart contract verifies `totalRepaid == totalDue`.
   - Emits `LoanCompleted` event.
   - Status badge updates to green `COMPLETED`.
   - Contract records `0 remaining due`.

---

### Stage 7: Admin Verification & Reconciliation (1 Minute)
1. Navigate to [`/admin`](http://localhost:5173/admin).
2. Show that the backend indexer automatically picked up the on-chain events:
   - **Completed Loans**: Count incremented.
   - **Total Repaid Volume**: Updated with accurate ETH and basis point yield.
   - **Active Debt**: Decreased to 0.
3. Open the FastAPI documentation at [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs) in a new tab:
   - Execute `GET /api/loans/{id}` to show the live reconciled JSON payload.
4. Conclude the demonstration:
   > *"This concludes our live demonstration of BlockLoan, proving successful decentralization, non-custodial settlement, and full smart contract integrity across all lifecycle states."*

---

## 3. Screenshot Capture Checklist for Project Dossier

Capture the following 8 screenshots during your demonstration rehearsal for inclusion in your college submission slides and report:

- [ ] **Screenshot 1: Landing Page**: Full view of hero section, status ribbon, and dark navy/teal aesthetic.
- [ ] **Screenshot 2: MetaMask Connection**: Truncated wallet address (`0x7099...`) and connected network badge (`Hardhat Localhost: 31337`).
- [ ] **Screenshot 3: Create Loan Proposal Modal**: Form with principal, 8% APR, 30-day tenure, and dynamic yield calculator.
- [ ] **Screenshot 4: Rejection Alert (Self-Funding)**: Negative test showing rejection modal when borrower tries to self-fund.
- [ ] **Screenshot 5: Marketplace Active Listing**: Loan card with `OPEN` badge ready for funding.
- [ ] **Screenshot 6: Lender Dashboard**: Capital deployed card and expected return calculations for Account #2.
- [ ] **Screenshot 7: Borrower Repayment & Settlement**: Confirmed modal showing final payment receipt and transition to `COMPLETED`.
- [ ] **Screenshot 8: Admin Statistics & Node Audit**: Protocol summary dashboard with 100% repayment rate and live RPC diagnostic panels.
