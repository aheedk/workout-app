import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] uppercase leading-[0.95] tracking-wide text-gray-900 dark:text-white truncate">
          {title}
        </h1>
        <div className="mt-3 h-[3px] w-12 bg-blue-500" />
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
