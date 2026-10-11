# BlockLoan — Smart Contract Specification

## Contract Name: `BlockLoan.sol`
- **Compiler**: Solidity `^0.8.20`
- **Target Network**: Local Hardhat (`chainId: 31337`) / Ethereum Sepolia Testnet

---

## 1. State Model

### Loan Status Lifecycle
```
[Requested] ----(fundLoan)----> [Funded] ----(repayLoan before dueDate)----> [Repaid]
     |                             |
(cancelLoan)                       +--------(repayLoan missed after dueDate)--> [Defaulted]
     |                                                                               |
     v                                                                               v
 [Cancelled]                                                                    (liquidateLoan)
                                                                                     |
                                                                                     v
                                                                                [Liquidated]
```

### Loan Status Definitions
- `Requested`: Borrower deposited collateral and created loan parameters. Open for peer funding.
- `Funded`: A lender supplied the required principal in test ETH. The borrower received the principal, and the loan term countdown began.
- `Repaid`: Borrower repaid the full principal plus accrued interest before the due date. The lender received their return, and the borrower received their locked collateral back.
- `Defaulted`: The loan term expired without complete repayment.
- `Liquidated`: The lender claimed the locked collateral to cover the default.
- `Cancelled`: Borrower cancelled the request before any lender funded it; collateral returned.

---

## 2. Core Functions & Interface

### `requestLoan(uint256 principal, uint256 interestRateBps, uint256 durationSeconds) payable external returns (uint256)`
- **Conditions**: `msg.value` (collateral) must meet the minimum collateralization ratio (e.g. >= 120% of principal).
- **Effects**: Creates new `Loan` entry in mapping, increments `loanCounter`, holds collateral in contract escrow, emits `LoanRequested`.

### `fundLoan(uint256 loanId) payable external`
- **Conditions**: Status must be `Requested`, `msg.value == principal`, lender cannot be borrower.
- **Effects**: Transfers principal to borrower, updates lender address, sets `fundedAt` and `dueDate = block.timestamp + durationSeconds`, transitions status to `Funded`, emits `LoanFunded`.

### `repayLoan(uint256 loanId) payable external`
- **Conditions**: Status must be `Funded`, caller must be borrower, `block.timestamp <= dueDate`, `msg.value >= calculateRepaymentAmount(...)`.
- **Effects**: Sends repayment to lender, refunds locked collateral back to borrower, transitions status to `Repaid`, emits `LoanRepaid`.

### `liquidateLoan(uint256 loanId) external`
- **Conditions**: Status is `Funded`, `block.timestamp > dueDate`, caller is lender.
- **Effects**: Transfers locked collateral to lender, transitions status to `Liquidated`, emits `LoanLiquidated`.
