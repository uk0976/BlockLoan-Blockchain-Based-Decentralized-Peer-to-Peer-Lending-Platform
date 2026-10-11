// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockLoan
 * @dev Decentralized Peer-to-Peer Lending Platform Smart Contract.
 * Manages loan requests, collateral deposits, peer funding, repayments with interest,
 * and collateral liquidation without intermediaries or custodians.
 * 
 * College Mini Project: BlockLoan
 */
contract BlockLoan {
    enum LoanStatus {
        Requested,   // Borrower created request & locked collateral
        Funded,      // Lender funded the loan; funds disbursed to borrower
        Repaid,      // Borrower repaid principal + interest; collateral released
        Defaulted,   // Due date passed without full repayment
        Liquidated,  // Lender claimed collateral after default
        Cancelled    // Borrower cancelled before funding; collateral refunded
    }

    struct Loan {
        uint256 id;
        address payable borrower;
        address payable lender;
        uint256 principalAmount;      // Principal in wei (testnet ETH)
        uint256 collateralAmount;     // Collateral in wei (testnet ETH)
        uint256 interestRateBps;      // Annual interest in basis points (e.g. 500 = 5%)
        uint256 durationSeconds;      // Loan term in seconds
        uint256 createdAt;
        uint256 fundedAt;
        uint256 dueDate;
        LoanStatus status;
    }

    // State Variables
    uint256 public loanCounter;
    mapping(uint256 => Loan) public loans;

    // Events
    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 principalAmount,
        uint256 collateralAmount,
        uint256 interestRateBps,
        uint256 durationSeconds
    );

    event LoanFunded(
        uint256 indexed loanId,
        address indexed lender,
        uint256 fundedAt,
        uint256 dueDate
    );

    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 totalRepaid
    );

    event LoanLiquidated(
        uint256 indexed loanId,
        address indexed lender,
        uint256 collateralClaimed
    );

    event LoanCancelled(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 collateralRefunded
    );

    // Initial contract initialization
    constructor() {
        loanCounter = 0;
    }

    /**
     * @notice Get total number of loans created on the platform
     */
    function getTotalLoans() external view returns (uint256) {
        return loanCounter;
    }

    /**
     * @notice Calculate total repayment amount (principal + interest)
     * @param principal Loan principal amount in wei
     * @param interestRateBps Interest rate in basis points (1/100th of 1%)
     * @param durationSeconds Loan duration in seconds
     */
    function calculateRepaymentAmount(
        uint256 principal,
        uint256 interestRateBps,
        uint256 durationSeconds
    ) public pure returns (uint256) {
        // Interest = (Principal * Rate * Duration) / (10000 * 365 days)
        uint256 interest = (principal * interestRateBps * durationSeconds) / (10000 * 365 days);
        return principal + interest;
    }

    /*
     * Core functional methods will be fully implemented and verified in subsequent development phases:
     * - requestLoan(...) payable
     * - fundLoan(uint256 loanId) payable
     * - repayLoan(uint256 loanId) payable
     * - liquidateLoan(uint256 loanId)
     * - cancelLoan(uint256 loanId)
     */
}
