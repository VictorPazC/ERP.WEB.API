import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Layers, Archive, Tag, Percent, Image,
  TrendingUp, AlertTriangle, Zap, ShoppingCart, RefreshCw,
  DollarSign, X, Plus, CheckCircle, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesApi } from '../api/categories';
import { productsApi } from '../api/products';
import { inventoryApi } from '../api/inventory';
import { tagsApi } from '../api/tags';
import { promotionsApi } from '../api/promotions';
import { productImagesApi } from '../api/productImages';
import { consumptionsApi } from '../api/consumptions';
import StatsCard from '../components/StatsCard';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import type { Inventory } from '../types';
import { imageUrl } from '../utils/imageUrl';

// ─── Product image thumbnail ─────────────────────────────────────────────────
function ProductThumb({ productId }: { productId: number }) {
  const { data: images } = useQuery({ queryKey: ['product-images'], queryFn: productImagesApi.getAll });
  const primary = images?.find(img => img.productId === productId && img.isPrimary)
    ?? images?.find(img => img.productId === productId);
  const src = primary ? imageUrl(primary.imagePath) : null;

  return (
    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800/60 flex-shrink-0 overflow-hidden flex items-center justify-center">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <Package size={18} className="text-gray-400 dark:text-gray-600" />
      )}
    </div>
  );
}

// ─── Restock modal ───────────────────────────────────────────────────────────
function RestockModal({ item, onClose }: { item: Inventory; onClose: () => void }) {
  const qc = useQueryClient();
  const [additional, setAdditional] = useState('1');
  const [keepRestock, setKeepRestock] = useState(false);
  const [loading, setLoading] = useState(false);

  const restockMut = useMutation({
    mutationFn: () => inventoryApi.restock(item.inventoryId, {
      additionalStock: Number(additional),
      needsRestock: keepRestock,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(`Stock updated: +${additional} units`);
      onClose();
    },
    onError: () => toast.error('Error adding stock'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(additional) < 1) return;
    setLoading(true);
    try { await restockMut.mutateAsync(); } finally { setLoading(false); }
  };

  const margin = item.suggestedRetailPrice - item.purchaseCost;
  const marginPct = item.purchaseCost > 0 ? (margin / item.purchaseCost * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/60 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800/60">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Stock</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <ProductThumb productId={item.productId} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.productName ?? `Product #${item.productId}`}</p>
              <div className="flex gap-3 mt-1.5 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-gray-400">Stock: <strong className="text-gray-900 dark:text-white">{item.currentStock}</strong></span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Cost: <strong className="text-gray-900 dark:text-white">${item.purchaseCost.toFixed(2)}</strong></span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Price: <strong className="text-emerald-600 dark:text-emerald-400">${item.suggestedRetailPrice.toFixed(2)}</strong></span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Margin: <strong className={marginPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>{marginPct.toFixed(1)}%</strong></span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Units to add</label>
              <input
                type="number"
                min="1"
                value={additional}
                onChange={e => setAdditional(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={keepRestock}
                onChange={e => setKeepRestock(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">
                Keep marked for restocking
              </span>
            </label>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-50">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                Add stock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [restockItem, setRestockItem] = useState<Inventory | null>(null);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });
  const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: inventoryApi.getAll });
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll });
  const { data: promotions } = useQuery({ queryKey: ['promotions'], queryFn: promotionsApi.getAll });
  const { data: images } = useQuery({ queryKey: ['product-images'], queryFn: productImagesApi.getAll });
  const { data: consumptions } = useQuery({ queryKey: ['consumptions'], queryFn: consumptionsApi.getAll });

  const activePromotions = promotions?.filter(p => p.isActive).length ?? 0;
  const totalStock = inventory?.reduce((s, i) => s + i.currentStock, 0) ?? 0;

  const sortedByProfit = [...(inventory ?? [])].sort((a, b) => b.estimatedProfit - a.estimatedProfit);
  const totalEstimatedProfit = sortedByProfit.reduce((s, i) => s + i.estimatedProfit, 0);
  const maxProfit = sortedByProfit[0]?.estimatedProfit ?? 1;

  const inventoryMap = new Map(inventory?.map(i => [i.inventoryId, i]) ?? []);
  const totalRealizedProfit = consumptions?.reduce((sum, c) => {
    const inv = inventoryMap.get(c.inventoryId);
    return inv ? sum + c.quantity * (inv.suggestedRetailPrice - inv.purchaseCost) : sum;
  }, 0) ?? 0;
  const totalConsumptions = consumptions?.reduce((s, c) => s + c.quantity, 0) ?? 0;

  const needsRestockItems = inventory?.filter(i => i.needsRestock) ?? [];
  const lowStockItems = inventory?.filter(i => i.currentStock < 10) ?? [];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="ERP system overview" />
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">

        {/* Stats row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard title="Products" value={products?.length ?? 0} icon={Package} color="indigo" />
          <StatsCard title="Total Stock" value={totalStock.toLocaleString()} icon={Archive} color="violet" />
          <StatsCard title="Realized Profit" value={`$${totalRealizedProfit.toFixed(2)}`} icon={DollarSign} color="emerald" />
          <div onClick={() => navigate('/consumptions')} className="cursor-pointer">
            <StatsCard title="Consumptions" value={totalConsumptions} icon={ShoppingCart} color="amber" />
          </div>
        </div>

        {/* Stats row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard title="Categories" value={categories?.length ?? 0} icon={Layers} color="indigo" />
          <StatsCard title="Tags" value={tags?.length ?? 0} icon={Tag} color="amber" />
          <StatsCard title="Active Promos" value={activePromotions} icon={Percent} color="indigo" />
          <StatsCard title="Images" value={images?.length ?? 0} icon={Image} color="emerald" />
        </div>

        {/* Needs restock panel */}
        {needsRestockItems.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/15 rounded-xl ring-1 ring-amber-500/30">
                <RefreshCw size={16} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Needs Restocking</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {needsRestockItems.length} {needsRestockItems.length === 1 ? 'item' : 'items'} to restock — click to add stock
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {needsRestockItems.map(item => (
                <button
                  key={item.inventoryId}
                  onClick={() => setRestockItem(item)}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900/60 border border-amber-200 dark:border-amber-500/20 rounded-xl hover:border-amber-400 dark:hover:border-amber-400/40 hover:shadow-md transition-all text-left group"
                >
                  <ProductThumb productId={item.productId} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName ?? `Product #${item.productId}`}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color={item.currentStock === 0 ? 'red' : 'yellow'}>{item.currentStock} units</Badge>
                      <span className="text-xs text-gray-400 dark:text-gray-600">${item.purchaseCost.toFixed(0)}</span>
                    </div>
                  </div>
                  <Plus size={16} className="text-amber-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Profit panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Realized profit */}
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl ring-1 ring-emerald-500/20">
                  <DollarSign size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Realized Profit</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-600">From recorded consumptions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">${totalRealizedProfit.toFixed(2)}</span>
                <button
                  onClick={() => navigate('/consumptions')}
                  className="text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors whitespace-nowrap"
                >
                  View all →
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {consumptions?.slice(0, 6).map(c => {
                const inv = inventoryMap.get(c.inventoryId);
                const profit = inv ? c.quantity * (inv.suggestedRetailPrice - inv.purchaseCost) : 0;
                return (
                  <div key={c.consumptionId} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{c.productName ?? `Product #${c.productId}`}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-600">
                        {c.quantity} units · {new Date(c.consumedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      ${profit.toFixed(2)}
                    </span>
                  </div>
                );
              })}
              {(!consumptions || consumptions.length === 0) && (
                <p className="text-gray-500 dark:text-gray-600 text-sm text-center py-6">No consumptions recorded yet</p>
              )}
            </div>
            {/* Total footer */}
            {consumptions && consumptions.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-800/60 mt-3 pt-3 flex items-center justify-between px-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 dark:text-gray-600 tabular-nums">{totalConsumptions} units</span>
                  <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    ${totalRealizedProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Estimated margin */}
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl ring-1 ring-indigo-500/20">
                  <TrendingUp size={16} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Estimated Margin</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-600">Per product in current stock</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">${totalEstimatedProfit.toFixed(2)}</span>
            </div>
            <div className="space-y-3">
              {sortedByProfit.slice(0, 6).map((inv, i) => (
                <div key={inv.inventoryId} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[11px] text-gray-400 dark:text-gray-600 w-4 tabular-nums flex-shrink-0">{i + 1}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-24 truncate flex-shrink-0">{inv.productName ?? `#${inv.productId}`}</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800/80 rounded-full overflow-hidden min-w-0">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                      style={{ width: `${Math.min((inv.estimatedProfit / (maxProfit || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white w-16 text-right tabular-nums flex-shrink-0">
                    ${inv.estimatedProfit.toFixed(2)}
                  </span>
                </div>
              ))}
              {(!inventory || inventory.length === 0) && (
                <p className="text-gray-500 dark:text-gray-600 text-sm text-center py-6">No inventory</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Active promotions */}
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-emerald-500/10 rounded-xl ring-1 ring-emerald-500/20">
                <Zap size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Active Promotions</h3>
                <p className="text-xs text-gray-500 dark:text-gray-600">{activePromotions} running now</p>
              </div>
            </div>
            <div className="space-y-1">
              {promotions?.filter(p => p.isActive).slice(0, 5).map(p => (
                <div key={p.promoId} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate min-w-0">{p.productName ?? `Product #${p.productId}`}</span>
                  <Badge color="green">{p.discountPercentage ?? 0}% OFF</Badge>
                </div>
              ))}
              {activePromotions === 0 && <p className="text-gray-500 dark:text-gray-600 text-sm text-center py-6">No active promotions</p>}
            </div>
          </div>

          {/* Low stock — clickable to restock */}
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-red-500/10 rounded-xl ring-1 ring-red-500/20">
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Low Stock</h3>
                <p className="text-xs text-gray-500 dark:text-gray-600">Less than 10 units — click to add stock</p>
              </div>
            </div>
            <div className="space-y-1">
              {lowStockItems.slice(0, 5).map(i => (
                <button
                  key={i.inventoryId}
                  onClick={() => setRestockItem(i)}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors gap-2 group text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {i.needsRestock
                      ? <CheckCircle size={14} className="text-amber-500 flex-shrink-0" />
                      : <XCircle size={14} className="text-gray-300 dark:text-gray-700 flex-shrink-0" />
                    }
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{i.productName ?? `Product #${i.productId}`}</span>
                  </div>
                  <Badge color={i.currentStock === 0 ? 'red' : 'yellow'}>{i.currentStock} units</Badge>
                </button>
              ))}
              {lowStockItems.length === 0 && (
                <p className="text-gray-500 dark:text-gray-600 text-sm text-center py-6">All products well stocked</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {restockItem && (
        <RestockModal item={restockItem} onClose={() => setRestockItem(null)} />
      )}
    </div>
  );
}
