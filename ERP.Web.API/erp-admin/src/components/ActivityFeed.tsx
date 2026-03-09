import { ShoppingCart, RefreshCw, Package } from 'lucide-react';
import type { ActivityLog } from '../types';

const iconMap: Record<string, React.ReactNode> = {
  order_created:   <ShoppingCart size={14} className="text-indigo-400" />,
  order_confirmed: <ShoppingCart size={14} className="text-emerald-400" />,
  restock:         <RefreshCw   size={14} className="text-amber-400"   />,
  consumption:     <Package     size={14} className="text-violet-400"  />,
};

const bgMap: Record<string, string> = {
  order_created:   'bg-indigo-500/10 ring-indigo-500/20',
  order_confirmed: 'bg-emerald-500/10 ring-emerald-500/20',
  restock:         'bg-amber-500/10 ring-amber-500/20',
  consumption:     'bg-violet-500/10 ring-violet-500/20',
};

interface Props {
  items: ActivityLog[];
}

export default function ActivityFeed({ items }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6 h-full">
      <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-4">Recent Activity</h3>
      {items.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-600 text-sm text-center py-8">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <div key={a.activityLogId} className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg ring-1 flex-shrink-0 mt-0.5 ${bgMap[a.type] ?? 'bg-gray-500/10 ring-gray-500/20'}`}>
                {iconMap[a.type] ?? <Package size={14} className="text-gray-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">{a.title}</p>
                {a.description && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-600 truncate">{a.description}</p>
                )}
                <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">
                  {new Date(a.timestamp).toLocaleString('en-US', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              {a.amount != null && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums flex-shrink-0">
                  ${a.amount.toFixed(2)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
