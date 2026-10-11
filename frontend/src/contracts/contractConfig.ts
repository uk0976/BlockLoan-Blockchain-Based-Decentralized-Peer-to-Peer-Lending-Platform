// Contract configuration template
// The ABI and contract address will be loaded here upon deployment.

export const BLOCKLOAN_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

export const BLOCKLOAN_ABI = [
  "function getTotalLoans() external view returns (uint256)",
  "function calculateRepaymentAmount(uint256 principal, uint256 interestRateBps, uint256 durationSeconds) public pure returns (uint256)",
  "event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 principalAmount, uint256 collateralAmount, uint256 interestRateBps, uint256 durationSeconds)",
  "event LoanFunded(uint256 indexed loanId, address indexed lender, uint256 fundedAt, uint256 dueDate)",
  "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 totalRepaid)",
  "event LoanLiquidated(uint256 indexed loanId, address indexed lender, uint256 collateralClaimed)",
  "event LoanCancelled(uint256 indexed loanId, address indexed borrower, uint256 collateralRefunded)"
];
