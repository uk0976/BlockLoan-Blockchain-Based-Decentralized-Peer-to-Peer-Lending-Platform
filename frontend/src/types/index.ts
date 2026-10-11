export type LoanStatus = 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';

export interface Loan {
  id: number;
  title: string;
  purpose: string;
  borrower: string;
  lender?: string;
  principalAmount: number; // in ETH formatted number
  collateralAmount: number; // in ETH formatted number (optional in Phase 1-3)
  interestRateBps: number; // e.g. 850 = 8.5%
  durationDays: number;
  durationSeconds?: number;
  createdAt: string;
  fundedAt?: string;
  dueDate?: string;
  repaidAmount: number; // in ETH formatted number
  status: LoanStatus;
  txHash?: string;
  principalWei?: bigint;
  totalDueWei?: bigint;
  totalRepaidWei?: bigint;
  isBlockchainVerified?: boolean;
}

export type TransactionAction = 'Request Loan' | 'Fund Loan' | 'Repay Loan' | 'Liquidate Collateral' | 'Cancel Loan';

export interface TransactionRecord {
  id: string;
  hash: string;
  action: TransactionAction;
  loanId: number;
  from: string;
  to?: string;
  amountEth: number;
  timestamp: string;
  status: 'Confirmed' | 'Pending' | 'Failed';
  blockNumber: number;
}

export interface ProtocolStats {
  totalVolumeEth: number;
  totalLoansCount: number;
  activeLoansCount: number;
  totalFundedEth: number;
  totalRepaidEth: number;
  defaultedLoansCount: number;
  averageApr: number;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  networkName: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balanceEth: string;
  error: string | null;
  isDemoMode: boolean;
}
