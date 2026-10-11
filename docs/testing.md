# BlockLoan — Testing & Quality Assurance Report

**Test Execution Date**: October 2026  
**Test Frameworks**: Hardhat / Mocha / Chai, Pytest (`9.1+`), Ethers.js v6, Vite Build Checker  
**Overall Status**: ✅ **ALL 94 AUTOMATED TESTS PASSING (58 Smart Contract + 36 Backend) + 7/7 E2E INTEGRATION STAGES PASSING**

---

## 1. Testing Strategy & Methodology

BlockLoan implements a multi-tier testing strategy combining:
1. **Solidity Smart Contract Unit Tests**: Verifying state transitions, arithmetic precision, and modifier guards.
2. **Security & Negative Exploit Tests**: Simulating attack vectors including reentrancy, unauthorized calls, deadline violations, and unexpected ETH transfers.
3. **Backend API & Service Tests**: Testing FastAPI endpoints, Pydantic validations, Web3.py RPC node interactions, and SQL injection sanitization.
4. **End-to-End Two-Wallet Integration Test**: Automating a full loan lifecycle across two real Hardhat test accounts (`0x7099...` and `0x3C44...`) and verifying backend indexing.
5. **Frontend Production Build Compilation**: Strict TypeScript compilation and Vite asset tree bundling.

---

## 2. Test Execution Summary

| Test Suite | Environment | Cases Passed | Cases Failed | Execution Time |
| :--- | :--- | :---: | :---: | :---: |
| **Contract Core Unit Tests** | Hardhat Local EVM | 23 | 0 | ~0.4s |
| **Contract Integration Tests** | Hardhat Local EVM | 6 | 0 | ~0.2s |
| **Contract Security Negative Tests**| Hardhat Local EVM | 29 | 0 | ~0.4s |
| **Backend API & Web3.py Tests** | Pytest / Python 3.14 | 36 | 0 | ~1.7s |
| **E2E Multi-Wallet Script** | Live Node (`31337`) | 7 Stages | 0 | ~2.5s |
| **Frontend Production Build** | TypeScript / Vite | Bundle OK | 0 | ~2.8s |
| **Total Automated Verifications** | **Full Stack** | **102 / 102** | **0** | **~8.0s** |

---

## 3. Smart Contract Test Suite (58 Passing Tests)

### Command
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\blockchain"
npx hardhat test
```

### Breakdown of Test Suites

#### Suite A: Core Contract Unit Tests (23 Passing)
- **1. Loan Creation**:
  - `√ should create a valid loan request and emit LoanCreated`
  - `√ should reject principal amounts below minimum threshold (1000 wei)`
  - `√ should reject interest rate below minimum (50 bps) or above maximum (5000 bps) caps`
  - `√ should reject duration below minimum (1 hr) or above maximum (365 days) caps`
- **2. Loan Funding**:
  - `√ should fund loan successfully, transfer principal to borrower, and record status`
  - `√ should reject funding when caller is the borrower (prevents wash loans)`
  - `√ should reject funding with incorrect ETH amount`
  - `√ should reject duplicate funding attempts`
  - `√ should revert if funding a nonexistent loan`
- **3. Repayment & Settlement**:
  - `√ should process partial repayments and forward ETH to lender`
  - `√ should mark loan COMPLETED upon settling full amount due`
  - `√ should reject repayments from unauthorized non-borrower accounts`
  - `√ should reject zero-value repayments`
  - `√ should reject overpayment exceeding remaining amount due`
  - `√ should reject repayments after loan has completed`
- **4. Deadline & Default Behavior**:
  - `√ should disallow markDefaulted before the repayment deadline passes`
  - `√ should reject borrower repayment after deadline passes`
  - `√ should allow permissionless default marking after deadline expires`
  - `√ should reject markDefaulted on an already COMPLETED loan`
- **5. Cancellation & Edge Cases**:
  - `√ should allow borrower to cancel OPEN loan request`
  - `√ should reject cancelLoan from non-borrower accounts`
  - `√ should prevent funding a cancelled loan`
  - `√ should revert getLoan on nonexistent index`

#### Suite B: Frontend Contract Integration (6 Passing)
- `√ Step 1: Borrower creates loan request on-chain`
- `√ Step 2: Rejects borrower trying to fund their own loan`
- `√ Step 3: Separate Lender funds loan with exact principal in native test ETH`
- `√ Step 4: Only borrower can submit repayments`
- `√ Step 5: Full lifecycle with partial and full settlement forwards ETH to lender`
- `√ Step 6: QueryFilter discovers all historical events matching frontend requirements`

#### Suite C: Security Negative Tests & Edge Cases (29 Passing)
- **Input Validation & Parameter Boundaries**:
  - `√ should reject principal below MIN_PRINCIPAL (999 wei)`
  - `√ should accept exact MIN_PRINCIPAL threshold (1000 wei)`
  - `√ should reject interest rate below MIN_INTEREST_RATE_BPS (49 bps)`
  - `√ should reject interest rate above MAX_INTEREST_RATE_BPS (5001 bps)`
  - `√ should accept exact boundary interest rates (50 bps and 5000 bps)`
  - `√ should reject duration below MIN_DURATION (3599 seconds)`
  - `√ should reject duration above MAX_DURATION (365 days + 1 sec)`
- **Nonexistent Resource Handling**:
  - `√ should revert with LoanNotFound on loanId 0`
  - `√ should revert with LoanNotFound on loanId exceeding counter`
- **Duplicate Funding & State Transitions**:
  - `√ should prevent duplicate funding of an already ACTIVE loan`
  - `√ should prevent funding a CANCELLED loan`
  - `√ should prevent repayLoan on an OPEN (unfunded) loan`
  - `√ should prevent cancelLoan once loan is ACTIVE`
  - `√ should prevent non-borrower from cancelling an OPEN loan`
- **Repayment Authorization & Payment Boundaries**:
  - `√ should reject repayments from unauthorized stranger account`
  - `√ should reject repayments from the lender account itself`
  - `√ should reject zero-value repayments`
  - `√ should reject overpayment exceeding total amount due`
- **Deadline & Default Handling**:
  - `√ should disallow markDefaulted before deadline passes`
  - `√ should disallow markDefaulted on an OPEN loan`
  - `√ should reject borrower repayment after repayment deadline expires`
  - `√ should allow permissionless markDefaulted strictly after deadline passes`
  - `√ should reject calling markDefaulted on an already DEFAULTED loan`
  - `√ should reject calling markDefaulted on a COMPLETED loan`
- **Unexpected ETH Transfers & Balance Invariants**:
  - `√ should reject plain direct ETH transfers without function call`
  - `√ should maintain 0 balance invariant across entire loan lifecycle`
  - `√ should reject ETH sent to non-payable functions`
- **Arithmetic Precision & Rounding Verification**:
  - `√ should correctly compute simple interest for arbitrary durations`
  - `√ should return remainingDue as 0 once COMPLETED`

---

## 4. Backend Pytest Test Suite (36 Passing Tests)

### Command
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\backend"
& .\venv\Scripts\pytest.exe -v
```

### Results Summary
```text
tests/test_admin.py::test_admin_statistics PASSED                        [  2%]
tests/test_admin.py::test_admin_node_audit PASSED                        [  5%]
tests/test_blockchain_service.py::test_map_loan_status PASSED            [  8%]
tests/test_blockchain_service.py::test_blockchain_service_offline_error PASSED [ 11%]
tests/test_blockchain_service.py::test_blockchain_service_chain_id_mismatch PASSED [ 13%]
tests/test_blockchain_service.py::test_blockchain_service_missing_address PASSED [ 16%]
tests/test_blockchain_service.py::test_blockchain_service_invalid_address PASSED [ 19%]
tests/test_blockchain_service.py::test_blockchain_service_undeployed_contract PASSED [ 22%]
tests/test_health.py::test_health_check_endpoint PASSED                  [ 25%]
tests/test_health.py::test_health_check_node_online_mock PASSED          [ 27%]
tests/test_health.py::test_blockchain_status_overview PASSED             [ 30%]
tests/test_integration_node.py::test_live_node_integration PASSED        [ 33%]
tests/test_loans.py::test_list_loans_cached_fallback PASSED              [ 36%]
tests/test_loans.py::test_list_loans_on_chain PASSED                     [ 38%]
tests/test_loans.py::test_get_loan_by_id_success PASSED                  [ 41%]
tests/test_loans.py::test_get_loan_invalid_id PASSED                     [ 44%]
tests/test_loans.py::test_get_loan_not_found PASSED                      [ 47%]
tests/test_loans.py::test_get_loan_status PASSED                         [ 50%]
tests/test_loans.py::test_set_and_get_loan_metadata PASSED               [ 52%]
tests/test_loans.py::test_get_loan_repayments PASSED                     [ 55%]
tests/test_security_negative.py::test_invalid_loan_id_negative PASSED    [ 58%]
tests/test_security_negative.py::test_invalid_loan_id_zero PASSED        [ 61%]
tests/test_security_negative.py::test_invalid_address_format PASSED      [ 63%]
tests/test_security_negative.py::test_invalid_tx_hash_format PASSED      [ 66%]
tests/test_security_negative.py::test_sql_injection_attempt_in_metadata PASSED [ 69%]
tests/test_security_negative.py::test_xss_payload_in_user_profile PASSED [ 72%]
tests/test_security_negative.py::test_cors_authorized_origin PASSED      [ 75%]
tests/test_security_negative.py::test_cors_unauthorized_origin PASSED    [ 77%]
tests/test_security_negative.py::test_no_sensitive_private_key_leakage PASSED [ 80%]
tests/test_security_negative.py::test_database_error_handler_masking PASSED [ 83%]
tests/test_transactions.py::test_get_transaction_receipt_valid PASSED    [ 86%]
tests/test_transactions.py::test_get_transaction_receipt_invalid_hash PASSED [ 88%]
tests/test_transactions.py::test_get_transaction_receipt_not_found PASSED [ 91%]
tests/test_users.py::test_get_user_profile_existing PASSED               [ 94%]
tests/test_users.py::test_get_user_profile_invalid_address PASSED        [ 97%]
tests/test_users.py::test_update_user_profile PASSED                     [100%]
======================== 36 passed, 1 warning in 1.71s ========================
```

---

## 5. End-to-End Multi-Wallet Integration Script

### Command
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\blockchain"
npm run test:e2e
```

### Execution Output & Verification
```text
=================================================================
      BlockLoan Phase 6 — Full Integration End-to-End Test       
=================================================================
Contract Target Address : 0x5FbDB2315678afecb367f032d93F642f64180aa3
Borrower Account (Wallet 1): 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Lender Account   (Wallet 2): 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

[Step 1] Creating Loan Request from Borrower...
✓ Loan Created On-Chain! Assigned Loan ID: #4
✓ Metadata successfully posted to FastAPI backend!

[Step 2] Confirming Loan in Marketplace...
✓ Verified On-Chain: Status is OPEN, Borrower matches Wallet 1, Principal is 1.0 ETH.
✓ Verified Backend API: Status=OPEN, Title="Peer Business Loan"

[Step 3] Funding Loan from Lender Account...
Borrower Balance Before Funding: 9999.979714580408919756 ETH
✓ Loan Funded! Tx: 0xbe3e40f5d1cf1c32e9b413d7dcbb3160a915c3143bdad8f57d8fae7dffd42817
Borrower Balance After Funding : 10000.979714580408919756 ETH
✓ Verified: Borrower received exactly 1.0 ETH principal into their wallet!
✓ Verified On-Chain: Status is ACTIVE, Lender recorded as Wallet 2.

[Step 4] Making Partial Repayment (0.5 ETH) from Borrower...
✓ Partial Repayment Submitted! Tx: 0x6ae9e74f9d33462ddb7a27618bb74b42b7983c434061ac995769775301038d68
✓ Verified: Lender received exactly 0.5 ETH repayment!
✓ Remaining Debt on Contract: 0.506575342465753424 ETH

[Step 5] Completing Full Repayment from Borrower...
✓ Final Repayment Submitted! Tx: 0xc79d5f2f08ed4bacee91b1018d69e49e36f54a54acd7629658f49a12d64258f5
✓ Verified: Lender received remaining settlement of 0.506575342465753424 ETH!
✓ Verified On-Chain: Loan Status transitioned to COMPLETED!

[Step 6] Verifying Blockchain Persistence (Simulating Page Reload)...
✓ Fresh Blockchain Read Verified: Loan #4 is COMPLETED with 0 outstanding debt.

[Step 7] Reconciling with FastAPI Backend & Web3.py Indexer...
✓ Backend /loans/4: Status=COMPLETED, Total Repaid=1.006575 ETH, Remaining=0 ETH
✓ Backend /loans/4/repayments: 2 confirmed events discovered
✓ Backend /admin/statistics: Reconciled with on-chain volume

=================================================================
    ALL PHASE 6 INTEGRATION & TWO-WALLET VERIFICATIONS PASSED ✓  
=================================================================
```

---

## 6. Frontend Build & Static Typing

### Command
```powershell
cd "c:\Users\Umer Khan\OneDrive\Desktop\BT Mini Project\frontend"
npm run build
```
- **Type Checking (`tsc -b`)**: 0 TypeScript compilation errors.
- **Vite Production Bundler**: Built clean assets in **2.87 seconds** without bundling warnings or unhandled exceptions.
