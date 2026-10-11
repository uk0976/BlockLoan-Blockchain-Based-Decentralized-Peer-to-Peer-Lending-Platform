# BlockLoan — System Architecture

## 1. Overview
**BlockLoan** is a decentralized peer-to-peer (P2P) lending platform engineered as a college mini-project. It removes centralized banking and loan-brokering intermediaries by orchestrating non-custodial crypto loan agreements directly through Ethereum-compatible smart contracts.

---

## 2. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|                                                                                   |
|    +-----------------------------+               +----------------------------+   |
|    |      Borrower Web UI        |               |      Lender Web UI         |   |
|    | (React + Vite + TypeScript) |               | (React + Vite + TypeScript)|   |
|    +--------------+--------------+               +-------------+--------------+   |
|                   |                                            |                  |
|                   +----------------------+---------------------+                  |
|                                          |                                        |
|                          MetaMask Wallet Client (Ethers.js v6)                    |
|                         (Signs transactions client-side)                          |
+------------------------------------------+----------------------------------------+
                                           |
                                           | JSON-RPC (eth_sendTransaction / eth_call)
                                           v
+-----------------------------------------------------------------------------------+
|                             BLOCKCHAIN LAYER                                      |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                        BlockLoan.sol (Hardhat Node)                       |   |
|   |                                                                           |   |
|   |   - Loan Request & Collateral Escrow                                      |   |
|   |   - Peer Funding & Disbursement                                           |   |
|   |   - Repayment & Interest Accrual Math                                     |   |
|   |   - Default Detection & Collateral Liquidation                            |   |
|   |   - Emits Events: LoanRequested, LoanFunded, LoanRepaid, LoanLiquidated   |   |
|   +-------------------------------------+-------------------------------------+   |
+-----------------------------------------|-----------------------------------------+
                                          |
                                          | Contract Events & Filter Polling
                                          v
+-----------------------------------------------------------------------------------+
|                              BACKEND & INDEXER LAYER                              |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                   FastAPI Service + Web3.py Indexer                       |   |
|   |                                                                           |   |
|   |   - Read-only Web3 event polling                                          |   |
|   |   - Off-chain metadata & fast read queries                                |   |
|   |   - Pydantic payload validation                                           |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |                           SQLite Database                                 |   |
|   |   (Cached loan state, historical event records, transaction hashes)       |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Core Principles & Security Constraints

1. **Non-Custodial Financial Settlement**:
   All financial balances (collateral deposits, loan disbursements, repayments, interest calculations) are held and computed solely inside the `BlockLoan.sol` Solidity contract. The backend database and React UI cannot modify or hold funds.

2. **Zero Custodial Keys**:
   Private keys are never stored on the server, backend, frontend storage, or database. Every transaction is prompted directly to the user's MetaMask extension.

3. **No PII on Blockchain**:
   Only pseudonymous Ethereum addresses (`0x...`), amounts, durations, basis point interest rates, and loan IDs are recorded on the public ledger. No real names, emails, or identity files are written to the blockchain.

4. **Test Cryptography Only**:
   The system runs on the local Hardhat Ethereum node (Chain ID 31337) and testnets. Real funds are never involved.
