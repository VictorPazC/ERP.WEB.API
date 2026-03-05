import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="sticky top-0 lg:top-0 z-10 glass border-b border-gray-200 dark:border-gray-800/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
