import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { CriticalInventory } from '../types';

interface Props {
  items: CriticalInventory[];
}

export default function AlertBanner({ items }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || items.length === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
      <div className="p-1.5 bg-red-500/15 rounded-lg ring-1 ring-red-500/30 flex-shrink-0 mt-0.5">
        <AlertTriangle size={14} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
          {items.length} {items.length === 1 ? 'product' : 'products'} at critical stock level
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {items.map(i => (
            <span
              key={i.inventoryId}
              className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 rounded-lg font-medium"
            >
              {i.productName ?? `#${i.productId}`} — {i.currentStock} units
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
