import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Landmark,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import { MOCK_LOANS, calculateExpectedRepayment, formatAddress } from '../data/mockData';
import { Loan } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';

export const LenderDashboardPage: React.FC = () => {
  const { isConnected, connectWallet } = useWallet();
  const { showToast } = useToast();

  const [liquidatingLoan, setLiquidatingLoan] = useState<Loan | null>(null);
  const [isSubmittingLiquidation, setIsSubmittingLiquidation] = useState(false);

  // In demo preview mode, showcase funded loans
  const fundedLoans = MOCK_LOANS.filter((l) => l.status === 'Funded' || l.status === 'Repaid' || l.status === 'Defaulted');

  const totalFunded = fundedLoans.reduce((acc, curr) => acc + curr.principalAmount, 0).toFixed(2);
  const activeCapital = fundedLoans.filter((l) => l.status === 'Funded').reduce((acc, curr) => acc + curr.principalAmount, 0).toFixed(2);
  const totalReturnsCollected = fundedLoans.reduce((acc, curr) => acc + curr.repaidAmount, 0).toFixed(2);
  const defaultedLoans = fundedLoans.filter((l) => l.status === 'Defaulted');

  const handleOpenLiquidate = (loan: Loan) => {
    if (!isConnected) {
      showToast('Wallet Connection Required', 'Please connect your wallet to execute collateral liquidation.', 'warning');
      connectWallet();
      return;
    }
    setLiquidatingLoan(loan);
  };

  const handleConfirmLiquidate = () => {
    if (!liquidatingLoan) return;
    setIsSubmittingLiquidation(true);

    setTimeout(() => {
      setIsSubmittingLiquidation(false);
      setLiquidatingLoan(null);
      showToast(
        'Collateral Liquidation Simulated',
        `Claimed ${liquidatingLoan.collateralAmount} ETH collateral for defaulted Loan #${liquidatingLoan.id}. Smart contract execution activates in Phase 2.`,
        'success'
      );
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Lender Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your funded capital, monitor yields, and manage collateral liquidation on defaulted loans.
          </p>
        </div>

        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md self-start sm:self-auto"
        >
          <span>Explore Open Loans</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
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
          subtitle="Positions eligible for collateral claim"
          icon={ShieldAlert}
        />
      </div>

      {/* Default Liquidation Banner if any defaulted loans exist */}
      {defaultedLoans.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Defaulted Loan Alert</h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
                Loan #{defaultedLoans[0].id} has passed its maturity due date without full repayment. As the lender, you are entitled to liquidate and seize the locked {defaultedLoans[0].collateralAmount} ETH collateral.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenLiquidate(defaultedLoans[0])}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-sm whitespace-nowrap"
          >
            Claim Collateral Escrow
          </button>
        </div>
      )}

      {/* Funded Investments Table */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Funded Investments</h3>
            <p className="text-xs text-slate-400 mt-0.5">Performance and repayment tracking for all funded loans</p>
          </div>
        </div>

        {fundedLoans.length === 0 ? (
          <EmptyState
            title="No Investments Active"
            description="Explore the marketplace to discover verified loan proposals with attractive risk-adjusted APRs."
            actionText="Go to Marketplace"
            onAction={() => {}}
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
                  <th className="py-4 px-6">Collateral Escrow</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {fundedLoans.map((loan) => {
                  const expectedYield = calculateExpectedRepayment(
                    loan.principalAmount,
                    loan.interestRateBps,
                    loan.durationDays
                  );

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
                      <td className="py-4 px-6 text-teal-400 font-medium">
                        {loan.collateralAmount} ETH
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

                          {loan.status === 'Defaulted' && (
                            <button
                              onClick={() => handleOpenLiquidate(loan)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                            >
                              Liquidate
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

      {/* Liquidation Confirmation Modal */}
      {liquidatingLoan && (
        <Modal
          isOpen={!!liquidatingLoan}
          onClose={() => setLiquidatingLoan(null)}
          title={`Seize Collateral - Loan #${liquidatingLoan.id}`}
          description="Liquidate borrower collateral due to term maturity default."
        >
          <div className="space-y-5">
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Defaulted Borrower:</span>
                <span className="font-mono text-white">{liquidatingLoan.borrower}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Unpaid Principal:</span>
                <span className="text-rose-400 font-mono">
                  {(liquidatingLoan.principalAmount - liquidatingLoan.repaidAmount).toFixed(2)} ETH
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Collateral Claimable:</span>
                <span className="text-emerald-400 font-mono text-base font-bold">
                  {liquidatingLoan.collateralAmount} ETH
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upon executing this transaction, the smart contract verifies that <code>block.timestamp &gt; dueDate</code>, sets loan status to <code>Liquidated</code>, and transfers the entire {liquidatingLoan.collateralAmount} ETH collateral directly to your lender address.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLiquidatingLoan(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLiquidate}
                disabled={isSubmittingLiquidation}
                className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-md disabled:opacity-50"
              >
                {isSubmittingLiquidation ? 'Executing...' : `Confirm & Claim ${liquidatingLoan.collateralAmount} ETH`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
