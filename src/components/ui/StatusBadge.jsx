import React from 'react';

const STATUS_CONFIG = {
  pending: {
    label: 'PENDING',
    dotClass: 'bg-yellow-500 animate-pulse',
    textClass: 'text-yellow-500',
    bgClass: 'bg-yellow-500/10',
  },
  approved: {
    label: 'APPROVED',
    dotClass: 'bg-green-500',
    textClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
  },
  rejected: {
    label: 'REJECTED',
    dotClass: 'bg-red-500',
    textClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
  },
  reapplied: {
    label: 'RE-APPLIED',
    dotClass: 'bg-blue-500 animate-pulse',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
  },
  withdrawn: {
    label: 'WITHDRAWN',
    dotClass: 'bg-[#9a8f7f]',
    textClass: 'text-[#9a8f7f]',
    bgClass: 'bg-[#9a8f7f]/10',
  },
  awaiting: {
    label: 'PENDING',
    dotClass: 'bg-yellow-500 animate-pulse',
    textClass: 'text-yellow-500',
    bgClass: 'bg-yellow-500/10',
  },
  upcoming: {
    label: 'UPCOMING',
    dotClass: 'bg-blue-400',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-400/10',
  },
  registrations_open: {
    label: 'REG OPEN',
    dotClass: 'bg-[#f9d07a] animate-pulse',
    textClass: 'text-[#f9d07a]',
    bgClass: 'bg-[#f9d07a]/10',
  },
  registrations_closed: {
    label: 'REG CLOSED',
    dotClass: 'bg-red-400',
    textClass: 'text-red-400',
    bgClass: 'bg-red-400/10',
  },
  in_progress: {
    label: 'IN PROGRESS',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
  },
  completed: {
    label: 'COMPLETED',
    dotClass: 'bg-[#9a8f7f]',
    textClass: 'text-[#9a8f7f]',
    bgClass: 'bg-[#9a8f7f]/10',
  },
};

/**
 * StatusBadge — colored status indicator for registrations/tournaments.
 */
export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || {
    label: status?.toUpperCase() || 'UNKNOWN',
    dotClass: 'bg-[#9a8f7f]',
    textClass: 'text-[#9a8f7f]',
    bgClass: 'bg-[#9a8f7f]/10',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 ${config.bgClass} border border-white/5 ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} shadow-md`} />
      <span className={`font-teko text-[16px] tracking-widest ${config.textClass} uppercase font-medium`}>
        {config.label}
      </span>
    </div>
  );
}
