import type { TopProduct } from '../types';

type Metric = 'revenue' | 'units' | 'consumptions';

const metricLabels: Record<Metric, string> = {
  revenue:      'Revenue',
  units:        'Units',
  consumptions: 'Consumed',
};

interface Props {
  items: TopProduct[];
  metric: Metric;
  onMetricChange: (m: Metric) => void;
}

export default function TopProductsList({ items, metric, onMetricChange }: Props) {
  const max = items[0]?.value ?? 1;

  return (
    <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Top Products</h3>
        <div className="flex gap-1">
          {(['revenue', 'units', 'consumptions'] as Metric[]).map(m => (
            <button
              key={m}
              onClick={() => onMetricChange(m)}
              className={`text-[11px] px-2 py-1 rounded-lg font-medium transition-colors ${
                metric === m
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {metricLabels[m]}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-600 text-sm text-center py-6">No data yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((p, i) => (
            <div key={p.productId} className="flex items-center gap-2 sm:gap-3">
              <span className="text-[11px] text-gray-400 dark:text-gray-600 w-4 tabular-nums flex-shrink-0">{i + 1}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 w-24 truncate flex-shrink-0">{p.name}</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800/80 rounded-full overflow-hidden min-w-0">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${Math.min((p.value / (max || 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white w-16 text-right tabular-nums flex-shrink-0">
                {metric === 'revenue' ? `$${p.value.toFixed(2)}` : p.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
