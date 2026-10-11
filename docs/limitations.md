# BlockLoan — Architectural Limitations & Engineering Critique

**Scope**: Educational College Mini-Project Prototype  
**Audience**: Blockchain Engineers, System Architects, Faculty Reviewers  
**Author**: BlockLoan Core Team

---

## 1. Overview & Disclaimer

BlockLoan is engineered as an educational proof-of-concept for decentralized peer-to-peer micro-lending. It demonstrates the fundamental mechanics of smart contract debt instruments: atomic disbursement, mathematical interest accrual, role-based access control, and event logging.

However, moving a decentralized financial (DeFi) protocol to production or Ethereum Mainnet requires addressing significant financial, economic, and smart contract architectural limitations. This document provides an honest, critical examination of these design choices and architectural trade-offs.

---

## 2. Push vs. Pull Payment Architecture

### Current Implementation
BlockLoan employs a **direct push-payment model**:
- In `fundLoan(loanId)`, incoming ETH from the lender is immediately forwarded to the borrower via:
  ```solidity
  (bool sent, ) = loan.borrower.call{value: msg.value}("");
  if (!sent) revert TransferFailed();
  ```
- In `repayLoan(loanId)`, incoming repayment ETH is forwarded directly to the lender via:
  ```solidity
  (bool sent, ) = loan.lender.call{value: msg.value}("");
  if (!sent) revert TransferFailed();
  ```

### Trade-Offs & Limitations
1. **Denial-of-Service (DoS) with Unexpected Revert**:
   - If a lender is a smart contract (e.g., a multisig, DAO treasury, or malicious contract) that does not implement a `receive()` or `fallback()` function, or if its receive function consumes more gas than provided, any call to `repayLoan` will revert.
   - This creates a vulnerability where a malicious lender could intentionally block repayments, forcing the borrower into default.
2. **Gas Overhead in Settlement**:
   - The borrower pays the gas cost of transferring value to the lender's address, which can fluctuate wildly if the lender's wallet triggers complex contract callbacks.
3. **Production Alternative (Pull/Escrow Pattern)**:
   - In production DeFi, protocols use a **Pull Payment** (or `WithdrawalPattern`): repayments are credited to an internal balance mapping (`pendingWithdrawals[lender] += msg.value`), and the lender initiates a separate `withdraw()` transaction to claim their funds.

---

## 3. Interest Mechanics & Amortization Schedules

### Current Implementation
BlockLoan implements **linear simple interest** calculated for the exact duration of the loan:
$$\text{Interest} = \frac{\text{Principal} \times \text{APR} \times \text{Duration}}{10{,}000 \times 365\text{ days}}$$

### Trade-Offs & Limitations
1. **Lack of Compounding**:
   - Institutional and commercial credit markets use compounding interest ($A = P(1 + r/n)^{nt}$) or continuous compounding ($A = Pe^{rt}$).
   - Simple interest understates the time-value of money on longer tenures.
2. **No Partial Amortization or Early Repayment Discount**:
   - If a borrower repays their 365-day loan on Day 5, the total amount due remains fixed to the full 365-day interest calculation. There is no dynamic proration of interest based on the actual elapsed time between funding and repayment.
3. **Integer Truncation & Rounding**:
   - Solidity does not natively support floating-point numbers. While basis point scaling ($10{,}000$) provides adequate precision for native ETH wei amounts, small loans or low durations can experience minor rounding down to zero for micro-amounts.

---

## 4. Currency Denomination & Absence of Decentralized Oracles

### Current Implementation
All loans are denominated and settled in native test **Ethereum (ETH)**.

### Trade-Offs & Limitations
1. **High Volatility Risk**:
   - ETH is a volatile asset. If a borrower borrows 2 ETH when ETH is valued at \$2,000 (\$4,000 total debt), and ETH doubles to \$4,000 during the 60-day loan period, the borrower must repay 2 ETH plus interest, which now equates to over \$8,000 in purchasing power.
   - Conversely, if ETH crashes by 50%, the lender receives depreciated purchasing power upon repayment.
2. **Absence of Chainlink Price Oracles**:
   - Because all values are native ETH, the contract does not query external price oracles (such as Chainlink ETH/USD data feeds).
   - In real-world lending, agreements are typically pegged to stable purchasing units (USDC, USDT, DAI) even if settled in crypto.

---

## 5. Undercollateralization & Credit Default Risk

### Current Implementation
The current version operates on **direct bilateral peer-to-peer trust** without mandatory overcollateralized crypto deposits.

### Trade-Offs & Limitations
1. **Absence of On-Chain Collateral Liquidation**:
   - If a borrower defaults, the smart contract transitions the state to `DEFAULTED` and logs an on-chain bad-debt event (`LoanDefaulted`).
   - However, the contract does not hold a locked collateral escrow to liquidate and reimburse the lender. The lender must rely on off-chain reputation, legal agreements, or promissory notes.
2. **Pseudonymous Identity Paradox**:
   - In public decentralized blockchains, wallet addresses are anonymous keypairs. Without collateral or decentralized identity (DID / soulbound credit credentials), a borrower can simply abandon a defaulted wallet address and create a new one with zero reputational consequence.
3. **Production Alternative**:
   - Protocols like Aave and Compound enforce **Overcollateralization** (e.g., 150% collateral-to-loan ratio in ETH/WBTC to borrow stablecoins) and use automated liquidation bots.

---

## 6. Single-Lender Matching vs. Pooled Liquidity

### Current Implementation
Each loan proposal is a **discrete, 1-to-1 agreement**:
- Exactly one lender must supply 100% of the requested principal in a single atomic transaction.

### Trade-Offs & Limitations
1. **Liquidity Fragmentation**:
   - If a borrower requests 10 ETH, a lender with 5 ETH cannot participate. The request remains unfulfilled until a single user with 10 ETH funds it.
2. **Lack of Risk Diversification**:
   - The lender bears 100% of the credit default risk for that specific borrower.
3. **Production Alternative (Liquidity Pools)**:
   - Modern protocols aggregate funds from thousands of lenders into a collective pool (e.g., cTokens or aTokens). Borrowers draw liquidity from the pool, and interest is distributed proportionally across all depositors, spreading default risk.

---

## 7. Regulatory, Privacy & Testnet Constraints

### 1. Testnet and Local Execution
- The protocol is deployed strictly on a local Hardhat network (`chainId: 31337`).
- It has not undergone formal third-party security audits (e.g., OpenZeppelin, Trail of Bits, CertiK).
- Real funds must never be committed to this contract.

### 2. Regulatory Compliance
- Decentralized lending protocols operating in real jurisdictions must comply with lending licenses, Anti-Money Laundering (AML) standards, Know Your Customer (KYC) requirements, and consumer credit protection acts (e.g., Truth in Lending Act).
- BlockLoan is strictly an academic software artifact demonstrating algorithmic trust.
