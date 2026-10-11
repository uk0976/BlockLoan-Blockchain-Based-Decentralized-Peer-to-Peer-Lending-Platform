import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useWallet } from '../context/WalletContext';
import { Info, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isDemoMode, error, isConnected, isWrongNetwork, chainId, switchToLocalhost, isContractDeployed } = useWallet();

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* 1. Wrong Network Banner */}
      {isWrongNetwork && (
        <div className="bg-rose-500/15 border-b border-rose-500/40 text-rose-200 text-xs py-2 px-4 text-center flex flex-wrap items-center justify-center gap-3 font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              <strong>Wrong Network Detected:</strong> Connected to Chain ID <code>{chainId}</code>. BlockLoan runs on <strong>Hardhat Localhost (Chain ID: 31337)</strong>.
            </span>
          </div>
          <button
            onClick={() => switchToLocalhost()}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Switch to Hardhat (31337)</span>
          </button>
        </div>
      )}

      {/* 2. Contract Not Deployed Alert */}
      {isConnected && !isWrongNetwork && isContractDeployed === false && (
        <div className="bg-amber-500/15 border-b border-amber-500/40 text-amber-200 text-xs py-2 px-4 text-center flex items-center justify-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Smart Contract Not Detected on Node:</strong> No contract bytecode found at the configured address. Did you restart the node? Run <code>npm run blockchain:deploy:local</code>.
          </span>
        </div>
      )}

      {/* 3. Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 font-medium">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>UI Preview Mode Active:</strong> You are exploring BlockLoan with simulated test accounts. Switch or disconnect anytime via the wallet button.
          </span>
        </div>
      )}

      {/* 4. General Connection Error */}
      {error && !isConnected && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 text-rose-300 text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
