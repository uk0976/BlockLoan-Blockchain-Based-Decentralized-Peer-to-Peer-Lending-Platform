export type LoanStatus = 'Requested' | 'Funded' | 'Repaid' | 'Defaulted' | 'Liquidated' | 'Cancelled';

export interface Loan {
  id: number;
  title: string;
  purpose: string;
  borrower: string;
  lender?: string;
  principalAmount: number; // in ETH
  collateralAmount: number; // in ETH
  interestRateBps: number; // e.g. 850 = 8.5%
  durationDays: number;
  createdAt: string;
  fundedAt?: string;
  dueDate?: string;
  repaidAmount: number; // in ETH
  status: LoanStatus;
  txHash?: string;
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
