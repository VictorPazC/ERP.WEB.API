import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="sticky top-0 z-10 glass border-b border-gray-800/60">
      <div className="flex items-center justify-between px-8 py-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
