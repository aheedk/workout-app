import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white min-w-0 truncate">
        {title}
      </h1>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
