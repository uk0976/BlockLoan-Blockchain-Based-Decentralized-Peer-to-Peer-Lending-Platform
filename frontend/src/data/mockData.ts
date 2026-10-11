import { Loan, TransactionRecord, ProtocolStats } from '../types';

/**
 * ==============================================================================
 * SAMPLE DATA NOTICE (Phase 1 UI Preview)
 * ==============================================================================
 * These records represent realistic mock data strictly used for client-side UI
 * evaluation and responsive layout testing. They are NOT live on-chain transactions.
 * All financial state will be synchronized via Web3.py and Hardhat in later phases.
 * ==============================================================================
 */

export const MOCK_LOANS: Loan[] = [
  {
    id: 101,
    title: "AI Inference Server Upgrade",
    purpose: "Purchasing dual NVIDIA RTX workstation GPUs for local model inference hosting.",
    borrower: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    principalAmount: 3.5,
    collateralAmount: 5.25, // 150% collateral
    interestRateBps: 850, // 8.5% APR
    durationDays: 60,
    createdAt: "2026-03-25T10:30:00Z",
    repaidAmount: 0,
    status: "Requested",
    txHash: "0x3e18a992bb1cf20272b1d3d63c483fefbfad2d9c12b77dbd7638069542a9b6c1",
  },
  {
    id: 102,
    title: "Decentralized Liquidity Provision",
    purpose: "Capital injection into local AMM pool for automated market making yield strategy.",
    borrower: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    lender: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    principalAmount: 6.0,
    collateralAmount: 9.0, // 150% collateral
    interestRateBps: 1100, // 11.0% APR
    durationDays: 90,
    createdAt: "2026-03-10T14:15:00Z",
    fundedAt: "2026-03-12T09:00:00Z",
    dueDate: "2026-06-10T09:00:00Z",
    repaidAmount: 2.15,
    status: "Funded",
    txHash: "0x9f5a7b88d3e7f4c281e0186938a4d7159c9a7217db1386d4e5f7a216c85e492b",
  },
  {
    id: 103,
    title: "Solar Microgrid Installation",
    purpose: "Upfront capital for rooftop solar panel arrays and battery energy storage system.",
    borrower: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    lender: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    principalAmount: 1.8,
    collateralAmount: 2.7,
    interestRateBps: 700, // 7.0% APR
    durationDays: 30,
    createdAt: "2026-02-15T08:00:00Z",
    fundedAt: "2026-02-16T11:20:00Z",
    dueDate: "2026-03-18T11:20:00Z",
    repaidAmount: 1.81, // fully repaid
    status: "Repaid",
    txHash: "0x1c8b32e85a49fb2193b2a8d38865bcfa4598d9317d698124efac0114b3e85290",
  },
  {
    id: 104,
    title: "Mobile Game Alpha Development",
    purpose: "Short-term bridge financing for indie game studio audio assets and QA contractors.",
    borrower: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
    lender: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    principalAmount: 2.2,
    collateralAmount: 3.3,
    interestRateBps: 1350, // 13.5% APR
    durationDays: 45,
    createdAt: "2026-01-20T16:40:00Z",
    fundedAt: "2026-01-22T10:00:00Z",
    dueDate: "2026-03-08T10:00:00Z", // Past due!
    repaidAmount: 0.5,
    status: "Defaulted",
    txHash: "0x7b3e198ca398dc491028741fb6273461285038ec10825f38a5b28394e82649a1",
  },
  {
    id: 105,
    title: "Cross-Border Trade Inventory",
    purpose: "Financing batch shipment of organic specialty coffee beans from partner cooperatives.",
    borrower: "0x976EA74026E72CD55542b0E057371def84446Ba1",
    principalAmount: 4.8,
    collateralAmount: 7.2,
    interestRateBps: 920, // 9.2% APR
    durationDays: 120,
    createdAt: "2026-03-29T18:00:00Z",
    repaidAmount: 0,
    status: "Requested",
    txHash: "0x5d928c0b11a4e2873108d4e92a83617b4c8a2b5894172f84b65a39281c79a528",
  },
  {
    id: 106,
    title: "Autonomous Drone Delivery Fleet",
    purpose: "Procurement of LiDAR sensor payloads and composite carbon airframes.",
    borrower: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    lender: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    principalAmount: 8.5,
    collateralAmount: 12.75,
    interestRateBps: 1050, // 10.5% APR
    durationDays: 180,
    createdAt: "2026-03-01T12:00:00Z",
    fundedAt: "2026-03-05T14:30:00Z",
    dueDate: "2026-09-01T14:30:00Z",
    repaidAmount: 1.2,
    status: "Funded",
    txHash: "0x4c2b9a78120e54d8931b2a7589c316742589e4719b6284351a92e85047b38152",
  }
];

export const MOCK_TRANSACTIONS: TransactionRecord[] = [
  {
    id: "tx-1",
    hash: "0x3e18a992bb1cf20272b1d3d63c483fefbfad2d9c12b77dbd7638069542a9b6c1",
    action: "Request Loan",
    loanId: 101,
    from: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    amountEth: 5.25, // Collateral deposited
    timestamp: "2026-03-25T10:30:00Z",
    status: "Confirmed",
    blockNumber: 482910,
  },
  {
    id: "tx-2",
    hash: "0x9f5a7b88d3e7f4c281e0186938a4d7159c9a7217db1386d4e5f7a216c85e492b",
    action: "Fund Loan",
    loanId: 102,
    from: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    to: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    amountEth: 6.0,
    timestamp: "2026-03-12T09:00:00Z",
    status: "Confirmed",
    blockNumber: 481150,
  },
  {
    id: "tx-3",
    hash: "0x1c8b32e85a49fb2193b2a8d38865bcfa4598d9317d698124efac0114b3e85290",
    action: "Repay Loan",
    loanId: 103,
    from: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    amountEth: 1.81,
    timestamp: "2026-03-18T11:20:00Z",
    status: "Confirmed",
    blockNumber: 481990,
  },
  {
    id: "tx-4",
    hash: "0x5d928c0b11a4e2873108d4e92a83617b4c8a2b5894172f84b65a39281c79a528",
    action: "Request Loan",
    loanId: 105,
    from: "0x976EA74026E72CD55542b0E057371def84446Ba1",
    amountEth: 7.2,
    timestamp: "2026-03-29T18:00:00Z",
    status: "Confirmed",
    blockNumber: 483420,
  },
  {
    id: "tx-5",
    hash: "0x4c2b9a78120e54d8931b2a7589c316742589e4719b6284351a92e85047b38152",
    action: "Fund Loan",
    loanId: 106,
    from: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    to: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    amountEth: 8.5,
    timestamp: "2026-03-05T14:30:00Z",
    status: "Confirmed",
    blockNumber: 480210,
  }
];

export const MOCK_PROTOCOL_STATS: ProtocolStats = {
  totalVolumeEth: 26.8,
  totalLoansCount: 6,
  activeLoansCount: 2, // Funded currently active
  totalFundedEth: 16.7,
  totalRepaidEth: 3.96,
  defaultedLoansCount: 1,
  averageApr: 9.95,
};

/**
 * Calculate expected repayment = principal + interest
 */
export function calculateExpectedRepayment(principal: number, interestRateBps: number, durationDays: number): number {
  const interest = (principal * (interestRateBps / 10000) * durationDays) / 365;
  return Number((principal + interest).toFixed(4));
}

/**
 * Format address to short hash representation (e.g. 0x7099...79C8)
 */
export function formatAddress(address?: string): string {
  if (!address) return "Unassigned";
  if (address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
