import {
  Contract,
  BrowserProvider,
  JsonRpcProvider,
  Signer,
  Provider,
  formatEther,
  parseEther,
  EventLog,
} from 'ethers';
import {
  BLOCKLOAN_CONTRACT_ADDRESS,
  BLOCKLOAN_ABI,
  BLOCKLOAN_RPC_URL,
} from '../contracts/contractConfig';
import { Loan, LoanStatus, TransactionRecord, TransactionAction } from '../types';
import { apiService, BackendLoanResponse } from './apiService';

/**
 * Get a read-only contract instance.
 * Prefers browser provider, falls back to local Hardhat RPC (127.0.0.1:8545).
 */
export function getReadOnlyContract(provider?: Provider): Contract {
  let activeProvider: Provider;
  if (provider) {
    activeProvider = provider;
  } else if (typeof window !== 'undefined' && (window as unknown as { ethereum?: unknown }).ethereum) {
    activeProvider = new BrowserProvider((window as unknown as { ethereum?: never }).ethereum as never);
  } else {
    activeProvider = new JsonRpcProvider(BLOCKLOAN_RPC_URL);
  }
  return new Contract(BLOCKLOAN_CONTRACT_ADDRESS, BLOCKLOAN_ABI, activeProvider);
}

/**
 * Get a writeable contract instance attached to the active user's Signer.
 */
export function getSignerContract(signer: Signer): Contract {
  return new Contract(BLOCKLOAN_CONTRACT_ADDRESS, BLOCKLOAN_ABI, signer);
}

/**
 * Map raw contract uint8 status to LoanStatus string
 */
export function mapLoanStatus(statusNum: number): LoanStatus {
  switch (Number(statusNum)) {
    case 0:
      return 'OPEN';
    case 1:
      return 'ACTIVE';
    case 2:
      return 'COMPLETED';
    case 3:
      return 'DEFAULTED';
    case 4:
      return 'CANCELLED';
    default:
      return 'OPEN';
  }
}

/**
 * Metadata caching helpers for user-provided loan titles and descriptions
 */
export function saveLoanMetadata(loanId: number, data: { title: string; purpose: string }) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`blockloan_meta_${loanId}`, JSON.stringify(data));
    }
  } catch {
    // LocalStorage quota or unavailable
  }
}

export function getLoanMetadata(loanId: number): { title?: string; purpose?: string } | null {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(`blockloan_meta_${loanId}`);
      return raw ? JSON.parse(raw) : null;
    }
  } catch {
    // Ignore error
  }
  return null;
}

/**
 * Transform raw contract struct into typed frontend Loan object
 */
export function parseContractLoan(
  rawLoan: {
    id: bigint;
    borrower: string;
    lender: string;
    principalAmount: bigint;
    interestRateBps: bigint;
    durationSeconds: bigint;
    createdAt: bigint;
    fundedAt: bigint;
    repaymentDeadline: bigint;
    totalDue: bigint;
    totalRepaid: bigint;
    status: number | bigint;
  },
  backendMeta?: BackendLoanResponse | null
): Loan {
  const statusNum = Number(rawLoan.status);
  const durationSec = Number(rawLoan.durationSeconds);
  const durationDays = Math.max(1, Math.round(durationSec / 86400));
  const principalEth = Number(formatEther(rawLoan.principalAmount));
  const totalRepaidEth = Number(formatEther(rawLoan.totalRepaid));
  const idNum = Number(rawLoan.id);

  const localMeta = getLoanMetadata(idNum);
  const title =
    backendMeta?.title ||
    localMeta?.title ||
    `Loan Proposal #${idNum.toString()}`;
  const purpose =
    backendMeta?.purpose ||
    localMeta?.purpose ||
    `Peer credit facility for ${principalEth} ETH at ${(Number(rawLoan.interestRateBps) / 100).toFixed(1)}% APR (${durationDays} days)`;

  return {
    id: idNum,
    title: title,
    purpose: purpose,
    borrower: rawLoan.borrower,
    lender: rawLoan.lender !== '0x0000000000000000000000000000000000000000' ? rawLoan.lender : undefined,
    principalAmount: principalEth,
    collateralAmount: 0,
    interestRateBps: Number(rawLoan.interestRateBps),
    durationDays: durationDays,
    createdAt: new Date(Number(rawLoan.createdAt) * 1000).toISOString(),
    fundedAt: rawLoan.fundedAt > 0n ? new Date(Number(rawLoan.fundedAt) * 1000).toISOString() : undefined,
    dueDate: rawLoan.repaymentDeadline > 0n ? new Date(Number(rawLoan.repaymentDeadline) * 1000).toISOString() : undefined,
    repaidAmount: totalRepaidEth,
    status: mapLoanStatus(statusNum),
    principalWei: rawLoan.principalAmount,
    totalDueWei: rawLoan.totalDue,
    totalRepaidWei: rawLoan.totalRepaid,
    durationSeconds: durationSec,
  };
}

/**
 * Retrieve all loans from on-chain contract state reconciled with backend metadata
 */
export async function fetchAllLoansOnChain(provider?: Provider): Promise<Loan[]> {
  try {
    const contract = getReadOnlyContract(provider);
    const countBigInt = await contract.getLoanCount();
    const count = Number(countBigInt);

    if (count === 0) return [];

    // Concurrently fetch metadata from FastAPI backend indexer
    const backendLoans = await apiService.getLoans().catch(() => null);
    const backendMap = new Map<number, BackendLoanResponse>();
    if (backendLoans) {
      for (const bLoan of backendLoans) {
        backendMap.set(bLoan.id, bLoan);
      }
    }

    const promises: Promise<Loan>[] = [];
    for (let i = 1; i <= count; i++) {
      promises.push(
        contract.getLoan(i).then((raw: {
          id: bigint;
          borrower: string;
          lender: string;
          principalAmount: bigint;
          interestRateBps: bigint;
          durationSeconds: bigint;
          createdAt: bigint;
          fundedAt: bigint;
          repaymentDeadline: bigint;
          totalDue: bigint;
          totalRepaid: bigint;
          status: number | bigint;
        }) => parseContractLoan(raw, backendMap.get(i)))
      );
    }

    const loans = await Promise.all(promises);
    return loans;
  } catch (error) {
    console.error('Failed to fetch loans from smart contract:', error);
    return [];
  }
}

/**
 * Fetch a specific loan by ID including remaining debt calculation
 */
export async function fetchLoanByIdOnChain(
  loanId: number,
  provider?: Provider
): Promise<{ loan: Loan; remainingDueEth: number } | null> {
  try {
    const contract = getReadOnlyContract(provider);
    const [rawLoan, backendMeta] = await Promise.all([
      contract.getLoan(loanId),
      apiService.getLoanById(loanId).catch(() => null),
    ]);
    const loan = parseContractLoan(rawLoan, backendMeta);

    let remainingDueEth = 0;
    if (loan.status === 'ACTIVE') {
      const remainingWei = await contract.getRepaymentAmount(loanId);
      remainingDueEth = Number(formatEther(remainingWei));
    }

    return { loan, remainingDueEth };
  } catch (error) {
    console.error(`Failed to fetch loan #${loanId} on-chain:`, error);
    return null;
  }
}

/**
 * Fetch on-chain event logs for transactions history
 */
export async function fetchContractEvents(
  targetLoanId?: number,
  provider?: Provider
): Promise<TransactionRecord[]> {
  try {
    const contract = getReadOnlyContract(provider);

    const [createdFilter, fundedFilter, repaidFilter, completedFilter, defaultedFilter] = [
      contract.filters.LoanCreated(),
      contract.filters.LoanFunded(),
      contract.filters.RepaymentMade(),
      contract.filters.LoanCompleted(),
      contract.filters.LoanDefaulted(),
    ];

    const [createdLogs, fundedLogs, repaidLogs, completedLogs, defaultedLogs] = await Promise.all([
      contract.queryFilter(createdFilter, 0),
      contract.queryFilter(fundedFilter, 0),
      contract.queryFilter(repaidFilter, 0),
      contract.queryFilter(completedFilter, 0),
      contract.queryFilter(defaultedFilter, 0),
    ]);

    const records: TransactionRecord[] = [];

    // Helper for event extraction
    const processLogs = (
      logs: Array<unknown>,
      action: TransactionAction,
      amountExtractor: (args: unknown) => number
    ) => {
      for (const raw of logs) {
        const log = raw as EventLog;
        if (!log.args) continue;
        const loanId = Number(log.args[0]);
        if (targetLoanId && loanId !== targetLoanId) continue;

        records.push({
          id: `${log.transactionHash}-${log.index}`,
          hash: log.transactionHash,
          action: action,
          loanId: loanId,
          from: log.args[1] ? String(log.args[1]) : BLOCKLOAN_CONTRACT_ADDRESS,
          amountEth: amountExtractor(log.args),
          timestamp: new Date().toISOString(),
          status: 'Confirmed',
          blockNumber: log.blockNumber,
        });
      }
    };

    processLogs(createdLogs, 'Request Loan', (args: unknown) => {
      const a = args as Array<bigint>;
      return a[2] ? Number(formatEther(a[2])) : 0;
    });

    processLogs(fundedLogs, 'Fund Loan', (args: unknown) => {
      const a = args as Array<bigint>;
      return a[2] ? Number(formatEther(a[2])) : 0;
    });

    processLogs(repaidLogs, 'Repay Loan', (args: unknown) => {
      const a = args as Array<bigint>;
      return a[2] ? Number(formatEther(a[2])) : 0;
    });

    processLogs(completedLogs, 'Repay Loan', (args: unknown) => {
      const a = args as Array<bigint>;
      return a[3] ? Number(formatEther(a[3])) : 0;
    });

    processLogs(defaultedLogs, 'Liquidate Collateral', (args: unknown) => {
      const a = args as Array<bigint>;
      return a[3] ? Number(formatEther(a[3])) : 0;
    });

    // Sort newest block first
    return records.sort((a, b) => b.blockNumber - a.blockNumber);
  } catch (error) {
    console.error('Failed to query contract event logs:', error);
    return [];
  }
}

/**
 * Execute createLoan transaction on-chain
 */
export async function createLoanOnChain(
  signer: Signer,
  principalEth: string,
  interestRateBps: number,
  durationSeconds: number
): Promise<{ txHash: string; loanId: number }> {
  const contract = getSignerContract(signer);
  const principalWei = parseEther(principalEth);

  const tx = await contract.createLoan(principalWei, BigInt(interestRateBps), BigInt(durationSeconds));
  const receipt = await tx.wait();

  // Find LoanCreated event to get assigned ID
  let assignedLoanId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === 'LoanCreated') {
        assignedLoanId = Number(parsed.args[0]);
        break;
      }
    } catch {
      // Not our event
    }
  }

  return {
    txHash: receipt.hash,
    loanId: assignedLoanId,
  };
}

/**
 * Execute fundLoan transaction on-chain
 */
export async function fundLoanOnChain(
  signer: Signer,
  loanId: number,
  principalEth: number | string
): Promise<{ txHash: string }> {
  const contract = getSignerContract(signer);
  const principalWei = parseEther(principalEth.toString());

  const tx = await contract.fundLoan(loanId, { value: principalWei });
  const receipt = await tx.wait();

  return { txHash: receipt.hash };
}

/**
 * Execute repayLoan transaction on-chain
 */
export async function repayLoanOnChain(
  signer: Signer,
  loanId: number,
  repayEth: number | string
): Promise<{ txHash: string }> {
  const contract = getSignerContract(signer);
  const repayWei = parseEther(repayEth.toString());

  const tx = await contract.repayLoan(loanId, { value: repayWei });
  const receipt = await tx.wait();

  return { txHash: receipt.hash };
}

/**
 * Execute markDefaulted transaction on-chain
 */
export async function markDefaultedOnChain(
  signer: Signer,
  loanId: number
): Promise<{ txHash: string }> {
  const contract = getSignerContract(signer);
  const tx = await contract.markDefaulted(loanId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

/**
 * Parse contract revert and MetaMask errors into user-friendly messages
 */
export function parseContractError(err: unknown): string {
  if (!err) return 'Unknown error occurred.';

  const errorObj = err as {
    code?: string | number;
    message?: string;
    reason?: string;
    data?: unknown;
    info?: { error?: { message?: string } };
  };

  const message = errorObj.message || String(err);

  // Wallet disconnection
  if (message.includes('Wallet not connected')) {
    return 'Wallet not connected. Please connect your Web3 wallet first.';
  }

  // Network issues
  if (message.includes('NETWORK_ERROR') || message.includes('network error') || message.includes('could not detect network')) {
    return 'Network connection issue with local RPC (http://127.0.0.1:8545). Please verify Hardhat node is running.';
  }

  // Nonce issues
  if (message.includes('nonce') || message.includes('NONCE_EXPIRED')) {
    return 'Transaction nonce conflict. Please reset your MetaMask account nonce or retry.';
  }

  // User rejection
  if (
    errorObj.code === 'ACTION_REJECTED' ||
    errorObj.code === 4001 ||
    message.includes('user rejected') ||
    message.includes('User denied transaction signature')
  ) {
    return 'Transaction rejected by user in MetaMask.';
  }

  // Insufficient funds
  if (message.includes('insufficient funds') || errorObj.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient test ETH balance in your wallet to cover value and gas fees.';
  }

  // Custom Solidity errors
  if (message.includes('BorrowerCannotFund')) {
    return 'Borrower cannot fund their own loan. Please switch to a separate lender account.';
  }
  if (message.includes('OnlyBorrowerCanRepay')) {
    return 'Only the borrower who initiated this loan is authorized to submit repayments.';
  }
  if (message.includes('DeadlinePassed')) {
    return 'The loan repayment deadline has expired. This loan is in default.';
  }
  if (message.includes('DeadlineNotPassed')) {
    return 'Cannot default loan: The repayment deadline has not yet arrived.';
  }
  if (message.includes('RepaymentExceedsBalance')) {
    return 'Repayment amount exceeds the outstanding loan balance due.';
  }
  if (message.includes('ZeroPaymentNotAllowed')) {
    return 'Repayment value must be greater than zero.';
  }
  if (message.includes('InvalidLoanStatus')) {
    return 'Action not permitted for the current status of this loan.';
  }
  if (message.includes('IncorrectFundingAmount')) {
    return 'Funding amount sent does not match the exact loan principal required.';
  }
  if (message.includes('LoanNotFound')) {
    return 'Target loan ID does not exist on-chain.';
  }

  if (errorObj.reason) {
    return errorObj.reason;
  }

  if (errorObj.info?.error?.message) {
    return errorObj.info.error.message;
  }

  return message.length > 120 ? `${message.substring(0, 117)}...` : message;
}
