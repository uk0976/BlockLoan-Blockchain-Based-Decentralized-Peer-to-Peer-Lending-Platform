import {
  ShieldAlert,
  Layers,
  Lock,
  Landmark,
  Coins,
  CheckCircle,
} from 'lucide-react';
import { MOCK_LOANS, MOCK_PROTOCOL_STATS, formatAddress } from '../data/mockData';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';

export const AdminDashboardPage: React.FC = () => {
  const totalVolume = MOCK_PROTOCOL_STATS.totalVolumeEth;
  const activeLoans = MOCK_LOANS.filter((l) => l.status === 'Funded').length;
  const completedLoans = MOCK_LOANS.filter((l) => l.status === 'Repaid').length;
  const defaultedLoans = MOCK_LOANS.filter((l) => l.status === 'Defaulted').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-white tracking-tight">Protocol Monitoring (Admin)</h1>
          <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
            Read-Only Inspector
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          High-level operational metrics, health indices, and immutable contract state observation.
        </p>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-950 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">ID & Proposal</th>
                <th className="py-4 px-6">Borrower</th>
                <th className="py-4 px-6">Lender</th>
                <th className="py-4 px-6">Principal</th>
                <th className="py-4 px-6">Collateral</th>
                <th className="py-4 px-6">APR</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {MOCK_LOANS.map((loan) => (
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
                  <td className="py-4 px-6 text-teal-300 font-medium">{loan.collateralAmount} ETH</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">{(loan.interestRateBps / 100).toFixed(1)}%</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={loan.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              Collateral is locked into contract storage upon loan request creation; release requires full payment or liquidation.
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
