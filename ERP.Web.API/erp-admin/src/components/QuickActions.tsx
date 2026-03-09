import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, RefreshCw, Tag, Percent, Plus } from 'lucide-react';

const actions = [
  { label: 'New Order',       icon: ShoppingCart, color: 'indigo',  path: '/orders'       },
  { label: 'New Product',     icon: Package,      color: 'violet',  path: '/products'     },
  { label: 'Add Stock',       icon: RefreshCw,    color: 'amber',   path: '/inventory'    },
  { label: 'Log Consumption', icon: Plus,         color: 'indigo',  path: '/consumptions' },
  { label: 'Add Tag',         icon: Tag,          color: 'emerald', path: '/tags'         },
  { label: 'New Promo',       icon: Percent,      color: 'emerald', path: '/promotions'   },
] as const;

const colorMap = {
  indigo:  'bg-indigo-500/10  ring-1 ring-indigo-500/20  text-indigo-400  hover:bg-indigo-500/20',
  violet:  'bg-violet-500/10  ring-1 ring-violet-500/20  text-violet-400  hover:bg-violet-500/20',
  amber:   'bg-amber-500/10   ring-1 ring-amber-500/20   text-amber-400   hover:bg-amber-500/20',
  emerald: 'bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20',
};

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6">
      <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {actions.map(a => {
          const c = colorMap[a.color];
          return (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${c}`}
            >
              <a.icon size={18} />
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                {a.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
