import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Layers,
  Lock,
  Landmark,
  Coins,
  CheckCircle,
  RefreshCw,
  Loader2,
  Radio,
} from 'lucide-react';
import { formatAddress } from '../data/mockData';
import { Loan } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { fetchAllLoansOnChain } from '../services/contractService';
import { apiService, BackendAdminStats, BackendBlockchainStatus } from '../services/apiService';

export const AdminDashboardPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [adminStats, setAdminStats] = useState<BackendAdminStats | null>(null);
  const [nodeStatus, setNodeStatus] = useState<BackendBlockchainStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isContractData, setIsContractData] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [onChainLoans, stats, status] = await Promise.all([
        fetchAllLoansOnChain(),
        apiService.getAdminStatistics().catch(() => null),
        apiService.getBlockchainStatus().catch(() => null),
      ]);

      if (onChainLoans) {
        setLoans(onChainLoans);
        setIsContractData(true);
      }
      if (stats) setAdminStats(stats);
      if (status) setNodeStatus(status);
    } catch (err) {
      console.warn('Failed to load data for admin dashboard:', err);
      setLoans([]);
      setIsContractData(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalVolume = adminStats
    ? (adminStats.total_volume_eth ?? adminStats.total_principal_volume_eth ?? 0).toFixed(2)
    : loans.reduce((acc, curr) => acc + curr.principalAmount, 0).toFixed(2);
  const activeLoans = adminStats
    ? adminStats.active_loans
    : loans.filter((l) => l.status === 'ACTIVE').length;
  const completedLoans = adminStats
    ? adminStats.completed_loans
    : loans.filter((l) => l.status === 'COMPLETED').length;
  const defaultedLoans = adminStats
    ? adminStats.defaulted_loans
    : loans.filter((l) => l.status === 'DEFAULTED').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Protocol Monitoring (Admin)</h1>
            <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
              Read-Only Inspector
            </span>
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
            High-level operational metrics, health indices, and immutable contract state observation.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-navy-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh Inspector</span>
        </button>
      </div>

      {/* Node Telemetry & Verification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">RPC Node Status</span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                nodeStatus?.is_connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="text-sm font-bold text-white">
              {nodeStatus?.is_connected ? 'Hardhat Node Online' : 'RPC Disconnected'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Chain ID: {nodeStatus?.chain_id ?? 31337} &bull; Block #{nodeStatus?.latest_block ?? '—'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Contract Deployment</span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                nodeStatus?.contract_deployed ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-sm font-bold text-white">
              {nodeStatus?.contract_deployed ? 'Bytecode Verified' : 'Checking Contract...'}
            </span>
          </div>
          <p className="text-[11px] text-teal-400 font-mono truncate" title={nodeStatus?.contract_address}>
            {nodeStatus?.contract_address ?? '0x5FbDB2315678afecb367f032d93F642f64180aa3'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">FastAPI & SQLite Indexer</span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                adminStats ? 'bg-teal-400' : 'bg-slate-500'
              }`}
            />
            <span className="text-sm font-bold text-white">
              {adminStats ? 'Live Web3.py Sync' : 'Direct Contract Fallback'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Source: {adminStats?.source ?? 'Smart Contract RPC'} &bull; Indexed {adminStats?.total_loans ?? loans.length} loans
          </p>
        </div>
      </div>

      {/* Critical Protocol Governance Notice */}
      <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-500/30 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex-shrink-0">
          <Lock className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Non-Custodial Architecture Constraint</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Zero Custodial Access:</strong> This monitoring console provides strictly read-only telemetries. The BlockLoan smart contract contains no administrative backdoor, emergency withdrawal function, or ability to redirect user collateral or principal. All funds remain programmatically governed by mathematical rules on the blockchain.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Protocol Volume"
          value={`${totalVolume} ETH`}
          subtitle="All cumulative loans requested"
          icon={Coins}
        />
        <StatCard
          title="Active Funded Loans"
          value={activeLoans}
          subtitle="Currently active debt terms"
          icon={Layers}
        />
        <StatCard
          title="Settled (Repaid)"
          value={completedLoans}
          subtitle="Cleanly closed credit agreements"
          icon={CheckCircle}
          badge="100% Settled"
        />
        <StatCard
          title="Defaulted Contracts"
          value={defaultedLoans}
          subtitle="Maturity elapsed without full pay"
          icon={ShieldAlert}
        />
      </div>

      {/* Global Contract State Table */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Global Protocol Loans Registry</h3>
          <p className="text-xs text-slate-400 mt-0.5">Read-only audit view of all deployed borrower contracts</p>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            <p className="text-sm text-slate-400">Loading global registry from smart contract...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-950 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">ID & Proposal</th>
                  <th className="py-4 px-6">Borrower</th>
                  <th className="py-4 px-6">Lender</th>
                  <th className="py-4 px-6">Principal</th>
                  <th className="py-4 px-6">Repaid</th>
                  <th className="py-4 px-6">APR</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-white">{loan.title}</span>
                      <span className="text-xs text-slate-500 font-mono block">#{loan.id}</span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-300">{formatAddress(loan.borrower)}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-300">
                      {loan.lender ? formatAddress(loan.lender) : <span className="text-slate-500 italic">None</span>}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">{loan.principalAmount} ETH</td>
                    <td className="py-4 px-6 text-teal-300 font-medium">{loan.repaidAmount} ETH</td>
                    <td className="py-4 px-6 text-emerald-400 font-semibold">
                      {(loan.interestRateBps / 100).toFixed(1)}%
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={loan.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Protocol Health & Security Checklist */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Landmark className="w-5 h-5 text-teal-400" />
          <span>Smart Contract Security Verification Checklist</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Reentrancy Protected
            </span>
            <p className="text-slate-400 leading-relaxed">
              Functions utilize the Checks-Effects-Interactions pattern to prevent reentrant external calls.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Autonomous Escrow
            </span>
            <p className="text-slate-400 leading-relaxed">
              Funds are programmatically locked in contract storage; payments flow directly between borrower and lender.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Clean Role Boundary
            </span>
            <p className="text-slate-400 leading-relaxed">
              No single master key or owner role can confiscate funds or alter loan interest rates retroactively.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
