import React, { useState } from 'react';
import { ShieldCheck, Wallet, ArrowRightLeft, Layers, Landmark, Database } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'borrower' | 'lender'>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-emerald-400">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Block<span className="text-emerald-400">Loan</span></span>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">Phase 1: Skeleton</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shadow-sm"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect MetaMask</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Decentralized Peer-to-Peer Lending
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              BlockLoan eliminates traditional financial intermediaries by operating direct borrower-to-lender credit markets governed by transparent, immutable Solidity smart contracts.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Non-Custodial Escrow
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> Hardhat Local Chain
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <Database className="w-3.5 h-3.5 text-emerald-400" /> FastAPI + SQLite Indexer
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('borrower')}
            className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'borrower'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Borrower Portal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lender')}
            className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'lender'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Lender Market
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">1</div>
              <h3 className="text-lg font-semibold text-white">Solidity Smart Contracts</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Controls all financial state: collateral deposit, loan funding, interest calculations, repayments, and automated liquidation upon maturity default.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">2</div>
              <h3 className="text-lg font-semibold text-white">FastAPI & SQLite Indexer</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Connects to the blockchain via Web3.py to index contract events into a local SQLite database for instant querying without querying RPC nodes repeatedly.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">3</div>
              <h3 className="text-lg font-semibold text-white">React + Ethers.js DApp</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Direct browser wallet interaction via MetaMask. Users sign transactions client-side; private keys never leave the user's browser.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'borrower' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
            <ArrowRightLeft className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
            <h3 className="text-xl font-bold text-white">Borrower Portal Scaffold</h3>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              In the upcoming phase, borrowers will be able to lock testnet ETH collateral and create new loan requests with customized duration and interest terms.
            </p>
          </div>
        )}

        {activeTab === 'lender' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
            <Landmark className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
            <h3 className="text-xl font-bold text-white">Lender Market Scaffold</h3>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              In the upcoming phase, lenders will inspect open loan requests, evaluate collateralization ratios, and fund requests directly via smart contract.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        BlockLoan &copy; College Mini Project. Strictly uses testnet cryptocurrency. Zero real funds or private keys stored.
      </footer>
    </div>
  );
}
