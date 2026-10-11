import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Percent,
  Coins,
  RefreshCw,
  Landmark,
  Scale
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { MOCK_PROTOCOL_STATS } from '../data/mockData';

export const LandingPage: React.FC = () => {
  const { isConnected, enableDemoRole } = useWallet();

  const steps = [
    {
      num: '01',
      title: 'Borrower Requests Loan',
      description: 'The borrower locks testnet crypto collateral into the smart contract and defines the principal, duration, and APR terms.',
      icon: Coins,
    },
    {
      num: '02',
      title: 'Lenders Inspect & Fund',
      description: 'Peers browse the open marketplace, analyze collateral health ratios, and fund the loan directly with zero intermediaries.',
      icon: Zap,
    },
    {
      num: '03',
      title: 'Autonomous Escrow',
      description: 'Principal is instantly disbursed to the borrower while the smart contract safely safeguards the locked collateral.',
      icon: Lock,
    },
    {
      num: '04',
      title: 'Repayment or Liquidation',
      description: 'The borrower repays principal + interest before maturity to unlock collateral. In case of default, the lender claims the collateral.',
      icon: RefreshCw,
    },
  ];

  const benefits = [
    {
      icon: Scale,
      title: 'Zero Intermediary Spread',
      desc: 'Traditional banks take massive interest margins between borrowers and depositors. BlockLoan connects peers directly.',
    },
    {
      icon: Lock,
      title: 'Non-Custodial Security',
      desc: 'Funds are never held by an administrator or centralized platform wallet. Smart contracts enforce all rules deterministically.',
    },
    {
      icon: ShieldCheck,
      title: 'No KYC or Personal Data On-Chain',
      desc: 'Transactions are authenticated by public cryptography (wallet addresses). Real identity documents are never written to public ledgers.',
    },
    {
      icon: Percent,
      title: 'Transparent Fixed APR',
      desc: 'Interest calculations are mathematically baked into Solidity code, eliminating hidden penalties or predatory variable fees.',
    },
  ];

  return (
    <div className="space-y-24 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs sm:text-sm font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span>College Mini-Project Prototype &bull; Phase 1 Frontend UI</span>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Decentralized Peer-to-Peer <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400">
              Lending Without Intermediaries
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            BlockLoan replaces commercial loan underwriting with transparent, non-custodial Solidity smart contracts. Borrowers lock collateral, peers fund requests, and algorithms guarantee mathematical settlement.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm sm:text-base transition-all shadow-lg shadow-teal-500/20"
          >
            <span>Explore Marketplace</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/borrower/create"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-navy-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm sm:text-base transition-all"
          >
            <span>Create Loan Request</span>
          </Link>

          {!isConnected && (
            <button
              onClick={() => enableDemoRole('borrower')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-navy-850 hover:bg-navy-800 border border-amber-500/40 text-amber-300 font-medium text-sm transition-all"
            >
              <span>Instant Demo Preview</span>
            </button>
          )}
        </div>

        {/* Live Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-10">
          <div className="bg-navy-900/80 border border-slate-800/80 rounded-2xl p-5 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Protocol Volume</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{MOCK_PROTOCOL_STATS.totalVolumeEth} ETH</p>
            <p className="text-[11px] text-teal-400 font-medium mt-0.5">Testnet Market Cap</p>
          </div>
          <div className="bg-navy-900/80 border border-slate-800/80 rounded-2xl p-5 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Funded</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-300 mt-1">{MOCK_PROTOCOL_STATS.totalFundedEth} ETH</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{MOCK_PROTOCOL_STATS.activeLoansCount} Active Debt Contracts</p>
          </div>
          <div className="bg-navy-900/80 border border-slate-800/80 rounded-2xl p-5 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Yield (APR)</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">{MOCK_PROTOCOL_STATS.averageApr}%</p>
            <p className="text-[11px] text-emerald-400/80 font-medium mt-0.5">Direct Peer Returns</p>
          </div>
          <div className="bg-navy-900/80 border border-slate-800/80 rounded-2xl p-5 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custody Model</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">100%</p>
            <p className="text-[11px] text-teal-400 font-medium mt-0.5">Non-Custodial Escrow</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">How BlockLoan Works</h2>
          <p className="text-sm sm:text-base text-slate-400">
            A 4-step autonomous credit agreement executed on the Ethereum Virtual Machine without loan officers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="bg-navy-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-slate-700 group-hover:text-teal-400 transition-colors">
                      {s.num}
                    </span>
                    <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Key Benefits and Security Invariants */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-850 to-navy-900 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-10">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Architectural Principles</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Security, Transparency and Open Access
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            BlockLoan adheres to strict decentralized finance fundamentals, safeguarding lenders and borrowers alike.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{b.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="text-center py-12 px-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border border-teal-500/30 rounded-3xl space-y-6">
        <Landmark className="w-12 h-12 text-teal-400 mx-auto" />
        <div className="max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ready to test the BlockLoan DApp?</h2>
          <p className="text-sm text-slate-300">
            Connect your MetaMask wallet or use Demo Mode to browse live loan requests and simulate funding interactions.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            to="/marketplace"
            className="px-6 py-3 text-sm font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-md"
          >
            Launch Marketplace
          </Link>
          <Link
            to="/borrower/create"
            className="px-6 py-3 text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition-colors"
          >
            Request a Loan
          </Link>
        </div>
      </section>
    </div>
  );
};
