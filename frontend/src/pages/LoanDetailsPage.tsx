import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Coins,
  Percent,
  Clock,
  Calendar,
  Layers,
  Radio,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { calculateExpectedRepayment, formatAddress } from '../data/mockData';
import { Loan, TransactionRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';
import {
  fetchLoanByIdOnChain,
  fetchContractEvents,
  fundLoanOnChain,
  repayLoanOnChain,
  parseContractError,
} from '../services/contractService';

export const LoanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const loanId = parseInt(id || '1', 10);
  const { address, isConnected, connectWallet, getSigner, refreshBalance, isWrongNetwork, switchToLocalhost } =
    useWallet();
  const { showToast } = useToast();

  const [loan, setLoan] = useState<Loan | null>(null);
  const [remainingDebtEth, setRemainingDebtEth] = useState<number>(0);
  const [events, setEvents] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isContractData, setIsContractData] = useState<boolean>(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals for Actions
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [repayInput, setRepayInput] = useState<string>('');
  const [isActionPending, setIsActionPending] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadLoanDetails = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const onChainData = await fetchLoanByIdOnChain(loanId);
      if (onChainData) {
        setLoan(onChainData.loan);
        setRemainingDebtEth(onChainData.remainingDueEth);
        setIsContractData(true);
      } else {
        setLoan(null);
        setIsContractData(false);
      }

      // Query contract events
      const onChainEvents = await fetchContractEvents(loanId);
      setEvents(onChainEvents);
    } catch (err) {
      console.warn('Failed to load loan on-chain:', err);
      setErrorMessage('Could not load loan from blockchain. Verify that Hardhat node is running.');
      setLoan(null);
      setIsContractData(false);
    } finally {
      setIsLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    loadLoanDetails();
  }, [loadLoanDetails]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        <p className="text-sm text-slate-400">Loading loan #{loanId} from smart contract...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
          <Layers className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Loan #{loanId} Not Found</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md">
            {errorMessage || 'This loan proposal does not exist on the smart contract.'}
          </p>
        </div>
        <Link
          to="/marketplace"
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-colors"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const activeLoan = loan;

  const expectedRepayment = calculateExpectedRepayment(
    activeLoan.principalAmount,
    activeLoan.interestRateBps,
    activeLoan.durationDays
  );
  const outstandingBalance = (remainingDebtEth > 0 ? remainingDebtEth : Math.max(0, expectedRepayment - activeLoan.repaidAmount)).toFixed(4);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to Clipboard', text, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isFundable = activeLoan.status === 'OPEN';
  const isActive = activeLoan.status === 'ACTIVE';
  const isBorrower = Boolean(address && activeLoan.borrower.toLowerCase() === address.toLowerCase());
  const isLender = Boolean(address && activeLoan.lender && activeLoan.lender.toLowerCase() === address.toLowerCase());

  // Handle on-chain Funding
  const handleConfirmFund = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    if (isWrongNetwork) {
      switchToLocalhost();
      return;
    }
    if (isBorrower) {
      showToast('Borrower Cannot Fund', 'You cannot fund your own loan request. Switch accounts in MetaMask.', 'error');
      return;
    }

    try {
      setIsActionPending(true);
      const signer = await getSigner();
      const res = await fundLoanOnChain(signer, activeLoan.id, activeLoan.principalAmount);
      await refreshBalance();
      showToast('Loan Funded On-Chain', `Successfully funded! Tx: ${res.txHash.substring(0, 10)}...`, 'success');
      setFundModalOpen(false);
      await loadLoanDetails();
    } catch (err) {
      showToast('Funding Failed', parseContractError(err), 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  // Handle on-chain Repayment
  const handleConfirmRepay = async () => {
    const val = parseFloat(repayInput);
    if (!val || val <= 0) {
      showToast('Invalid Amount', 'Repayment amount must be positive.', 'error');
      return;
    }

    try {
      setIsActionPending(true);
      const signer = await getSigner();
      const res = await repayLoanOnChain(signer, activeLoan.id, repayInput);
      await refreshBalance();
      showToast('Repayment Settled On-Chain', `Transferred ${repayInput} ETH! Tx: ${res.txHash.substring(0, 10)}...`, 'success');
      setRepayModalOpen(false);
      await loadLoanDetails();
    } catch (err) {
      showToast('Repayment Failed', parseContractError(err), 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const getTimelineSteps = () => {
    const isFunded = activeLoan.status !== 'OPEN' && activeLoan.status !== 'CANCELLED';
    const isSettled = activeLoan.status === 'COMPLETED';
    const isDefaulted = activeLoan.status === 'DEFAULTED';

    return [
      {
        title: 'Loan Proposal Created',
        date: new Date(activeLoan.createdAt).toLocaleDateString(),
        done: true,
        desc: `Borrower initiated request for ${activeLoan.principalAmount} ETH at ${(activeLoan.interestRateBps / 100).toFixed(1)}% APR.`,
      },
      {
        title: 'Peer Lender Funded',
        date: activeLoan.fundedAt ? new Date(activeLoan.fundedAt).toLocaleDateString() : 'Awaiting Peer Funding',
        done: isFunded,
        desc: activeLoan.lender
          ? `Funded by ${formatAddress(activeLoan.lender)}. Repayment clock running.`
          : 'Available in open marketplace.',
      },
      {
        title: isDefaulted ? 'Loan Defaulted' : 'Complete Settlement',
        date: activeLoan.dueDate ? new Date(activeLoan.dueDate).toLocaleDateString() : 'Due Upon Funding',
        done: isSettled || isDefaulted,
        desc: isSettled
          ? 'Borrower repaid complete debt in full to the lender wallet.'
          : isDefaulted
          ? 'Repayment deadline passed without settlement.'
          : 'Target maturity date for repayment.',
      },
    ];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Breadcrumb & Live Refresh */}
      <div className="flex items-center justify-between">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-teal-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Loan Marketplace</span>
        </Link>

        <button
          onClick={() => loadLoanDetails()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh Contract</span>
        </button>
      </div>

      {/* Main Loan Header Card */}
      <div className="bg-navy-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-teal-400 px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/20">
                Loan Contract #{activeLoan.id}
              </span>
              <StatusBadge status={activeLoan.status} />
              {isContractData ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  <span>On-Chain Verified</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Demo Preview
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{activeLoan.title}</h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{activeLoan.purpose}</p>
          </div>

          {/* Action Triggers */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {isFundable && (
              <button
                onClick={() => {
                  if (!isConnected) {
                    showToast('Connect Wallet', 'Please connect your Web3 wallet to fund this loan.', 'warning');
                    connectWallet();
                  } else {
                    setFundModalOpen(true);
                  }
                }}
                disabled={isBorrower}
                title={isBorrower ? 'Borrowers cannot fund their own loans' : 'Fund this loan'}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
                  isBorrower
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                }`}
              >
                {isBorrower ? 'Your Loan Request' : `Fund This Loan (${activeLoan.principalAmount} ETH)`}
              </button>
            )}

            {isActive && (
              <button
                onClick={() => {
                  if (!isConnected) {
                    showToast('Connect Wallet', 'Please connect your wallet to repay.', 'warning');
                    connectWallet();
                  } else {
                    setRepayInput(outstandingBalance);
                    setRepayModalOpen(true);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md"
              >
                Repay Debt
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
            <p className="text-xl font-extrabold text-white mt-1">{activeLoan.principalAmount} ETH</p>
          </div>

          <div className="bg-navy-950/60 rounded-2xl p-4 border border-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Percent className="w-3.5 h-3.5 text-emerald-400" /> Fixed APR
            </span>
            <p className="text-xl font-extrabold text-emerald-400 mt-1">
              {(activeLoan.interestRateBps / 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-navy-950/60 rounded-2xl p-4 border border-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration
            </span>
            <p className="text-xl font-extrabold text-slate-200 mt-1">{activeLoan.durationDays} Days</p>
          </div>

          <div className="bg-navy-950/60 rounded-2xl p-4 border border-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Coins className="w-3.5 h-3.5 text-teal-400" /> Outstanding Due
            </span>
            <p className="text-xl font-extrabold text-teal-300 mt-1">{outstandingBalance} ETH</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{activeLoan.repaidAmount} ETH Settled</p>
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
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Borrower Address {isBorrower && <span className="text-teal-400 font-bold">(You)</span>}
                </span>
                <p className="font-mono text-sm text-white mt-0.5 break-all">{activeLoan.borrower}</p>
              </div>
              <button
                onClick={() => copyToClipboard(activeLoan.borrower, 'borrower')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
                title="Copy Address"
              >
                {copiedKey === 'borrower' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Lender Address */}
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Lender Address {isLender && <span className="text-teal-400 font-bold">(You)</span>}
                </span>
                <p className="font-mono text-sm text-white mt-0.5 break-all">
                  {activeLoan.lender || 'Open (Unfunded - Awaiting Peer Lender)'}
                </p>
              </div>
              {activeLoan.lender && (
                <button
                  onClick={() => copyToClipboard(activeLoan.lender!, 'lender')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
                  title="Copy Address"
                >
                  {copiedKey === 'lender' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
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
            <h3 className="text-base font-bold text-white">Cryptographic On-Chain Events</h3>
            <p className="text-xs text-slate-400">
              Receipts parsed from Solidity contract logs for Loan #{activeLoan.id}
            </p>

            {events.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                {isContractData
                  ? 'No contract event receipts discovered for this loan.'
                  : 'Connect local Hardhat node to stream real block events.'}
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-navy-950 rounded-xl border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-300">{tx.action}</span>
                      <span className="text-slate-400 font-mono text-[10px]">Block #{tx.blockNumber}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 truncate" title={tx.hash}>
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

      {/* Fund Loan Modal */}
      {fundModalOpen && (
        <Modal
          isOpen={fundModalOpen}
          onClose={() => setFundModalOpen(false)}
          title={`Fund Loan #${activeLoan.id} on Blockchain`}
          description="Confirm transfer of testnet ETH directly to the borrower via the smart contract."
        >
          <div className="space-y-5">
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Principal to Transfer:</span>
                <span className="font-mono text-white font-bold">{activeLoan.principalAmount} ETH</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Annual Interest APR:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {(activeLoan.interestRateBps / 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Term Duration:</span>
                <span className="font-mono text-slate-200">{activeLoan.durationDays} Days</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFundModalOpen(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFund}
                disabled={isActionPending}
                className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md flex items-center justify-center gap-1.5"
              >
                {isActionPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  `Confirm & Transfer ${activeLoan.principalAmount} ETH`
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Repay Debt Modal */}
      {repayModalOpen && (
        <Modal
          isOpen={repayModalOpen}
          onClose={() => setRepayModalOpen(false)}
          title={`Repay Debt: Loan #${activeLoan.id}`}
          description="Send payment back to the lender through the BlockLoan smart contract."
        >
          <div className="space-y-5">
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Remaining Debt:</span>
                <span className="font-mono text-emerald-400 font-bold">{outstandingBalance} ETH</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Payment Amount (ETH)
                </label>
                <button
                  type="button"
                  onClick={() => setRepayInput(outstandingBalance)}
                  className="text-xs text-teal-400 font-semibold hover:underline"
                >
                  Pay Full Debt
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.0001"
                value={repayInput}
                onChange={(e) => setRepayInput(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRepayModalOpen(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRepay}
                disabled={isActionPending}
                className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md flex items-center justify-center gap-1.5"
              >
                {isActionPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Repayment...</span>
                  </>
                ) : (
                  `Confirm & Repay ${repayInput} ETH`
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
