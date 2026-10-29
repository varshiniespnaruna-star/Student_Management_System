import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  highlight?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-sm ${
        highlight ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h4>
        {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      </div>

      {trend && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
          {trend.label && <span className="text-slate-400">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
