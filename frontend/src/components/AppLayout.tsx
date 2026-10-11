import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useWallet } from '../context/WalletContext';
import { Info, AlertCircle } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isDemoMode, error, isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Protocol Status Banner */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 font-medium">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>UI Preview Mode Active:</strong> You are exploring BlockLoan with simulated test accounts. Switch or disconnect anytime via the wallet button.
          </span>
        </div>
      )}

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
