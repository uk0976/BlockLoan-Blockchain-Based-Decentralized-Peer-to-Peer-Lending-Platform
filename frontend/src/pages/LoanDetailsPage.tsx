import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Shield,
  Coins,
  Percent,
  Clock,
  Calendar,
  Layers,
} from 'lucide-react';
import { MOCK_LOANS, MOCK_TRANSACTIONS, calculateExpectedRepayment, formatAddress } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';

export const LoanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const loanId = parseInt(id || '101', 10);
  const { isConnected, connectWallet } = useWallet();
  const { showToast } = useToast();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);

  const loan = MOCK_LOANS.find((l) => l.id === loanId) || MOCK_LOANS[0];
  const relatedTxs = MOCK_TRANSACTIONS.filter((tx) => tx.loanId === loan.id);

  const expectedRepayment = calculateExpectedRepayment(
    loan.principalAmount,
    loan.interestRateBps,
    loan.durationDays
  );
  const outstandingBalance = Math.max(0, expectedRepayment - loan.repaidAmount).toFixed(4);
  const collateralRatio = ((loan.collateralAmount / loan.principalAmount) * 100).toFixed(0);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to Clipboard', text, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getTimelineSteps = () => {
    const isFunded = loan.status !== 'Requested' && loan.status !== 'Cancelled';
    const isSettled = loan.status === 'Repaid';
    const isDefaulted = loan.status === 'Defaulted';
    const isLiquidated = loan.status === 'Liquidated';

    return [
      {
        title: 'Loan Requested',
        date: new Date(loan.createdAt).toLocaleDateString(),
        done: true,
        desc: `Borrower locked ${loan.collateralAmount} ETH collateral in contract escrow.`,
      },
      {
        title: 'Peer Funded',
        date: loan.fundedAt ? new Date(loan.fundedAt).toLocaleDateString() : 'Awaiting Peer Funding',
        done: isFunded,
        desc: loan.lender ? `Funded by ${formatAddress(loan.lender)}. Term started.` : 'Available in open marketplace.',
      },
      {
        title: isDefaulted || isLiquidated ? 'Default / Liquidation' : 'Full Settlement',
        date: loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'Due Upon Funding',
        done: isSettled || isLiquidated,
        desc: isSettled
          ? 'Borrower repaid full debt; collateral released back to borrower.'
          : isDefaulted
          ? 'Term expired without full repayment; collateral open for lender liquidation.'
          : isLiquidated
          ? 'Lender successfully seized collateral escrow.'
          : 'Maturity target for complete loan repayment.',
      },
    ];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-teal-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Loan Marketplace</span>
        </Link>
      </div>

      {/* Main Loan Header Card */}
      <div className="bg-navy-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-teal-400 px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/20">
                Loan Contract #{loan.id}
              </span>
              <StatusBadge status={loan.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{loan.title}</h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{loan.purpose}</p>
          </div>

          {/* Action Trigger */}
          <div className="flex-shrink-0">
            {loan.status === 'Requested' && (
              <button
                onClick={() => {
                  if (!isConnected) {
                    showToast('Connect Wallet', 'Please connect your Web3 wallet to fund this loan.', 'warning');
                    connectWallet();
                  } else {
                    setActionModalOpen(true);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md"
              >
                Fund This Loan ({loan.principalAmount} ETH)
              </button>
            )}

            {loan.status === 'Funded' && (
              <button
                onClick={() => {
                  if (!isConnected) {
                    showToast('Connect Wallet', 'Please connect your wallet to repay.', 'warning');
                    connectWallet();
                  } else {
                    setActionModalOpen(true);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md"
              >
                Repay Outstanding Debt
              </button>
            )}

            {loan.status === 'Defaulted' && (
              <button
                onClick={() => {
                  if (!isConnected) {
                    showToast('Connect Wallet', 'Connect wallet to claim collateral.', 'warning');
                    connectWallet();
                  } else {
                    setActionModalOpen(true);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-all shadow-md"
              >
                Liquidate Collateral ({loan.collateralAmount} ETH)
              </button>
            )}
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800">
          <div className="bg-navy-950/60 rounded-2xl p-4 border border-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Coins className="w-3.5 h-3.5 text-teal-400" /> Principal
            </span>
            <p className="text-xl font-extrabold text-white mt-1">{loan.principalAmount} ETH</p>
          </div>

          <div className="bg-navy-950/60 rounded-2xl p-4 border border-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Percent className="w-3.5 h-3.5 text-emerald-400" /> Fixed APR
            </span>
            <p className="text-xl font-extrabold text-emerald-400 mt-1">{(loan.interestRateBps / 100).toFixed(1)}%</p>
          </div>

          <div className="bg-navy-950/60 rounded-2xl p-4 border border-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Shield className="w-3.5 h-3.5 text-teal-400" /> Collateral Escrow
            </span>
            <p className="text-xl font-extrabold text-teal-300 mt-1">{loan.collateralAmount} ETH</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{collateralRatio}% Collateralization</p>
          </div>

          <div className="bg-navy-950/60 rounded-2xl p-4 border border-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Outstanding Due
            </span>
            <p className="text-xl font-extrabold text-white mt-1">{outstandingBalance} ETH</p>
            <p className="text-[10px] text-teal-400 font-medium mt-0.5">{loan.repaidAmount} ETH Settled</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Wallet Roles & Lifecycle */}
        <div className="lg:col-span-2 space-y-8">
          {/* Parties & Wallets Card */}
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <span>Contract Parties</span>
            </h3>

            {/* Borrower Address */}
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Borrower Address</span>
                <p className="font-mono text-sm text-white mt-0.5 break-all">{loan.borrower}</p>
              </div>
              <button
                onClick={() => copyToClipboard(loan.borrower, 'borrower')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
                title="Copy Address"
              >
                {copiedKey === 'borrower' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Lender Address */}
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lender Address</span>
                <p className="font-mono text-sm text-white mt-0.5 break-all">
                  {loan.lender || 'Open (Unfunded - Awaiting Peer Lender)'}
                </p>
              </div>
              {loan.lender && (
                <button
                  onClick={() => copyToClipboard(loan.lender!, 'lender')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
                  title="Copy Address"
                >
                  {copiedKey === 'lender' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>Contract Lifecycle Timeline</span>
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {getTimelineSteps().map((step, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 ${
                      step.done
                        ? 'bg-emerald-500 border-navy-900 ring-2 ring-emerald-500/30'
                        : 'bg-navy-900 border-slate-700'
                    }`}
                  />
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h4 className="text-sm font-bold text-white">{step.title}</h4>
                      <span className="text-xs font-mono text-slate-500">{step.date}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction Logs */}
        <div className="space-y-6">
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <h3 className="text-base font-bold text-white">Associated On-Chain Events</h3>
            <p className="text-xs text-slate-400">
              Cryptographic receipts linked to Loan #{loan.id}
            </p>

            {relatedTxs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No transactions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {relatedTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-navy-950 rounded-xl border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-300">{tx.action}</span>
                      <span className="text-slate-400 font-mono text-[10px]">Block #{tx.blockNumber}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 truncate">
                      {tx.hash}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Value: {tx.amountEth} ETH</span>
                      <span className="text-emerald-400 font-semibold">{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Dialog Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={`Execute Action: Loan #${loan.id}`}
        description="Interact directly with the loan smart contract escrow."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            You are initiating a direct peer action on contract <code>#{loan.id}</code> ({loan.title}).
          </p>

          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs">
            <strong>Prototype Notice:</strong> In this Phase 1 frontend preview, transactions are validated and visually simulated. The Solidity contract execution on Hardhat activates in Phase 2.
          </div>

          <div className="flex gap-3 pt-3">
            <button
              onClick={() => setActionModalOpen(false)}
              className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setActionModalOpen(false);
                showToast('Action Processed', `Simulated interaction with Loan #${loan.id} completed.`, 'success');
              }}
              className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950"
            >
              Confirm Simulated Execution
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
