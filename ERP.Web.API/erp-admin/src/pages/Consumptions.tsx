import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Trash2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { consumptionsApi } from '../api/consumptions';
import { inventoryApi } from '../api/inventory';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge from '../components/Badge';
import { useUser } from '../context/UserContext';
import type { Consumption } from '../types';

const todayStr = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

type Preset = 'today' | 'week' | 'month' | 'all';

const presets: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

export default function Consumptions() {
  const qc = useQueryClient();
  const { isAdmin } = useUser();

  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(todayStr());
  const [deleting, setDeleting] = useState<Consumption | null>(null);

  const { data: consumptions, isLoading } = useQuery({
    queryKey: ['consumptions'],
    queryFn: consumptionsApi.getAll,
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryApi.getAll,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => consumptionsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consumptions'] });
      toast.success('Consumption deleted');
      setDeleting(null);
    },
    onError: () => toast.error('Error deleting consumption'),
  });

  const inventoryMap = useMemo(
    () => new Map(inventory?.map(i => [i.inventoryId, i]) ?? []),
    [inventory]
  );

  const filtered = useMemo(() => {
    if (!consumptions) return [];
    return consumptions.filter(c => {
      const d = c.consumedAt.slice(0, 10);
      return d >= dateFrom && d <= dateTo;
    });
  }, [consumptions, dateFrom, dateTo]);

  const totalUnits = filtered.reduce((s, c) => s + c.quantity, 0);
  const totalProfit = filtered.reduce((s, c) => {
    const inv = inventoryMap.get(c.inventoryId);
    return inv ? s + c.quantity * (inv.suggestedRetailPrice - inv.purchaseCost) : s;
  }, 0);

  const applyPreset = (p: Preset) => {
    const t = todayStr();
    if (p === 'today') {
      setDateFrom(t); setDateTo(t);
    } else if (p === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      setDateFrom(d.toISOString().slice(0, 10));
      setDateTo(t);
    } else if (p === 'month') {
      setDateFrom(firstOfMonth()); setDateTo(t);
    } else {
      setDateFrom('2000-01-01'); setDateTo(t);
    }
  };

  return (
    <div>
      <PageHeader
        title="Consumptions"
        subtitle={`${filtered.length} records · $${totalProfit.toFixed(2)} profit`}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">

        {/* ── Filters ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {presets.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-800/60"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Summary stats ────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium tracking-wider">Records</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1.5 tabular-nums">{filtered.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium tracking-wider">Units</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1.5 tabular-nums">{totalUnits.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 uppercase font-medium tracking-wider">Profit</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">${totalProfit.toFixed(2)}</p>
          </div>
        </div>

        {/* ── Table / Cards ────────────────────────────────────── */}
        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No consumptions"
            description="No records match the selected date range"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800/60">
                    {['Product', 'Category', 'Qty', 'Profit', 'Date', 'Notes', ''].map(h => (
                      <th key={h} className="text-left px-6 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                  {filtered.map(c => {
                    const inv = inventoryMap.get(c.inventoryId);
                    const profit = inv ? c.quantity * (inv.suggestedRetailPrice - inv.purchaseCost) : 0;
                    return (
                      <tr key={c.consumptionId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {c.productName ?? `Product #${c.productId}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {c.categoryName ?? '—'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge color="indigo">{c.quantity}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold tabular-nums">
                          <span className={profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                            ${profit.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-600 tabular-nums">
                          {new Date(c.consumedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[180px] truncate">
                          {c.notes || '—'}
                        </td>
                        <td className="px-6 py-4">
                          {isAdmin && (
                            <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setDeleting(c)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Total footer */}
                <tfoot>
                  <tr className="border-t-2 border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-white/[0.02]">
                    <td className="px-6 py-3 text-sm font-bold text-gray-900 dark:text-white" colSpan={2}>
                      Total
                    </td>
                    <td className="px-6 py-3">
                      <Badge color="indigo">{totalUnits}</Badge>
                    </td>
                    <td className="px-6 py-3 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400" colSpan={4}>
                      ${totalProfit.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(c => {
                const inv = inventoryMap.get(c.inventoryId);
                const profit = inv ? c.quantity * (inv.suggestedRetailPrice - inv.purchaseCost) : 0;
                return (
                  <div key={c.consumptionId} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {c.productName ?? `Product #${c.productId}`}
                        </p>
                        {c.categoryName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.categoryName}</p>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setDeleting(c)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge color="indigo">{c.quantity} units</Badge>
                      <span className={`text-sm font-semibold tabular-nums ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        ${profit.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-600 ml-auto tabular-nums">
                        {new Date(c.consumedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {c.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">{c.notes}</p>
                    )}
                  </div>
                );
              })}

              {/* Mobile total */}
              <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Total profit</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{totalUnits} units consumed</p>
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">${totalProfit.toFixed(2)}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {isAdmin && deleting && (
        <ConfirmDialog
          message={`Delete consumption of "${deleting.productName}" (${deleting.quantity} units)? This action cannot be undone.`}
          onConfirm={() => deleteMut.mutate(deleting.consumptionId)}
          onClose={() => setDeleting(null)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
}
