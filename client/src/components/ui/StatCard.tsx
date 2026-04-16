import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtext?: string;
}

export function StatCard({ label, value, icon, subtext }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtext && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtext}</p>
          )}
        </div>
        {icon && <div className="text-blue-600 dark:text-blue-400">{icon}</div>}
      </div>
    </div>
  );
}
