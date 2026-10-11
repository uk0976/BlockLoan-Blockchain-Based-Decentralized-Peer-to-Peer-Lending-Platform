import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Landmark,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  AlertTriangle,
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
  markDefaultedOnChain,
  parseContractError,
} from '../services/contractService';

export const LenderDashboardPage: React.FC = () => {
  const { address, isConnected, connectWallet, getSigner, isWrongNetwork, switchToLocalhost } = useWallet();
  const { showToast } = useToast();

  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isContractData, setIsContractData] = useState<boolean>(false);

  const [defaultingLoan, setDefaultingLoan] = useState<Loan | null>(null);
  const [isSubmittingDefault, setIsSubmittingDefault] = useState(false);

  const loadLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const onChainLoans = await fetchAllLoansOnChain();
      setAllLoans(onChainLoans || []);
      setIsContractData(true);
    } catch (err) {
      console.error('Failed to fetch loans on-chain for lender dashboard:', err);
      setAllLoans([]);
      setIsContractData(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  // Filter loans funded strictly by the active lender wallet
  const userFundedLoans = isConnected && address
    ? allLoans.filter((l) => l.lender && l.lender.toLowerCase() === address.toLowerCase())
    : [];

  const displayLoans = userFundedLoans;

  const totalFunded = displayLoans.reduce((acc, curr) => acc + curr.principalAmount, 0).toFixed(2);
  const activeCapital = displayLoans
    .filter((l) => l.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr.principalAmount, 0)
    .toFixed(2);
  const totalReturnsCollected = displayLoans.reduce((acc, curr) => acc + curr.repaidAmount, 0).toFixed(2);
  const defaultedLoans = displayLoans.filter((l) => l.status === 'DEFAULTED');

  const handleOpenMarkDefault = (loan: Loan) => {
    if (!isConnected) {
      showToast('Wallet Connection Required', 'Please connect your wallet to mark default.', 'warning');
      connectWallet();
      return;
    }

    if (isWrongNetwork) {
      showToast('Wrong Network', 'Please switch your wallet to Hardhat Localhost (Chain ID: 31337).', 'error');
      switchToLocalhost();
      return;
    }

    setDefaultingLoan(loan);
  };

  const handleConfirmDefault = async () => {
    if (!defaultingLoan) return;

    try {
      setIsSubmittingDefault(true);
      const signer = await getSigner();

      const result = await markDefaultedOnChain(signer, defaultingLoan.id);
      showToast(
        'Loan Marked as Defaulted',
        `Loan #${defaultingLoan.id} recorded as defaulted on-chain. Tx: ${result.txHash.substring(0, 10)}...`,
        'success'
      );
      setDefaultingLoan(null);
      await loadLoans();
    } catch (err) {
      const errMsg = parseContractError(err);
      showToast('Action Failed', errMsg, 'error');
    } finally {
      setIsSubmittingDefault(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Lender Dashboard</h1>
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
            Track your funded capital, monitor incoming repayments, and manage position default status.
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
            to="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md self-start sm:self-auto"
          >
            <span>Explore Open Loans</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Capital Funded"
          value={`${totalFunded} ETH`}
          subtitle="Cumulative principal allocated"
          icon={Landmark}
        />
        <StatCard
          title="Active Principal"
          value={`${activeCapital} ETH`}
          subtitle="Deployed in ongoing borrower contracts"
          icon={Clock}
        />
        <StatCard
          title="Returns Collected"
          value={`${totalReturnsCollected} ETH`}
          subtitle="Principal plus yield received to date"
          icon={TrendingUp}
          badge="Yield Positive"
        />
        <StatCard
          title="Defaulted Positions"
          value={defaultedLoans.length}
          subtitle="Maturity elapsed without full repayment"
          icon={ShieldAlert}
        />
      </div>

      {/* Default Alert Banner if any defaulted loans exist */}
      {defaultedLoans.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Defaulted Loan Notice</h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
                Loan #{defaultedLoans[0].id} has passed its maturity due date without full repayment. Normal repayments are permanently disabled, and the default is formally immutabilized on-chain.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Funded Investments Table */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Funded Investments</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isConnected && address
                ? `Investments funded by ${formatAddress(address)}`
                : 'Performance and repayment tracking for all funded loans'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            <p className="text-sm text-slate-400">Loading investment records from smart contract...</p>
          </div>
        ) : !isConnected ? (
          <EmptyState
            title="Wallet Connection Required"
            description="Please connect your MetaMask wallet to view the loans you have funded and monitor repayments."
            actionText="Connect Wallet"
            onAction={connectWallet}
          />
        ) : displayLoans.length === 0 ? (
          <EmptyState
            title="No Active Investments"
            description="Explore the marketplace to discover verified loan proposals with attractive risk-adjusted APRs."
            actionText="Browse Marketplace"
            onAction={() => {
              window.location.href = '/marketplace';
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-950 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">ID & Proposal</th>
                  <th className="py-4 px-6">Funded Principal</th>
                  <th className="py-4 px-6">Fixed APR</th>
                  <th className="py-4 px-6">Repaid to Date</th>
                  <th className="py-4 px-6">Term</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {displayLoans.map((loan) => {
                  const expectedYield = calculateExpectedRepayment(
                    loan.principalAmount,
                    loan.interestRateBps,
                    loan.durationDays
                  );
                  const isActive = loan.status === 'ACTIVE';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{loan.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">
                          Borrower: {formatAddress(loan.borrower)}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-white">{loan.principalAmount} ETH</td>
                      <td className="py-4 px-6 text-emerald-400 font-semibold">
                        {(loan.interestRateBps / 100).toFixed(1)}%
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-teal-300 font-semibold">{loan.repaidAmount}</span>
                        <span className="text-slate-500"> / {expectedYield} ETH</span>
                      </td>
                      <td className="py-4 px-6">{loan.durationDays} Days</td>
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
                              onClick={() => handleOpenMarkDefault(loan)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 hover:border-rose-500/50 border border-slate-700 transition-colors"
                              title="Evaluate and mark default if repayment deadline expired"
                            >
                              Check Default
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

      {/* Default Confirmation Modal */}
      {defaultingLoan && (
        <Modal
          isOpen={!!defaultingLoan}
          onClose={() => setDefaultingLoan(null)}
          title={`Evaluate Default - Loan #${defaultingLoan.id}`}
          description="Check and trigger smart contract default if the repayment deadline has passed."
        >
          <div className="space-y-5">
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Borrower Address:</span>
                <span className="font-mono text-white break-all">{defaultingLoan.borrower}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Principal Funded:</span>
                <span className="text-white font-mono">{defaultingLoan.principalAmount} ETH</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Repaid to Date:</span>
                <span className="text-teal-400 font-mono">{defaultingLoan.repaidAmount} ETH</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              The smart contract verifies that <code>block.timestamp &gt; repaymentDeadline</code>. If the deadline has expired without full settlement, it permanently transitions the loan status to <code>DEFAULTED</code> and emits an on-chain <code>LoanDefaulted</code> event.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDefaultingLoan(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDefault}
                disabled={isSubmittingDefault}
                className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingDefault ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing on Contract...</span>
                  </>
                ) : (
                  `Execute Default Assertion`
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
