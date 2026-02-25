import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Search, CheckCircle, Package, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { consumptionsApi } from '../api/consumptions';
import type { AvailableArticle, CreateConsumptionDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';

function ConsumeModal({ article, onClose }: {
  article: AvailableArticle;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const consumeMut = useMutation({
    mutationFn: (dto: CreateConsumptionDto) => consumptionsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['available-articles'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(`"${article.productName}" marked as consumed`);
      onClose();
    },
    onError: () => toast.error('Failed to register consumption'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1 || quantity > article.currentStock) return;
    setLoading(true);
    try {
      await consumeMut.mutateAsync({
        inventoryId: article.inventoryId,
        quantity,
        consumedAt: new Date(date + 'T12:00:00').toISOString(),
        notes: notes.trim() || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl ring-1 ring-indigo-500/20">
        <div className="p-2 bg-indigo-500/10 rounded-lg flex-shrink-0">
          <Package size={16} className="text-indigo-500 dark:text-indigo-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{article.productName}</p>
          {article.categoryName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{article.categoryName}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Available stock: <span className="font-semibold text-gray-700 dark:text-gray-300">{article.currentStock} units</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Quantity *</label>
          <input
            type="number"
            min={1}
            max={article.currentStock}
            value={quantity}
            onChange={e => setQuantity(Math.max(1, Math.min(article.currentStock, Number(e.target.value))))}
            className="bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date *</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Reason or notes..."
          className="bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          <CheckCircle size={14} />
          {loading ? 'Saving...' : 'Mark as Consumed'}
        </button>
      </div>
    </form>
  );
}

export default function ArticulosDisponibles() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [consuming, setConsuming] = useState<AvailableArticle | null>(null);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['available-articles'],
    queryFn: consumptionsApi.getAvailable,
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    articles?.forEach(a => { if (a.categoryName) cats.add(a.categoryName); });
    return Array.from(cats).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    return articles?.filter(a => {
      const matchesSearch = !search ||
        a.productName.toLowerCase().includes(search.toLowerCase()) ||
        (a.categoryName?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesCategory = !categoryFilter || a.categoryName === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [articles, search, categoryFilter]);

  const stockColor = (stock: number): 'green' | 'yellow' | 'red' =>
    stock >= 10 ? 'green' : stock >= 3 ? 'yellow' : 'red';

  return (
    <div>
      <PageHeader
        title="Available Articles"
        subtitle={`${filtered?.length ?? 0} of ${articles?.length ?? 0} items`}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or category..."
              className="w-full bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>
          {categories.length > 0 && (
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="pl-8 pr-4 py-2.5 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none min-w-[160px]"
              >
                <option value="">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        {isLoading ? <LoadingSpinner /> : filtered?.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={articles?.length === 0 ? 'No available articles' : 'No results found'}
            description={articles?.length === 0 ? 'Add inventory with stock to see available articles' : 'Try adjusting your search or category filter'}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800/60">
                    {['Article', 'Category', 'Stock', 'Cost', 'Price', ''].map(h => (
                      <th key={h} className="text-left px-6 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                  {filtered?.map(a => (
                    <tr key={a.inventoryId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800/60 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700/30 flex-shrink-0">
                            <Package size={14} className="text-gray-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{a.productName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{a.categoryName ?? '—'}</td>
                      <td className="px-6 py-4">
                        <Badge color={stockColor(a.currentStock)}>{a.currentStock} units</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 tabular-nums">${a.purchaseCost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white tabular-nums">${a.suggestedRetailPrice.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setConsuming(a)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs font-medium transition-colors"
                          >
                            <CheckCircle size={12} /> Consume
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered?.map(a => (
                <div key={a.inventoryId} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800/60 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700/30 flex-shrink-0">
                        <Package size={14} className="text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.productName}</p>
                        {a.categoryName && (
                          <p className="text-xs text-gray-500 dark:text-gray-600 mt-0.5">{a.categoryName}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setConsuming(a)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs font-medium transition-colors flex-shrink-0"
                    >
                      <CheckCircle size={12} /> Consume
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge color={stockColor(a.currentStock)}>{a.currentStock} units</Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-600">Cost: ${a.purchaseCost.toFixed(2)}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Price: ${a.suggestedRetailPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {consuming && (
        <Modal title="Register Consumption" onClose={() => setConsuming(null)}>
          <ConsumeModal article={consuming} onClose={() => setConsuming(null)} />
        </Modal>
      )}
    </div>
  );
}
