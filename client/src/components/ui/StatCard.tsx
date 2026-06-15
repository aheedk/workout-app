import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtext?: string;
}

export function StatCard({ label, value, icon, subtext }: StatCardProps) {
  return (
    <div className="group relative plate p-5 overflow-hidden transition-colors hover:border-gray-300 dark:hover:border-gray-600">
      {/* Hairline accent stripe that ignites on hover. */}
      <span
        className="absolute inset-x-0 top-0 h-[2px] bg-blue-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {icon && <div className="text-blue-500">{icon}</div>}
      </div>
      <p className="mt-3 font-mono text-3xl font-bold tabular-nums leading-none text-gray-900 dark:text-white">
        {value}
      </p>
      {subtext && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{subtext}</p>
      )}
    </div>
  );
}
