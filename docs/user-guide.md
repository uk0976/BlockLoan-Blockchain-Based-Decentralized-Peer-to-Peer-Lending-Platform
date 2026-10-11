# BlockLoan — End-User & Demonstration Guide

**Project**: BlockLoan — Decentralized Peer-to-Peer Lending Platform  
**Target Audience**: Students, Evaluators, Borrowers, Lenders, and Protocol Administrators  
**Interface**: React + Vite DApp (`http://localhost:5173`)

---

## 1. Prerequisites & Initial Configuration

Before interacting with the platform, ensure the following components are running on your workstation:
1. **Hardhat Local Ethereum Node** on port `8545` (`http://127.0.0.1:8545`, Chain ID `31337`).
2. **FastAPI Backend Server** on port `8000` (`http://127.0.0.1:8000`).
3. **React Frontend DApp** on port `5173` (`http://localhost:5173`).
4. **MetaMask Browser Extension** installed in Chrome, Brave, Edge, or Firefox.

---

## 2. MetaMask Network & Account Setup

### Step 2.1: Add the Hardhat Localhost Network
1. Click the MetaMask extension icon.
2. Click the network selector in the top-left corner and click **Add Network** &rarr; **Add a network manually**.
3. Fill in the network configuration:
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
4. Click **Save** and switch to `Hardhat Localhost`.

> [!TIP]
> If MetaMask displays an error stating *"Could not fetch chain ID"* or shows a red warning, ensure the local node terminal is actively running.

---

### Step 2.2: Import Development Test Accounts

To demonstrate peer-to-peer interactions, import two separate test accounts:

1. Click the account avatar at the top of MetaMask &rarr; **Add account or hardware wallet** &rarr; **Import account**.
2. Select **Private Key** and paste the key:

#### Account #1 (Designated Borrower):
- **Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Public Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Rename in MetaMask**: `BlockLoan Borrower`

#### Account #2 (Designated Lender):
- **Private Key**: `0x5de4111afa1a4b94908f83103eb294414ac2b7127ecb030c37d195c405102ca`
- **Public Address**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Rename in MetaMask**: `BlockLoan Lender`

> [!CAUTION]
> These keys are public Hardhat development keys that come preloaded with 10,000 local test ETH. **NEVER transfer real Ethereum, tokens, or funds to these addresses.**

---

## 3. Borrower Workflow Walkthrough

### 3.1 Connecting Wallet & Creating a Loan Request
1. Open [`http://localhost:5173`](http://localhost:5173) in your browser.
2. Select **Account #1 (Borrower)** in MetaMask.
3. Click the **Connect Wallet** button in the top navigation bar. Confirm the connection prompt in MetaMask.
4. Click **Create Loan** or navigate to [`/borrower/create`](http://localhost:5173/borrower/create).
5. Enter your desired loan parameters:
   - **Loan Title**: e.g., `Inventory Procurement Loan`
   - **Purpose**: e.g., `Purchasing seasonal stock for retail store`
   - **Principal Amount (ETH)**: e.g., `1.5`
   - **Annual Interest Rate (APR %)**: e.g., `8.5`
   - **Tenure (Days)**: e.g., `30`
6. The UI dynamically computes:
   - Estimated Interest: `0.010479 ETH`
   - Total Repayment Obligation: `1.510479 ETH`
7. Click **Submit Loan Request**. MetaMask will display a transaction confirmation popup calling `createLoan`.
8. Click **Confirm**. Upon block inclusion, a toast notification displays:
   *"Loan #X created successfully on-chain! Transaction confirmed."*
9. The proposal is automatically indexed in the marketplace.

---

### 3.2 Monitoring Loans & Servicing Debt
1. Navigate to **Borrower Dashboard** ([`/borrower`](http://localhost:5173/borrower)).
2. Overview cards summarize:
   - **Total Borrowed**: Cumulative principal received.
   - **Total Repaid**: Sum of settlements returned to lenders.
   - **Active Loans**: Count of funded loans currently accruing interest.
3. Once a peer lender funds your loan, its badge changes from `OPEN` to `ACTIVE`, and the due date timer starts.
4. To make a payment, click **Repay Loan**:
   - Choose **Partial Repayment** (e.g., `0.5 ETH`) or **Full Settlement**.
   - Click **Submit Repayment** and confirm the transaction in MetaMask.
5. Funds are pushed directly from your wallet to the lender. Once the balance reaches `0`, the status transitions to `COMPLETED`.

---

## 4. Lender Workflow Walkthrough

### 4.1 Browsing Marketplace & Funding Loans
1. Switch your active MetaMask account to **Account #2 (Lender)**.
2. Navigate to the **Marketplace** ([`/marketplace`](http://localhost:5173/marketplace)).
3. Filter by **Open Requests**.
4. Click on a loan card to inspect:
   - Borrower's public address
   - Requested principal (e.g., `1.5 ETH`)
   - Proposed APR yield (e.g., `8.5%`)
   - Duration and total payout at maturity (`1.510479 ETH`)
5. Click **Fund Loan**. MetaMask will prompt you to send exactly `1.5 ETH` to `fundLoan(loanId)`.
6. Confirm the transaction. Upon confirmation:
   - Your wallet transfers `1.5 ETH` directly to the borrower's address.
   - The contract records you as the exclusive lender and locks the repayment deadline.

---

### 4.2 Tracking Portfolio in Lender Dashboard
1. Navigate to **Lender Dashboard** ([`/lender`](http://localhost:5173/lender)).
2. Cards display:
   - **Total Capital Deployed**: Total ETH invested in active loans.
   - **Accrued / Expected Yield**: Calculated interest earnings.
   - **Settled Loans**: History of fully paid investments.
3. As the borrower submits repayments, ETH flows directly into your wallet with zero claiming fees.

---

## 5. Protocol Admin & Auditor Workflow

### 5.1 System Statistics
1. Navigate to **Admin Dashboard** ([`/admin`](http://localhost:5173/admin)).
2. Real-time aggregated statistics display:
   - **Total Loans Created**
   - **Volume Deployed (ETH)**
   - **Total Repaid Volume (ETH)**
   - **Active vs. Completed Ratio**
   - **Default Rate (%)**

### 5.2 Network & Node Diagnostics
1. Scroll down to the **System Health & RPC Diagnostics** panel.
2. Inspect:
   - **RPC Node Status**: `Connected` (`http://127.0.0.1:8545`)
   - **Chain ID**: `31337`
   - **Contract Deployment State**: `Verified Bytecode (0x5FbDB2315678afecb367f032d93F642f64180aa3)`
   - **Indexer Health**: FastAPI SQLite sync status.

---

## 6. Troubleshooting Common Issues

### Issue 1: "Nonce too high" or Transaction Rejection in MetaMask
- **Cause**: Restarting the local Hardhat node resets the blockchain's block and transaction counters, causing MetaMask's cached nonce to be out of sync.
- **Solution**:
  1. In MetaMask, click the top right three dots &rarr; **Settings** &rarr; **Advanced**.
  2. Click **Clear activity and nonce data** (or **Reset Account**).
  3. This resets MetaMask's transaction history without deleting keys or funds.

### Issue 2: "Wrong Network" Warning Banner in DApp
- **Cause**: MetaMask is connected to Ethereum Mainnet, Goerli, or Sepolia instead of `Hardhat Localhost`.
- **Solution**: Click the **Switch Network** button in the DApp banner, or change the network to `Hardhat Localhost` in MetaMask.

### Issue 3: "Borrower Cannot Fund Own Loan" Reversion
- **Cause**: Trying to fund a loan created by your currently selected account.
- **Solution**: Switch MetaMask to Account #2 (Lender) before clicking **Fund Loan**.
