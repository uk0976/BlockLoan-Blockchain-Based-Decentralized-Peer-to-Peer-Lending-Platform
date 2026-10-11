import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Radio,
} from 'lucide-react';
import { calculateExpectedRepayment, formatAddress } from '../data/mockData';
import { Loan } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';
import {
  fetchAllLoansOnChain,
  fetchLoanByIdOnChain,
  repayLoanOnChain,
  parseContractError,
} from '../services/contractService';

export const BorrowerDashboardPage: React.FC = () => {
  const { address, isConnected, connectWallet, getSigner, refreshBalance, isWrongNetwork, switchToLocalhost } =
    useWallet();
  const { showToast } = useToast();

  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isContractData, setIsContractData] = useState<boolean>(false);

  const [repayingLoan, setRepayingLoan] = useState<Loan | null>(null);
  const [remainingDebtEth, setRemainingDebtEth] = useState<number>(0);
  const [repayAmountInput, setRepayAmountInput] = useState<string>('');
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);

  // Load loans
  const loadLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const onChainLoans = await fetchAllLoansOnChain();
      setAllLoans(onChainLoans || []);
      setIsContractData(true);
    } catch (err) {
      console.error('Failed to fetch on-chain loans for borrower dashboard:', err);
      setAllLoans([]);
      setIsContractData(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  // Filter loans belonging strictly to the active borrower wallet
  const userLoans = isConnected && address
    ? allLoans.filter((l) => l.borrower.toLowerCase() === address.toLowerCase())
    : [];

  const displayLoans = userLoans;

  const totalBorrowed = displayLoans.reduce((acc, curr) => acc + curr.principalAmount, 0).toFixed(2);
  const totalRepaid = displayLoans.reduce((acc, curr) => acc + curr.repaidAmount, 0).toFixed(2);
  const activeDebts = displayLoans.filter((l) => l.status === 'ACTIVE');
  const completedLoans = displayLoans.filter((l) => l.status === 'COMPLETED');

  const handleOpenRepay = async (loan: Loan) => {
    if (!isConnected) {
      showToast('Wallet Required', 'Connect your wallet to repay this loan.', 'warning');
      connectWallet();
      return;
    }

    if (isWrongNetwork) {
      showToast('Wrong Network', 'Please switch your wallet to Hardhat Localhost (Chain ID: 31337).', 'error');
      switchToLocalhost();
      return;
    }

    // Query on-chain remaining debt calculation
    try {
      const details = await fetchLoanByIdOnChain(loan.id);
      const remaining = details ? details.remainingDueEth : Math.max(0, loan.principalAmount * 1.1 - loan.repaidAmount);
      setRemainingDebtEth(remaining);
      setRepayAmountInput(remaining.toFixed(4));
    } catch {
      const totalExpected = calculateExpectedRepayment(loan.principalAmount, loan.interestRateBps, loan.durationDays);
      const remaining = Math.max(0, totalExpected - loan.repaidAmount);
      setRemainingDebtEth(remaining);
      setRepayAmountInput(remaining.toFixed(4));
    }

    setRepayingLoan(loan);
  };

  const handleConfirmRepay = async () => {
    if (!repayingLoan) return;

    const amount = parseFloat(repayAmountInput);
    if (!amount || amount <= 0) {
      showToast('Invalid Amount', 'Repayment amount must be greater than zero.', 'error');
      return;
    }

    try {
      setIsSubmittingRepay(true);
      const signer = await getSigner();

      const result = await repayLoanOnChain(signer, repayingLoan.id, repayAmountInput);

      await refreshBalance();
      showToast(
        'Repayment Processed On-Chain',
        `Transferred ${repayAmountInput} ETH to lender! Tx: ${result.txHash.substring(0, 10)}...`,
        'success'
      );
      setRepayingLoan(null);
      await loadLoans();
    } catch (err) {
      const errMsg = parseContractError(err);
      showToast('Repayment Failed', errMsg, 'error');
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Borrower Portal</h1>
            {isContractData ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>On-Chain Live State</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span>Demo Fallback Mode</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage your loan requests, track debt maturity, monitor outstanding balance, and execute repayments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadLoans()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-navy-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            title="Refresh On-Chain Loans"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/borrower/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Request New Loan</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Borrowed"
          value={`${totalBorrowed} ETH`}
          subtitle="Cumulative principal across all terms"
          icon={Coins}
        />
        <StatCard
          title="Total Repaid"
          value={`${totalRepaid} ETH`}
          subtitle="Principal plus accrued interest settled"
          icon={CheckCircle}
          badge="Good Standing"
        />
        <StatCard
          title="Active Debts"
          value={activeDebts.length}
          subtitle="Funded loans currently accruing interest"
          icon={Clock}
        />
        <StatCard
          title="Completed Loans"
          value={completedLoans.length}
          subtitle="Successfully discharged debt obligations"
          icon={ShieldCheck}
        />
      </div>

      {/* Urgent Repayment Alert if any debt is active */}
      {activeDebts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Active Debt Due Attention</h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
                You have {activeDebts.length} active funded loan(s). Settle repayments before the maturity deadline to maintain a spotless on-chain credit history.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenRepay(activeDebts[0])}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm whitespace-nowrap"
          >
            Repay Nearest Due Loan
          </button>
        </div>
      )}

      {/* Loans Table */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">My Loan Portfolio</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isConnected && address
                ? `Loans initiated by ${formatAddress(address)}`
                : 'All loan requests in protocol portfolio'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            <p className="text-sm text-slate-400">Loading loan records from smart contract...</p>
          </div>
        ) : !isConnected ? (
          <EmptyState
            title="Wallet Connection Required"
            description="Please connect your MetaMask wallet to view your borrowed loans, repayment schedules, and outstanding balances."
            actionText="Connect Wallet"
            onAction={connectWallet}
          />
        ) : displayLoans.length === 0 ? (
          <EmptyState
            title="No Loans Requested Yet"
            description="You have not submitted any loan proposals with this connected wallet address."
            actionText="Request a Loan"
            onAction={() => {
              window.location.href = '/borrower/create';
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-950 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">ID & Title</th>
                  <th className="py-4 px-6">Principal</th>
                  <th className="py-4 px-6">Repaid to Date</th>
                  <th className="py-4 px-6">Lender</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {displayLoans.map((loan) => {
                  const isActive = loan.status === 'ACTIVE';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{loan.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          #{loan.id} &bull; Term: {loan.durationDays}d @ {(loan.interestRateBps / 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-white">{loan.principalAmount} ETH</td>
                      <td className="py-4 px-6">
                        <span className="text-teal-300 font-semibold">{loan.repaidAmount} ETH</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">
                        {loan.lender ? formatAddress(loan.lender) : <span className="text-slate-500 italic">Awaiting Lender</span>}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={loan.status} size="sm" />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/loans/${loan.id}`}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-300 transition-colors"
                          >
                            Details
                          </Link>

                          {isActive && (
                            <button
                              onClick={() => handleOpenRepay(loan)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
                            >
                              Repay Debt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Repay Modal */}
      {repayingLoan && (
        <Modal
          isOpen={!!repayingLoan}
          onClose={() => setRepayingLoan(null)}
          title={`Execute Repayment - Loan #${repayingLoan.id}`}
          description="Send payment back to the lender wallet via the BlockLoan smart contract."
        >
          <div className="space-y-5">
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Lender Address:</span>
                <span className="font-mono text-white break-all">{formatAddress(repayingLoan.lender)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Original Principal:</span>
                <span className="text-white font-mono">{repayingLoan.principalAmount} ETH</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Total Repaid to Date:</span>
                <span className="text-teal-300 font-mono">{repayingLoan.repaidAmount} ETH</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-800">
                <span className="text-slate-300">Outstanding Balance Due:</span>
                <span className="text-emerald-400 font-mono text-base font-bold">
                  {remainingDebtEth.toFixed(4)} ETH
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Payment Amount (ETH)
                </label>
                <button
                  type="button"
                  onClick={() => setRepayAmountInput(remainingDebtEth.toFixed(4))}
                  className="text-xs font-semibold text-teal-400 hover:underline"
                >
                  Pay Full Balance
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.0001"
                  max={remainingDebtEth}
                  value={repayAmountInput}
                  onChange={(e) => setRepayAmountInput(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  ETH
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRepayingLoan(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRepay}
                disabled={isSubmittingRepay}
                className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingRepay ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transacting on Blockchain...</span>
                  </>
                ) : (
                  `Confirm & Repay ${repayAmountInput} ETH`
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
