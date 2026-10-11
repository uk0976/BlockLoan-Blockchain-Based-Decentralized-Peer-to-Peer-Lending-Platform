import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Coins,
  Percent,
  Clock,
  Shield,
  ArrowRight,
  LayoutGrid,
  List,
  CheckCircle2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { calculateExpectedRepayment, formatAddress } from '../data/mockData';
import { Loan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';
import {
  fetchAllLoansOnChain,
  fundLoanOnChain,
  parseContractError,
} from '../services/contractService';

export const MarketplacePage: React.FC = () => {
  const { address, isConnected, connectWallet, getSigner, refreshBalance, isWrongNetwork, switchToLocalhost } =
    useWallet();
  const { showToast } = useToast();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<'contract' | 'empty'>('contract');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [maxAprFilter, setMaxAprFilter] = useState<number>(30);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [fundingLoan, setFundingLoan] = useState<Loan | null>(null);
  const [isSubmittingFund, setIsSubmittingFund] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch loans from contract and API
  const loadLoans = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const onChainLoans = await fetchAllLoansOnChain();
      setLoans(onChainLoans || []);
      setDataSource(onChainLoans && onChainLoans.length > 0 ? 'contract' : 'empty');
    } catch (err) {
      console.error('Failed to fetch on-chain loans:', err);
      setErrorMessage('Failed to connect to local Hardhat node at http://127.0.0.1:8545. Please ensure your local Ethereum node is running.');
      setLoans([]);
      setDataSource('empty');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  // Filter loans
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesSearch =
        loan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.borrower.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = loan.status.toUpperCase() === statusFilter.toUpperCase();
      }

      const aprPercent = loan.interestRateBps / 100;
      const matchesApr = aprPercent <= maxAprFilter;

      return matchesSearch && matchesStatus && matchesApr;
    });
  }, [loans, searchTerm, statusFilter, maxAprFilter]);

  const handleFundInitiate = (loan: Loan) => {
    if (!isConnected) {
      showToast('Wallet Connection Required', 'Please connect your Web3 wallet to fund this loan.', 'warning');
      connectWallet();
      return;
    }

    if (isWrongNetwork) {
      showToast('Wrong Network', 'Please switch your wallet to Hardhat Localhost (Chain ID: 31337).', 'error');
      switchToLocalhost();
      return;
    }

    setFundingLoan(loan);
  };

  const isCurrentBorrower = Boolean(
    address && fundingLoan && address.toLowerCase() === fundingLoan.borrower.toLowerCase()
  );

  const handleConfirmFund = async () => {
    if (!fundingLoan) return;

    if (isCurrentBorrower) {
      showToast(
        'Borrower Cannot Fund',
        'You cannot fund your own loan request. Switch to a separate lender account in MetaMask (e.g. Account #2).',
        'error'
      );
      return;
    }

    try {
      setIsSubmittingFund(true);
      const signer = await getSigner();

      const result = await fundLoanOnChain(signer, fundingLoan.id, fundingLoan.principalAmount);

      await refreshBalance();
      showToast(
        'Loan Successfully Funded',
        `Transferred ${fundingLoan.principalAmount} ETH to borrower! Tx: ${result.txHash.substring(0, 10)}...`,
        'success'
      );
      setFundingLoan(null);
      await loadLoans();
    } catch (err) {
      const errMsg = parseContractError(err);
      showToast('Funding Failed', errMsg, 'error');
    } finally {
      setIsSubmittingFund(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Loan Marketplace</h1>
            {dataSource === 'contract' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>On-Chain Verified ({loans.length})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                <span>Contract Ledger (0 proposals)</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Browse verified peer-to-peer loan requests with autonomous smart contract escrow and fixed APR terms.
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
            <span>Request New Loan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by purpose, loan title, or borrower address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open (Available to Fund)</option>
              <option value="active">Active (Funded)</option>
              <option value="completed">Completed (Repaid)</option>
              <option value="defaulted">Defaulted</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-navy-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* APR Range Filter */}
        <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <span className="flex items-center gap-1 font-medium text-slate-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" /> Max APR: {maxAprFilter}%
          </span>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={maxAprFilter}
            onChange={(e) => setMaxAprFilter(Number(e.target.value))}
            className="w-48 accent-teal-400 cursor-pointer"
          />
          <span className="text-slate-500">
            Showing {filteredLoans.length} of {loans.length} proposals
          </span>
        </div>
      </div>

      {/* Recoverable Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <p className="text-xs sm:text-sm font-medium">{errorMessage}</p>
          </div>
          <button
            onClick={() => loadLoans()}
            className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold rounded-xl border border-rose-500/40 transition-colors self-start sm:self-auto"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-sm text-slate-400">Querying BlockLoan smart contract on Hardhat localhost...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        loans.length === 0 ? (
          <EmptyState
            title="No Loan Proposals on Blockchain"
            description="No peer-to-peer loan proposals have been created on the smart contract yet. Create your proposal to borrow test ETH."
            actionText="Request New Loan"
            onAction={() => {
              window.location.href = '/borrower/create';
            }}
          />
        ) : (
          <EmptyState
            title="No Matching Loan Requests"
            description="Adjust your search terms, status filter, or APR range to see available lending opportunities."
            actionText="Reset Filters"
            onAction={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setMaxAprFilter(30);
            }}
          />
        )
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLoans.map((loan) => {
            const isFundable = loan.status === 'OPEN';
            const isMyLoan = Boolean(address && loan.borrower.toLowerCase() === address.toLowerCase());

            return (
              <div
                key={loan.id}
                className="bg-navy-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-slate-950/60 group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono text-slate-500">Loan #{loan.id}</span>
                    <StatusBadge status={loan.status} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                      {loan.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {loan.purpose}
                    </p>
                  </div>

                  {/* Financial Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                    <div className="bg-navy-950/60 rounded-xl p-3 border border-slate-800/60">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Coins className="w-3 h-3 text-teal-400" /> Principal
                      </span>
                      <p className="text-base font-bold text-white mt-0.5">{loan.principalAmount} ETH</p>
                    </div>

                    <div className="bg-navy-950/60 rounded-xl p-3 border border-slate-800/60">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Percent className="w-3 h-3 text-emerald-400" /> Fixed APR
                      </span>
                      <p className="text-base font-bold text-emerald-400 mt-0.5">
                        {(loan.interestRateBps / 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-navy-950/60 rounded-xl p-3 border border-slate-800/60">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" /> Duration
                      </span>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5">{loan.durationDays} Days</p>
                    </div>

                    <div className="bg-navy-950/60 rounded-xl p-3 border border-slate-800/60">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Shield className="w-3 h-3 text-teal-400" /> Repaid
                      </span>
                      <p className="text-sm font-semibold text-teal-300 mt-0.5">
                        {loan.repaidAmount} ETH
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Borrower:</span>
                    <span className="font-mono text-slate-300">
                      {formatAddress(loan.borrower)}
                      {isMyLoan && <span className="ml-1 text-[10px] text-teal-400 font-sans font-bold">(You)</span>}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-slate-800 flex items-center gap-2">
                  <Link
                    to={`/loans/${loan.id}`}
                    className="flex-1 text-center py-2 px-3 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    Details
                  </Link>

                  {isFundable && (
                    <button
                      onClick={() => handleFundInitiate(loan)}
                      disabled={isMyLoan}
                      title={isMyLoan ? 'You cannot fund your own loan request' : 'Fund this loan'}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-colors shadow-sm ${
                        isMyLoan
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                      }`}
                    >
                      {isMyLoan ? 'Your Loan' : 'Fund Loan'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-950 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">ID & Proposal</th>
                  <th className="py-4 px-6">Principal</th>
                  <th className="py-4 px-6">APR</th>
                  <th className="py-4 px-6">Term</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredLoans.map((loan) => {
                  const isFundable = loan.status === 'OPEN';
                  const isMyLoan = Boolean(address && loan.borrower.toLowerCase() === address.toLowerCase());

                  return (
                    <tr key={loan.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{loan.title}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          #{loan.id} &bull; {formatAddress(loan.borrower)}
                          {isMyLoan && <span className="ml-1 text-teal-400 font-sans font-bold">(You)</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-white">{loan.principalAmount} ETH</td>
                      <td className="py-4 px-6 text-emerald-400 font-semibold">
                        {(loan.interestRateBps / 100).toFixed(1)}%
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
                            View
                          </Link>
                          {isFundable && (
                            <button
                              onClick={() => handleFundInitiate(loan)}
                              disabled={isMyLoan}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                isMyLoan
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                              }`}
                            >
                              {isMyLoan ? 'Mine' : 'Fund'}
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
        </div>
      )}

      {/* Funding Confirmation Modal */}
      {fundingLoan && (
        <Modal
          isOpen={!!fundingLoan}
          onClose={() => setFundingLoan(null)}
          title={`Fund Loan #${fundingLoan.id} on Blockchain`}
          description="Confirm transfer of testnet ETH principal to the borrower's address via BlockLoan smart contract."
        >
          <div className="space-y-5">
            <div className="bg-navy-950 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Borrower Address:</span>
                <span className="font-mono text-white break-all">{fundingLoan.borrower}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Principal Required:</span>
                <span className="text-white font-mono">{fundingLoan.principalAmount} ETH</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Fixed Annual APR:</span>
                <span className="text-teal-400 font-mono">{(fundingLoan.interestRateBps / 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Term Duration:</span>
                <span className="text-slate-200 font-mono">{fundingLoan.durationDays} Days</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-800">
                <span className="text-slate-300">Expected Total Return:</span>
                <span className="text-emerald-400 font-mono text-base font-bold">
                  {calculateExpectedRepayment(
                    fundingLoan.principalAmount,
                    fundingLoan.interestRateBps,
                    fundingLoan.durationDays
                  )}{' '}
                  ETH
                </span>
              </div>
            </div>

            {isCurrentBorrower ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span>
                  <strong>Borrower Cannot Fund:</strong> You created this loan. Solidity contract enforces that borrowers cannot fund their own loans. Please switch to a lender account in MetaMask (e.g. Account #2).
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal-400" />
                <span>
                  <strong>Smart Contract Guarantee:</strong> When you send {fundingLoan.principalAmount} ETH, the smart contract records your wallet as the lender, activates the debt term, and directs all future repayments straight to your wallet.
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFundingLoan(null)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFund}
                disabled={isSubmittingFund || isCurrentBorrower}
                className="flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmittingFund ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming on Blockchain...</span>
                  </>
                ) : (
                  `Confirm & Fund ${fundingLoan.principalAmount} ETH`
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
