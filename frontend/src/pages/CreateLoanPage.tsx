import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  Percent,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { calculateExpectedRepayment } from '../data/mockData';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';
import {
  createLoanOnChain,
  parseContractError,
  saveLoanMetadata,
} from '../services/contractService';
import { Modal } from '../components/Modal';

export const CreateLoanPage: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, connectWallet, getSigner, refreshBalance, isWrongNetwork, switchToLocalhost } = useWallet();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [principalEth, setPrincipalEth] = useState<string>('2.5');
  const [aprPercent, setAprPercent] = useState<string>('9.5');
  const [durationDays, setDurationDays] = useState<string>('60');
  const [collateralEth, setCollateralEth] = useState<string>('3.75');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState<string>('');
  const [confirmedLoan, setConfirmedLoan] = useState<{ txHash: string; loanId: number } | null>(null);

  // Live calculation metrics
  const principal = parseFloat(principalEth) || 0;
  const apr = parseFloat(aprPercent) || 0;
  const days = parseInt(durationDays, 10) || 0;
  const collateral = parseFloat(collateralEth) || 0;

  const interestBps = Math.round(apr * 100);
  const totalRepayment = useMemo(() => {
    return calculateExpectedRepayment(principal, interestBps, days);
  }, [principal, interestBps, days]);

  const interestAmount = (totalRepayment - principal).toFixed(4);
  const collateralRatio = principal > 0 ? ((collateral / principal) * 100).toFixed(0) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      showToast('Wallet Connection Required', 'Please connect your Web3 wallet to submit an on-chain loan request.', 'warning');
      connectWallet();
      return;
    }

    if (isWrongNetwork) {
      showToast('Wrong Network', 'Please switch your wallet to Hardhat Localhost (Chain ID: 31337).', 'error');
      await switchToLocalhost();
      return;
    }

    if (!title.trim() || !purpose.trim()) {
      showToast('Validation Error', 'Please specify a title and purpose for your loan request.', 'error');
      return;
    }

    if (principal <= 0 || apr <= 0 || days <= 0) {
      showToast('Invalid Parameters', 'Principal, APR, and duration must be positive values.', 'error');
      return;
    }

    if (apr > 50) {
      showToast('APR Too High', 'Maximum allowed annual interest rate is 50% (5,000 bps).', 'error');
      return;
    }

    if (days < 1 || days > 365) {
      showToast('Invalid Duration', 'Loan duration must be between 1 day and 365 days.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmittingStep('Requesting wallet signature in MetaMask...');

      const signer = await getSigner();
      const durationSeconds = days * 86400;

      setSubmittingStep('Submitting createLoan transaction to blockchain...');
      const result = await createLoanOnChain(signer, principalEth, interestBps, durationSeconds);

      // Save user metadata locally for rich display
      if (result.loanId > 0) {
        saveLoanMetadata(result.loanId, { title, purpose });
      }

      await refreshBalance();
      setConfirmedLoan(result);
      showToast(
        'Loan Created on Smart Contract',
        `Loan #${result.loanId} successfully deployed on-chain! Tx: ${result.txHash.substring(0, 10)}...`,
        'success'
      );
    } catch (err) {
      const errMsg = parseContractError(err);
      showToast('Contract Transaction Failed', errMsg, 'error');
    } finally {
      setIsSubmitting(false);
      setSubmittingStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-black text-white tracking-tight">Create Loan Proposal</h1>
        <p className="text-sm text-slate-400 mt-1">
          Specify your borrowing requirement, proposal duration, and interest terms for peer lenders.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Loan Creation Form */}
        <div className="lg:col-span-2 bg-navy-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title & Purpose */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Proposal Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. GPU Compute Cluster Upgrade"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Loan Purpose & Intended Use of Funds
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail how the funds will be utilized and how repayment will be secured..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Principal Amount</span>
                  <span className="text-[11px] text-teal-400 font-normal">Testnet ETH</span>
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={principalEth}
                    onChange={(e) => {
                      setPrincipalEth(e.target.value);
                      const p = parseFloat(e.target.value) || 0;
                      setCollateralEth((p * 1.5).toFixed(2));
                    }}
                    className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Offered APR</span>
                  <span className="text-[11px] text-emerald-400 font-normal">Annual Rate %</span>
                </label>
                <div className="relative">
                  <Percent className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="50"
                    required
                    value={aprPercent}
                    onChange={(e) => setAprPercent(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Loan Term (Duration)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Days</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                  >
                    <option value="15">15 Days (Short Term)</option>
                    <option value="30">30 Days (1 Month)</option>
                    <option value="60">60 Days (2 Months)</option>
                    <option value="90">90 Days (3 Months)</option>
                    <option value="180">180 Days (6 Months)</option>
                    <option value="365">365 Days (1 Year)</option>
                  </select>
                </div>
              </div>

              {/* Optional Collateral Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    Collateral <span className="text-[10px] text-amber-400 font-medium">(Optional in Phase 1)</span>
                  </span>
                  <span className="text-[11px] text-teal-400 font-mono">{collateralRatio}% Coverage</span>
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={collateralEth}
                    onChange={(e) => setCollateralEth(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Note about Collateral Phase */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Note on Collateral Field:</strong> This collateral field is clearly marked as optional and will become strictly functional with automated smart contract escrow locking in Phase 2.
              </span>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{submittingStep || 'Broadcasting Transaction...'}</span>
                </>
              ) : (
                `Deploy Loan Request to Contract (${principal} ETH)`
              )}
            </button>
          </form>
        </div>

        {/* Live Calculation Sidebar */}
        <div className="space-y-6">
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-5 sticky top-24 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Coins className="w-4 h-4 text-teal-400" />
              <span>Contract Yield Summary</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Requested Principal:</span>
                <span className="font-bold text-white font-mono text-sm">{principal.toFixed(2)} ETH</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Annual Interest (APR):</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{apr.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Total Term Duration:</span>
                <span className="font-semibold text-slate-200">{days} Days</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Calculated Interest Fee:</span>
                <span className="font-bold text-teal-300 font-mono">+{interestAmount} ETH</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-white">Total Due at Maturity:</span>
                <span className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 font-mono">
                  {totalRepayment} ETH
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1 font-semibold text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Deterministic Solidity Formula</span>
              </div>
              <p className="font-mono text-[10px] text-slate-500">
                Interest = (Principal &times; APR &times; Days) / (10,000 &times; 365)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmedLoan && (
        <Modal
          isOpen={!!confirmedLoan}
          onClose={() => setConfirmedLoan(null)}
          title="Loan Successfully Created On-Chain!"
          description="Your peer-to-peer loan proposal has been mined and recorded on the BlockLoan smart contract."
        >
          <div className="space-y-4">
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Assigned On-Chain Loan ID:</span>
                <span className="font-mono text-teal-400 font-bold">#{confirmedLoan.loanId}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Principal Amount:</span>
                <span className="font-mono text-white font-bold">{principal} ETH</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Annual Interest Rate:</span>
                <span className="font-mono text-emerald-400">{apr}% APR</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Duration:</span>
                <span className="font-mono text-slate-200">{days} Days</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-1 text-xs">
                <span className="text-slate-400">Transaction Hash:</span>
                <span className="font-mono text-teal-300 text-[11px] break-all">{confirmedLoan.txHash}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Go to Marketplace
              </button>
              <button
                type="button"
                onClick={() => navigate(`/loans/${confirmedLoan.loanId}`)}
                className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <span>View Loan Contract</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
