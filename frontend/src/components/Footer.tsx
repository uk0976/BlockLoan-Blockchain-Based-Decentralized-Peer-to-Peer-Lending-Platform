import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ShieldCheck, Github, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-navy-950 mt-auto py-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-black text-lg">
              <Landmark className="w-5 h-5 text-teal-400" />
              <span>BlockLoan</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Decentralized Peer-to-Peer Lending Protocol engineered for academic demonstration and research.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                Testnet Only
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded">
                Non-Custodial
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Protocol</p>
            <ul className="text-xs space-y-2">
              <li><Link to="/marketplace" className="hover:text-teal-400 transition-colors">Marketplace</Link></li>
              <li><Link to="/borrower" className="hover:text-teal-400 transition-colors">Borrower Portal</Link></li>
              <li><Link to="/lender" className="hover:text-teal-400 transition-colors">Lender Dashboard</Link></li>
              <li><Link to="/borrower/create" className="hover:text-teal-400 transition-colors">Create Loan</Link></li>
            </ul>
          </div>

          {/* Operations & Monitoring */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Explorer & Admin</p>
            <ul className="text-xs space-y-2">
              <li><Link to="/transactions" className="hover:text-teal-400 transition-colors">Transaction Ledger</Link></li>
              <li><Link to="/admin" className="hover:text-teal-400 transition-colors">Protocol Monitoring</Link></li>
              <li>
                <a
                  href="https://github.com/uk0976/BlockLoan-Blockchain-Based-Decentralized-Peer-to-Peer-Lending-Platform"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-teal-400 transition-colors inline-flex items-center gap-1"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Security Principles */}
          <div className="space-y-2 text-xs">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Security Architecture</p>
            <p className="text-slate-400 leading-relaxed">
              No private keys, seed phrases, or personal identity documents are stored. Financial logic and escrow state run exclusively on Solidity smart contracts.
            </p>
            <div className="flex items-center gap-1.5 text-teal-400 font-medium pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Transparent Codebase</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>BlockLoan &copy; College Mini Project. Strictly educational testnet prototype.</p>
          <p>Chain ID: 31337 (Hardhat Local Node)</p>
        </div>
      </div>
    </footer>
  );
};
