import React from 'react';
import { LoanStatus } from '../types';

interface StatusBadgeProps {
  status: LoanStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ACTIVE':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DEFAULTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'CANCELLED':
        return 'bg-slate-700/20 text-slate-400 border-slate-700/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getDotStyle = () => {
    switch (status) {
      case 'OPEN': return 'bg-amber-400';
      case 'ACTIVE': return 'bg-teal-400';
      case 'COMPLETED': return 'bg-emerald-400';
      case 'DEFAULTED': return 'bg-rose-400';
      case 'CANCELLED': return 'bg-slate-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full capitalize ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm'
      } ${getBadgeStyle()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotStyle()}`} />
      {status}
    </span>
  );
};
