// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockLoan
 * @author BlockLoan Team (College Mini-Project)
 * @notice Educational prototype decentralized peer-to-peer lending protocol.
 * 
 * DISCLAIMER:
 * This smart contract is built strictly for academic demonstration and research purposes.
 * It is intended for deployment on local networks (Hardhat) and Ethereum testnets using
 * test cryptocurrency only. It has NOT been formally audited for mainnet deployment.
 * Never use real funds with this contract.
 * 
 * ARCHITECTURAL DESIGN & INVARIANTS:
 * - Non-Custodial: Smart contract holds only active transient principal/repayments.
 * - Zero Admin Privileges: No owner backdoors, fund extraction functions, or pause-and-seize mechanisms.
 * - Simple Interest: Proportional to loan duration in seconds, computed with basis points (100 bps = 1%).
 * - Reentrancy Protected: State changes strictly precede external ETH transfers (Checks-Effects-Interactions).
 */
contract BlockLoan {
    // =========================================================================
    // ENUMS & STRUCTS
    // =========================================================================

    /**
     * @notice Lifecycle states for peer loans
     * - OPEN: Created by borrower, awaiting a peer lender to fund.
     * - ACTIVE: Funded by a lender; funds transferred to borrower; duration countdown active.
     * - COMPLETED: Fully repaid with interest before deadline; obligations satisfied.
     * - DEFAULTED: Deadline passed without full repayment; marked permissionlessly.
     * - CANCELLED: Cancelled by borrower prior to peer funding.
     */
    enum LoanStatus {
        OPEN,
        ACTIVE,
        COMPLETED,
        DEFAULTED,
        CANCELLED
    }

    struct Loan {
        uint256 id;
        address payable borrower;
        address payable lender;
        uint256 principalAmount;      // Principal in wei
        uint256 interestRateBps;      // Annual interest in basis points (e.g. 500 = 5.00%)
        uint256 durationSeconds;      // Loan tenure in seconds
        uint256 createdAt;            // Timestamp when loan was requested
        uint256 fundedAt;             // Timestamp when loan was funded by lender
        uint256 repaymentDeadline;    // Timestamp by which full repayment must occur
        uint256 totalDue;             // Principal + calculated interest in wei
        uint256 totalRepaid;          // Cumulative repayments made to date in wei
        LoanStatus status;            // Current loan state
    }

    // =========================================================================
    // CONSTANTS & IMMUTABLES
    // =========================================================================

    uint256 public constant SECONDS_PER_YEAR = 365 days; // 31,536,000 seconds
    uint256 public constant BPS_DIVISOR = 10000;         // 100% = 10,000 bps

    uint256 public constant MIN_PRINCIPAL = 1000 wei;
    uint256 public constant MIN_INTEREST_RATE_BPS = 50;  // 0.50% APR
    uint256 public constant MAX_INTEREST_RATE_BPS = 5000; // 50.00% APR

    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 365 days;

    // Lightweight Mutex for Reentrancy Protection
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _reentrancyStatus;

    // =========================================================================
    // STORAGE
    // =========================================================================

    uint256 public loanCounter;
    mapping(uint256 => Loan) private _loans;

    // =========================================================================
    // EVENTS
    // =========================================================================

    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 principalAmount,
        uint256 interestRateBps,
        uint256 durationSeconds
    );

    event LoanFunded(
        uint256 indexed loanId,
        address indexed lender,
        uint256 totalDue,
        uint256 repaymentDeadline
    );

    event RepaymentMade(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amountPaid,
        uint256 remainingDue
    );

    event LoanCompleted(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed lender,
        uint256 totalRepaid
    );

    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed lender,
        uint256 unpaidAmount
    );

    event LoanCancelled(
        uint256 indexed loanId,
        address indexed borrower
    );

    // =========================================================================
    // CUSTOM ERRORS
    // =========================================================================

    error ReentrancyGuardReentrantCall();
    error LoanNotFound(uint256 loanId);
    error InvalidPrincipal(uint256 principal);
    error InvalidInterestRate(uint256 rateBps);
    error InvalidDuration(uint256 durationSeconds);
    error InvalidLoanStatus(LoanStatus current, LoanStatus expected);
    error BorrowerCannotFund();
    error IncorrectFundingAmount(uint256 sent, uint256 required);
    error OnlyBorrowerCanRepay();
    error ZeroPaymentNotAllowed();
    error RepaymentExceedsBalance(uint256 sent, uint256 remaining);
    error DeadlinePassed(uint256 deadline, uint256 currentTimestamp);
    error DeadlineNotPassed(uint256 deadline, uint256 currentTimestamp);
    error OnlyBorrowerCanCancel();
    error TransferFailed();

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    modifier nonReentrant() {
        if (_reentrancyStatus == _ENTERED) revert ReentrancyGuardReentrantCall();
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor() {
        loanCounter = 0;
        _reentrancyStatus = _NOT_ENTERED;
    }

    // =========================================================================
    // CORE EXTERNAL FUNCTIONS
    // =========================================================================

    /**
     * @notice Create a new peer-to-peer loan request
     * @dev Enforces positive bounds, maximum APR rate and duration caps
     * @param principal Principal in native test ETH wei requested
     * @param interestRateBps Annual interest rate in basis points (e.g. 850 = 8.5%)
     * @param durationSeconds Duration of loan term in seconds once funded
     * @return loanId The unique identifier of the created loan
     */
    function createLoan(
        uint256 principal,
        uint256 interestRateBps,
        uint256 durationSeconds
    ) external returns (uint256 loanId) {
        if (principal < MIN_PRINCIPAL) {
            revert InvalidPrincipal(principal);
        }
        if (interestRateBps < MIN_INTEREST_RATE_BPS || interestRateBps > MAX_INTEREST_RATE_BPS) {
            revert InvalidInterestRate(interestRateBps);
        }
        if (durationSeconds < MIN_DURATION || durationSeconds > MAX_DURATION) {
            revert InvalidDuration(durationSeconds);
        }

        loanCounter++;
        loanId = loanCounter;

        Loan storage loan = _loans[loanId];
        loan.id = loanId;
        loan.borrower = payable(msg.sender);
        loan.lender = payable(address(0));
        loan.principalAmount = principal;
        loan.interestRateBps = interestRateBps;
        loan.durationSeconds = durationSeconds;
        loan.createdAt = block.timestamp;
        loan.fundedAt = 0;
        loan.repaymentDeadline = 0;
        loan.totalDue = 0;
        loan.totalRepaid = 0;
        loan.status = LoanStatus.OPEN;

        emit LoanCreated(loanId, msg.sender, principal, interestRateBps, durationSeconds);
    }

    /**
     * @notice Fund an open loan proposal
     * @dev Transfers native ETH principal immediately to the borrower.
     *      Calculates interest and locks repayment deadline upon successful receipt.
     * @param loanId Identifier of the loan to fund
     */
    function fundLoan(uint256 loanId) external payable nonReentrant {
        if (loanId == 0 || loanId > loanCounter) {
            revert LoanNotFound(loanId);
        }

        Loan storage loan = _loans[loanId];

        if (loan.status != LoanStatus.OPEN) {
            revert InvalidLoanStatus(loan.status, LoanStatus.OPEN);
        }
        if (msg.sender == loan.borrower) {
            revert BorrowerCannotFund();
        }
        if (msg.value != loan.principalAmount) {
            revert IncorrectFundingAmount(msg.value, loan.principalAmount);
        }

        // Calculate total due: Principal + (Principal * Rate * Duration) / (10000 * 365 days)
        uint256 totalAmountDue = calculateRepaymentAmount(
            loan.principalAmount,
            loan.interestRateBps,
            loan.durationSeconds
        );

        // State update (Checks-Effects)
        loan.lender = payable(msg.sender);
        loan.fundedAt = block.timestamp;
        loan.repaymentDeadline = block.timestamp + loan.durationSeconds;
        loan.totalDue = totalAmountDue;
        loan.status = LoanStatus.ACTIVE;

        emit LoanFunded(loanId, msg.sender, totalAmountDue, loan.repaymentDeadline);

        // External Interaction
        (bool sent, ) = loan.borrower.call{value: msg.value}("");
        if (!sent) {
            revert TransferFailed();
        }
    }

    /**
     * @notice Repay an active loan (partial or full)
     * @dev Only the borrower can service their debt. Forwards ETH directly to the lender.
     *      Completes the loan once totalRepaid equals totalDue.
     * @param loanId Identifier of the loan being repaid
     */
    function repayLoan(uint256 loanId) external payable nonReentrant {
        if (loanId == 0 || loanId > loanCounter) {
            revert LoanNotFound(loanId);
        }

        Loan storage loan = _loans[loanId];

        if (loan.status != LoanStatus.ACTIVE) {
            revert InvalidLoanStatus(loan.status, LoanStatus.ACTIVE);
        }
        if (msg.sender != loan.borrower) {
            revert OnlyBorrowerCanRepay();
        }
        if (msg.value == 0) {
            revert ZeroPaymentNotAllowed();
        }
        if (block.timestamp > loan.repaymentDeadline) {
            revert DeadlinePassed(loan.repaymentDeadline, block.timestamp);
        }

        uint256 remainingDue = loan.totalDue - loan.totalRepaid;
        if (msg.value > remainingDue) {
            revert RepaymentExceedsBalance(msg.value, remainingDue);
        }

        // State update (Checks-Effects)
        loan.totalRepaid += msg.value;
        uint256 newRemainingDue = loan.totalDue - loan.totalRepaid;

        emit RepaymentMade(loanId, msg.sender, msg.value, newRemainingDue);

        if (newRemainingDue == 0) {
            loan.status = LoanStatus.COMPLETED;
            emit LoanCompleted(loanId, loan.borrower, loan.lender, loan.totalRepaid);
        }

        // External Interaction: forward payment to lender
        (bool sent, ) = loan.lender.call{value: msg.value}("");
        if (!sent) {
            revert TransferFailed();
        }
    }

    /**
     * @notice Permissionlessly mark an active loan as defaulted once the repayment deadline expires
     * @dev Effect of default:
     *      - Transitions state to DEFAULTED.
     *      - Permanently disables normal repayment through repayLoan().
     *      - Records the unserviceable bad debt on-chain for transparent accounting and credit scoring.
     *      - Formalizes the lender's documented right to debt assertion and off-chain recovery claims.
     * @param loanId Identifier of the loan to evaluate
     */
    function markDefaulted(uint256 loanId) external {
        if (loanId == 0 || loanId > loanCounter) {
            revert LoanNotFound(loanId);
        }

        Loan storage loan = _loans[loanId];

        if (loan.status != LoanStatus.ACTIVE) {
            revert InvalidLoanStatus(loan.status, LoanStatus.ACTIVE);
        }
        if (block.timestamp <= loan.repaymentDeadline) {
            revert DeadlineNotPassed(loan.repaymentDeadline, block.timestamp);
        }

        loan.status = LoanStatus.DEFAULTED;
        uint256 unpaidBalance = loan.totalDue - loan.totalRepaid;

        emit LoanDefaulted(loanId, loan.borrower, loan.lender, unpaidBalance);
    }

    /**
     * @notice Cancel an unfunded loan request
     * @dev Only allowed by the borrower while loan remains OPEN
     * @param loanId Identifier of the loan to cancel
     */
    function cancelLoan(uint256 loanId) external {
        if (loanId == 0 || loanId > loanCounter) {
            revert LoanNotFound(loanId);
        }

        Loan storage loan = _loans[loanId];

        if (loan.status != LoanStatus.OPEN) {
            revert InvalidLoanStatus(loan.status, LoanStatus.OPEN);
        }
        if (msg.sender != loan.borrower) {
            revert OnlyBorrowerCanCancel();
        }

        loan.status = LoanStatus.CANCELLED;

        emit LoanCancelled(loanId, msg.sender);
    }

    // =========================================================================
    // VIEW / PURE FUNCTIONS
    // =========================================================================

    /**
     * @notice Get details of a specific loan
     * @param loanId The unique loan identifier
     */
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        if (loanId == 0 || loanId > loanCounter) {
            revert LoanNotFound(loanId);
        }
        return _loans[loanId];
    }

    /**
     * @notice Total number of loans created on the platform
     */
    function getLoanCount() external view returns (uint256) {
        return loanCounter;
    }

    /**
     * @notice Calculate remaining amount to be repaid on an active loan
     * @param loanId The unique loan identifier
     * @return remainingDue Outstanding balance in wei
     */
    function getRepaymentAmount(uint256 loanId) external view returns (uint256 remainingDue) {
        if (loanId == 0 || loanId > loanCounter) {
            revert LoanNotFound(loanId);
        }
        Loan storage loan = _loans[loanId];
        if (loan.status == LoanStatus.COMPLETED) {
            return 0;
        }
        return loan.totalDue - loan.totalRepaid;
    }

    /**
     * @notice Calculate total repayment amount (principal + interest)
     * @dev Arithmetic:
     *      Interest = (principal * interestRateBps * durationSeconds) / (10,000 * 365 days)
     *      Uses integer division rounding down.
     * @param principal Principal in wei
     * @param interestRateBps Annual interest rate in basis points (100 = 1%)
     * @param durationSeconds Duration of loan in seconds
     * @return Total due in wei
     */
    function calculateRepaymentAmount(
        uint256 principal,
        uint256 interestRateBps,
        uint256 durationSeconds
    ) public pure returns (uint256) {
        uint256 interest = (principal * interestRateBps * durationSeconds) / (BPS_DIVISOR * SECONDS_PER_YEAR);
        return principal + interest;
    }
}
