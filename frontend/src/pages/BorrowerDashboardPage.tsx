import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { MOCK_LOANS, calculateExpectedRepayment, formatAddress } from '../data/mockData';
import { Loan } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';

export const BorrowerDashboardPage: React.FC = () => {
  const { isConnected, connectWallet } = useWallet();
  const { showToast } = useToast();

  const [repayingLoan, setRepayingLoan] = useState<Loan | null>(null);
  const [repayAmountInput, setRepayAmountInput] = useState<string>('');
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);

  // In demo / connected mode, filter loans belonging to the user or show relevant borrower sample loans
  const borrowerLoans = MOCK_LOANS;

  const totalBorrowed = borrowerLoans.reduce((acc, curr) => acc + curr.principalAmount, 0).toFixed(2);
  const totalRepaid = borrowerLoans.reduce((acc, curr) => acc + curr.repaidAmount, 0).toFixed(2);
  const activeDebts = borrowerLoans.filter((l) => l.status === 'Funded');
  const completedLoans = borrowerLoans.filter((l) => l.status === 'Repaid');

  const handleOpenRepay = (loan: Loan) => {
    if (!isConnected) {
      showToast('Wallet Required', 'Connect your wallet to repay this loan.', 'warning');
      connectWallet();
      return;
    }
    const totalExpected = calculateExpectedRepayment(loan.principalAmount, loan.interestRateBps, loan.durationDays);
    const remaining = Math.max(0, totalExpected - loan.repaidAmount).toFixed(4);
    setRepayingLoan(loan);
    setRepayAmountInput(remaining);
  };

  const handleConfirmRepay = () => {
    if (!repayingLoan) return;
    setIsSubmittingRepay(true);

    setTimeout(() => {
      setIsSubmittingRepay(false);
      setRepayingLoan(null);
      showToast(
        'Repayment Simulated',
        `Successfully simulated repayment of ${repayAmountInput} ETH for Loan #${repayingLoan.id}. Smart contract unlocks collateral upon full settlement.`,
        'success'
      );
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Borrower Portal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your loan requests, track debt maturity, deposit collateral, and execute repayments.
          </p>
        </div>

        <Link
          to="/borrower/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Request New Loan</span>
        </Link>
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
                You have {activeDebts.length} active funded loan(s). Ensure full repayment prior to maturity dates to release your locked collateral and maintain clean credit reputation.
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
            <p className="text-xs text-slate-400 mt-0.5">All loan requests initiated by this wallet</p>
          </div>
        </div>

        {borrowerLoans.length === 0 ? (
          <EmptyState
            title="No Loans Requested Yet"
            description="Create your first decentralized loan request by locking testnet ETH collateral."
            actionText="Request a Loan"
            onAction={() => {}}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-950 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">ID & Title</th>
                  <th className="py-4 px-6">Principal</th>
                  <th className="py-4 px-6">Repaid / Total</th>
                  <th className="py-4 px-6">Locked Collateral</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {borrowerLoans.map((loan) => {
                  const expectedTotal = calculateExpectedRepayment(
                    loan.principalAmount,
                    loan.interestRateBps,
                    loan.durationDays
                  );

                  return (
                    <tr key={loan.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{loan.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">#{loan.id} &bull; Term: {loan.durationDays}d @ {(loan.interestRateBps / 100).toFixed(1)}%</div>
                      </td>
                      <td className="py-4 px-6 font-bold text-white">{loan.principalAmount} ETH</td>
                      <td className="py-4 px-6">
                        <span className="text-teal-300 font-semibold">{loan.repaidAmount}</span>
                        <span className="text-slate-500"> / {expectedTotal} ETH</span>
                      </td>
                      <td className="py-4 px-6 text-teal-400 font-medium">{loan.collateralAmount} ETH</td>
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

                          {loan.status === 'Funded' && (
                            <button
                              onClick={() => handleOpenRepay(loan)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
                            >
                              Repay
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
          description="Send payment back to the lender smart contract escrow."
        >
          <div className="space-y-5">
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Lender Address:</span>
                <span className="font-mono text-white">{formatAddress(repayingLoan.lender)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Original Principal:</span>
                <span className="text-white font-mono">{repayingLoan.principalAmount} ETH</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Total Repaid to Date:</span>
                <span className="text-teal-300 font-mono">{repayingLoan.repaidAmount} ETH</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Remaining Balance Due:</span>
                <span className="text-emerald-400 font-mono">
                  {(calculateExpectedRepayment(repayingLoan.principalAmount, repayingLoan.interestRateBps, repayingLoan.durationDays) - repayingLoan.repaidAmount).toFixed(4)} ETH
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Repayment Amount (ETH)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
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
                className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md disabled:opacity-50"
              >
                {isSubmittingRepay ? 'Sending Tx...' : `Confirm & Repay ${repayAmountInput} ETH`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
