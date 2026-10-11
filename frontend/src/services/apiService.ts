/**
 * BlockLoan Backend API Client
 * Interfaces with FastAPI server (http://127.0.0.1:8000/api)
 */

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8000/api';

export interface BackendLoanResponse {
  id: number;
  borrower: string;
  lender?: string | null;
  principal_eth: number;
  interest_rate_bps: number;
  duration_seconds: number;
  created_at: string;
  funded_at?: string | null;
  repayment_deadline?: string | null;
  total_due_eth: number;
  total_repaid_eth: number;
  remaining_due_eth: number;
  status: string;
  title: string;
  purpose: string;
  collateral_description?: string | null;
  on_chain_verified: boolean;
  source: string;
}

export interface BackendAdminStats {
  total_loans: number;
  open_loans: number;
  active_loans: number;
  completed_loans: number;
  defaulted_loans: number;
  total_volume_eth?: number;
  total_repaid_eth?: number;
  total_principal_volume_eth?: number;
  total_repaid_volume_eth?: number;
  active_outstanding_debt_eth?: number;
  contract_address?: string;
  chain_id?: number;
  node_connected?: boolean;
  contract_deployed?: boolean;
  source?: string;
}

export interface BackendBlockchainStatus {
  is_connected: boolean;
  chain_id: number | null;
  latest_block: number | null;
  gas_price_gwei: number | null;
  contract_address: string;
  contract_deployed: boolean;
  active_loans_count?: number;
  error?: string | null;
}

export interface BackendRepaymentLog {
  loan_id: number;
  borrower: string;
  amount_paid_eth: number;
  remaining_due_eth: number;
  transaction_hash: string;
  block_number: number;
}

export interface BackendTxReceipt {
  transaction_hash: string;
  block_number: number;
  status: string;
  from_address: string;
  to_address: string;
  gas_used: number;
  is_confirmed: boolean;
}

export interface BackendUserProfile {
  wallet_address: string;
  display_name?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });

    if (!res.ok) {
      console.warn(`API request to ${url} failed with status: ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`API connection error for ${url}:`, err);
    return null;
  }
}

export const apiService = {
  /**
   * Check backend server health
   */
  async getHealth(): Promise<{ status: string; rpc_connected: boolean; chain_id: number } | null> {
    return request<{ status: string; rpc_connected: boolean; chain_id: number }>('/health');
  },

  /**
   * Inspect live blockchain node connection status
   */
  async getBlockchainStatus(): Promise<BackendBlockchainStatus | null> {
    return request<BackendBlockchainStatus>('/blockchain/status');
  },

  /**
   * Get all loans indexed from on-chain and cached
   */
  async getLoans(status?: string): Promise<BackendLoanResponse[] | null> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status.toUpperCase())}` : '';
    return request<BackendLoanResponse[]>(`/loans${query}`);
  },

  /**
   * Get detailed loan data by ID
   */
  async getLoanById(loanId: number): Promise<BackendLoanResponse | null> {
    return request<BackendLoanResponse>(`/loans/${loanId}`);
  },

  /**
   * Get repayments for a specific loan
   */
  async getLoanRepayments(loanId: number): Promise<BackendRepaymentLog[] | null> {
    return request<BackendRepaymentLog[]>(`/loans/${loanId}/repayments`);
  },

  /**
   * Persist user-specified off-chain metadata (title, purpose, collateral description)
   */
  async saveLoanMetadata(
    loanId: number,
    data: { title: string; purpose: string; collateral_description?: string }
  ): Promise<boolean> {
    const res = await request<{ success: boolean }>(`/loans/${loanId}/metadata`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return !!res;
  },

  /**
   * Retrieve platform statistics for protocol monitoring
   */
  async getAdminStatistics(): Promise<BackendAdminStats | null> {
    return request<BackendAdminStats>('/admin/statistics');
  },

  /**
   * Retrieve protocol audit data
   */
  async getAdminAudit(): Promise<Record<string, unknown> | null> {
    return request<Record<string, unknown>>('/admin/audit');
  },

  /**
   * Retrieve on-chain transaction receipt verified by backend Web3.py
   */
  async getTransactionReceipt(txHash: string): Promise<BackendTxReceipt | null> {
    return request<BackendTxReceipt>(`/transactions/${txHash}`);
  },

  /**
   * Get off-chain user profile
   */
  async getUserProfile(address: string): Promise<BackendUserProfile | null> {
    return request<BackendUserProfile>(`/users/${address}`);
  },

  /**
   * Update off-chain user profile
   */
  async updateUserProfile(
    address: string,
    profile: { display_name?: string; bio?: string }
  ): Promise<BackendUserProfile | null> {
    return request<BackendUserProfile>(`/users/${address}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },
};
