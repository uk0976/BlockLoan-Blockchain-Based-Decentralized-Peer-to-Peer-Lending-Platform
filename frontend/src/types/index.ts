export enum LoanStatus {
  Requested = 0,
  Funded = 1,
  Repaid = 2,
  Defaulted = 3,
  Liquidated = 4,
  Cancelled = 5,
}

export interface Loan {
  id: number;
  borrower: string;
  lender: string;
  principalAmount: string; // in ETH formatted string
  collateralAmount: string; // in ETH formatted string
  interestRateBps: number; // e.g. 500 = 5%
  durationSeconds: number;
  createdAt: number;
  fundedAt: number;
  dueDate: number;
  status: LoanStatus;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
}
