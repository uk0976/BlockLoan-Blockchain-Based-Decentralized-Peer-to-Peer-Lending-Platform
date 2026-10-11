import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Landmark, Wallet, Menu, X, ChevronDown, ShieldCheck, LogOut, UserCheck } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';
import { formatAddress } from '../data/mockData';
import { Modal } from './Modal';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isConnected, isConnecting, address, balanceEth, networkName, isDemoMode, error, connectWallet, disconnectWallet, enableDemoRole } = useWallet();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Borrower', path: '/borrower' },
    { label: 'Lender', path: '/lender' },
    { label: 'Create Loan', path: '/borrower/create' },
    { label: 'Transactions', path: '/transactions' },
    { label: 'Admin', path: '/admin' },
  ];

  const handleConnectClick = async () => {
    if (isConnected) {
      setUserMenuOpen(!userMenuOpen);
    } else {
      setWalletModalOpen(true);
    }
  };

  const handleMetaMaskConnect = async () => {
    setWalletModalOpen(false);
    await connectWallet();
    if (error) {
      showToast('MetaMask Connection Error', error, 'error');
    } else {
      showToast('Wallet Connected', 'Successfully connected your Web3 wallet.', 'success');
    }
  };

  const handleDemoSelect = (role: 'borrower' | 'lender') => {
    enableDemoRole(role);
    setWalletModalOpen(false);
    showToast(
      'Demo Mode Activated',
      `Simulating as ${role === 'borrower' ? 'Borrower (Account #1)' : 'Lender (Account #3)'} for UI inspection.`,
      'info'
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 text-teal-400 group-hover:border-teal-400/60 transition-colors shadow-sm">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight text-white">
                Block<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Loan</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-full">
                DeFi P2P
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path) && link.path !== '/borrower');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-teal-400 bg-teal-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Wallet and Role Actions */}
          <div className="flex items-center gap-3">
            {isConnected && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-navy-900 border border-slate-800 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">{networkName || 'Local Network'}</span>
                {isDemoMode && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    DEMO
                  </span>
                )}
              </div>
            )}

            {/* Wallet Connect Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={handleConnectClick}
                disabled={isConnecting}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm ${
                  isConnected
                    ? 'bg-navy-900 border border-slate-700 text-slate-100 hover:border-slate-600'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-500/10'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>
                  {isConnecting
                    ? 'Connecting...'
                    : isConnected
                    ? `${formatAddress(address || '')} (${balanceEth} ETH)`
                    : 'Connect Wallet'}
                </span>
                {isConnected && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {/* Connected User Dropdown */}
              {userMenuOpen && isConnected && (
                <div className="absolute right-0 mt-2 w-64 bg-navy-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-fade-in">
                  <div className="pb-3 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Connected Account</p>
                    <p className="text-sm font-mono font-medium text-white break-all mt-0.5">{address}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Balance:</span>
                      <span className="font-bold text-teal-400">{balanceEth} testnet ETH</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setWalletModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-left"
                    >
                      <UserCheck className="w-4 h-4 text-teal-400" />
                      <span>Switch Demo Role / Wallet</span>
                    </button>
                    <button
                      onClick={() => {
                        disconnectWallet();
                        setUserMenuOpen(false);
                        showToast('Wallet Disconnected', 'Logged out of current account.', 'info');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Disconnect Wallet</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-navy-950 px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-medium rounded-lg ${
                  location.pathname === link.path
                    ? 'text-teal-400 bg-teal-500/10'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Wallet Connection Modal */}
      <Modal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        title="Connect to BlockLoan"
        description="Choose your connection method. Real actions will run on the local Hardhat testnet."
      >
        <div className="space-y-4">
          {/* Method 1: MetaMask Extension */}
          <div className="p-4 rounded-xl border border-slate-700 bg-navy-850 hover:border-teal-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400">
                  🦊
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">MetaMask Browser Wallet</h4>
                  <p className="text-xs text-slate-400">Connect your local Web3 provider</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleMetaMaskConnect}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 transition-colors"
              >
                Connect
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Or Preview Demo Role</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Method 2: Demo Mode Roles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDemoSelect('borrower')}
              className="p-4 rounded-xl border border-slate-800 bg-navy-950 hover:border-teal-500/40 text-left transition-all"
            >
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Borrower Role</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Preview borrowing dashboards, loan creation, and repayments.</p>
              <span className="inline-block mt-3 text-[10px] font-mono text-slate-500">0x7099...79C8</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSelect('lender')}
              className="p-4 rounded-xl border border-slate-800 bg-navy-950 hover:border-teal-500/40 text-left transition-all"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Landmark className="w-4 h-4" />
                <span>Lender Role</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Preview market browsing, funding loans, and tracking returns.</p>
              <span className="inline-block mt-3 text-[10px] font-mono text-slate-500">0x90F7...b906</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-2">
            BlockLoan strictly operates on testnet cryptocurrency. Zero real funds or private keys are ever requested.
          </p>
        </div>
      </Modal>
    </>
  );
};
