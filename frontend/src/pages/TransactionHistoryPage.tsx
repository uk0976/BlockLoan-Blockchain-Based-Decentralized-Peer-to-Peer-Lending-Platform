import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Radio,
} from 'lucide-react';
import { MOCK_TRANSACTIONS, formatAddress } from '../data/mockData';
import { TransactionRecord, TransactionAction } from '../types';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { fetchContractEvents } from '../services/contractService';

export const TransactionHistoryPage: React.FC = () => {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isContractData, setIsContractData] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const onChainEvents = await fetchContractEvents();
      if (onChainEvents && onChainEvents.length > 0) {
        setTransactions(onChainEvents);
        setIsContractData(true);
      } else {
        setTransactions(MOCK_TRANSACTIONS);
        setIsContractData(false);
      }
    } catch (err) {
      console.warn('Failed to query contract event logs:', err);
      setTransactions(MOCK_TRANSACTIONS);
      setIsContractData(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.to && tx.to.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.loanId.toString().includes(searchTerm);

      const matchesAction =
        actionFilter === 'all' ? true : tx.action.toLowerCase() === actionFilter.toLowerCase();

      return matchesSearch && matchesAction;
    });
  }, [transactions, searchTerm, actionFilter]);

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    showToast('Hash Copied', hash, 'info');
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getActionBadgeColor = (action: TransactionAction) => {
    switch (action) {
      case 'Request Loan':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Fund Loan':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
      case 'Repay Loan':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Liquidate Collateral':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Transaction History</h1>
            {isContractData ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>On-Chain Logs ({transactions.length})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span>Demo Fallback Logs</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Available indexed events queried directly from the BlockLoan smart contract filter logs.
          </p>
        </div>

        <button
          onClick={() => loadEvents()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-navy-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by transaction hash, wallet address, or loan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-navy-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
          >
            <option value="all">All Action Types</option>
            <option value="request loan">Request Loan</option>
            <option value="fund loan">Fund Loan</option>
            <option value="repay loan">Repay Loan</option>
            <option value="liquidate collateral">Liquidate / Default</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            <p className="text-sm text-slate-400">Querying event logs from smart contract...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            title="No Transactions Found"
            description="No transaction records match the specified search query or action filter."
            actionText="Reset Filters"
            onAction={() => {
              setSearchTerm('');
              setActionFilter('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-950 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Tx Hash</th>
                  <th className="py-4 px-6">Action Type</th>
                  <th className="py-4 px-6">Loan ID</th>
                  <th className="py-4 px-6">Origin Account</th>
                  <th className="py-4 px-6">Value (ETH)</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 font-mono text-xs text-white">
                        <span>
                          {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 8)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.hash)}
                          className="p-1 text-slate-500 hover:text-white transition-colors"
                          title="Copy Full Hash"
                        >
                          {copiedHash === tx.hash ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Block #{tx.blockNumber}</span>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getActionBadgeColor(
                          tx.action
                        )}`}
                      >
                        {tx.action}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-semibold text-white font-mono">
                      #{tx.loanId}
                    </td>

                    <td className="py-4 px-6 text-xs font-mono text-slate-400">
                      <div>
                        From: <span className="text-slate-300">{formatAddress(tx.from)}</span>
                      </div>
                      {tx.to && (
                        <div>
                          To: <span className="text-slate-300">{formatAddress(tx.to)}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 font-bold text-white font-mono">{tx.amountEth} ETH</td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{tx.status}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right text-xs text-slate-400 font-mono">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
