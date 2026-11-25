import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const RiskBadge = ({ level = 'SAFE', size = 'md' }) => {
  const configs = {
    CRITICAL: {
      bg: 'bg-red-500/10 text-red-400 border-red-500/30',
      icon: ShieldAlert,
      label: 'CRITICAL',
    },
    HIGH: {
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      icon: AlertTriangle,
      label: 'HIGH RISK',
    },
    MEDIUM: {
      bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      icon: AlertCircle,
      label: 'MEDIUM RISK',
    },
    LOW: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: Info,
      label: 'LOW RISK',
    },
    SAFE: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: ShieldCheck,
      label: 'SAFE',
    },
  };

  const config = configs[level] || configs.SAFE;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold gap-1',
    md: 'px-2.5 py-1 text-sm font-semibold gap-1.5',
    lg: 'px-3 py-1.5 text-base font-bold gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span>{config.label}</span>
    </span>
  );
};

export default RiskBadge;
