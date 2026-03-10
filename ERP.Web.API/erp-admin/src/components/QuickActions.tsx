import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Package, RefreshCw, Tag, Percent, Plus,
  Settings, ChevronUp, ChevronDown, Eye, EyeOff, X,
} from 'lucide-react';

// ── Catalog (single source of truth) ──────────────────────────────────────────
const CATALOG = [
  { label: 'New Order',       icon: ShoppingCart, color: 'indigo',  path: '/orders'       },
  { label: 'New Product',     icon: Package,      color: 'violet',  path: '/products'     },
  { label: 'Add Stock',       icon: RefreshCw,    color: 'amber',   path: '/inventory'    },
  { label: 'Log Consumption', icon: Plus,         color: 'indigo',  path: '/consumptions' },
  { label: 'Add Tag',         icon: Tag,          color: 'emerald', path: '/tags'         },
  { label: 'New Promo',       icon: Percent,      color: 'emerald', path: '/promotions'   },
] as const;

type ActionLabel = typeof CATALOG[number]['label'];
type ActionConfig = { label: ActionLabel; enabled: boolean };

const STORAGE_KEY = 'erp-quick-actions';

const colorMap: Record<string, string> = {
  indigo:  'bg-indigo-500/10  ring-1 ring-indigo-500/20  text-indigo-400  hover:bg-indigo-500/20',
  violet:  'bg-violet-500/10  ring-1 ring-violet-500/20  text-violet-400  hover:bg-violet-500/20',
  amber:   'bg-amber-500/10   ring-1 ring-amber-500/20   text-amber-400   hover:bg-amber-500/20',
  emerald: 'bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20',
};

// ── Persistence helpers ────────────────────────────────────────────────────────
function loadConfig(): ActionConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: ActionConfig[] = JSON.parse(raw);
      // Keep saved order & enabled state; append any new catalog items at the end
      const known = new Set(saved.map(s => s.label));
      const extras = CATALOG
        .filter(c => !known.has(c.label))
        .map(c => ({ label: c.label, enabled: true }));
      return [...saved, ...extras];
    }
  } catch {
    // ignore parse errors
  }
  // Default: all enabled, in catalog order
  return CATALOG.map(c => ({ label: c.label, enabled: true }));
}

function saveConfig(cfg: ActionConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function QuickActions() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ActionConfig[]>(loadConfig);
  const [editing, setEditing] = useState(false);

  const update = (next: ActionConfig[]) => {
    setConfig(next);
    saveConfig(next);
  };

  const toggle = (label: ActionLabel) =>
    update(config.map(c => c.label === label ? { ...c, enabled: !c.enabled } : c));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...config];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  // Visible items for normal display mode
  const visible = config
    .filter(c => c.enabled)
    .map(c => CATALOG.find(a => a.label === c.label)!)
    .filter(Boolean);

  return (
    <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Quick Actions</h3>
        <button
          onClick={() => setEditing(v => !v)}
          className={`p-1.5 rounded-lg transition-colors ${
            editing
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title={editing ? 'Done editing' : 'Customize actions'}
        >
          {editing ? <X size={14} /> : <Settings size={14} />}
        </button>
      </div>

      {/* Normal mode: grid of enabled action chips */}
      {!editing && (
        <div className={`grid gap-2 ${visible.length <= 3 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'}`}>
          {visible.length === 0 ? (
            <p className="col-span-3 text-xs text-gray-400 dark:text-gray-500 text-center py-3">
              No hay acciones activas.{' '}
              <button
                onClick={() => setEditing(true)}
                className="underline hover:text-gray-600 dark:hover:text-gray-300"
              >
                Configurar
              </button>
            </p>
          ) : (
            visible.map(a => {
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
            })
          )}
        </div>
      )}

      {/* Edit mode: ordered list with reorder & visibility controls */}
      {editing && (
        <ul className="space-y-1.5">
          {config.map((cfg, i) => {
            const meta = CATALOG.find(a => a.label === cfg.label)!;
            if (!meta) return null;
            const Icon = meta.icon;
            const c = colorMap[meta.color];
            return (
              <li
                key={cfg.label}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                  cfg.enabled
                    ? 'border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-white/[0.03]'
                    : 'border-dashed border-gray-200 dark:border-gray-700/40 bg-transparent opacity-50'
                }`}
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Mover arriba"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === config.length - 1}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Mover abajo"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>

                {/* Icon chip */}
                <div className={`p-1.5 rounded-lg ${c}`}>
                  <Icon size={13} />
                </div>

                {/* Label */}
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {cfg.label}
                </span>

                {/* Visibility toggle */}
                <button
                  onClick={() => toggle(cfg.label)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    cfg.enabled
                      ? 'text-emerald-500 hover:bg-emerald-500/10'
                      : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  title={cfg.enabled ? 'Ocultar' : 'Mostrar'}
                >
                  {cfg.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
