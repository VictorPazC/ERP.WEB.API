import { useQuery } from '@tanstack/react-query';
import { Package, Layers, Archive, Tag, Percent, Image, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { categoriesApi } from '../api/categories';
import { productsApi } from '../api/products';
import { inventoryApi } from '../api/inventory';
import { tagsApi } from '../api/tags';
import { promotionsApi } from '../api/promotions';
import { productImagesApi } from '../api/productImages';
import StatsCard from '../components/StatsCard';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

export default function Dashboard() {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });
  const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: inventoryApi.getAll });
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll });
  const { data: promotions } = useQuery({ queryKey: ['promotions'], queryFn: promotionsApi.getAll });
  const { data: images } = useQuery({ queryKey: ['product-images'], queryFn: productImagesApi.getAll });

  const activePromotions = promotions?.filter(p => p.isActive).length ?? 0;
  const totalStock = inventory?.reduce((s, i) => s + i.currentStock, 0) ?? 0;
  const totalProfit = inventory?.reduce((s, i) => s + i.estimatedProfit, 0) ?? 0;
  const maxProfit = inventory?.reduce((max, i) => Math.max(max, i.estimatedProfit), 0) ?? 1;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your ERP system" />
      <div className="p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatsCard title="Categories" value={categories?.length ?? 0} icon={Layers} color="indigo" />
          <StatsCard title="Products" value={products?.length ?? 0} icon={Package} color="emerald" />
          <StatsCard title="Total Stock" value={totalStock.toLocaleString()} icon={Archive} color="violet" />
          <StatsCard title="Tags" value={tags?.length ?? 0} icon={Tag} color="amber" />
          <StatsCard title="Active Promos" value={activePromotions} icon={Percent} color="indigo" />
          <StatsCard title="Product Images" value={images?.length ?? 0} icon={Image} color="emerald" />
        </div>

        {/* Profit Chart */}
        <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl ring-1 ring-indigo-500/20">
                <TrendingUp size={16} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Estimated Profit per Product</h3>
                <p className="text-xs text-gray-600">Top performing products by margin</p>
              </div>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">${totalProfit.toFixed(2)}</span>
          </div>
          <div className="space-y-3">
            {inventory?.slice(0, 8).map((inv, i) => (
              <div key={inv.inventoryId} className="flex items-center gap-3 group">
                <span className="text-[11px] text-gray-600 w-5 tabular-nums">{i + 1}</span>
                <span className="text-sm text-gray-400 w-36 truncate">{inv.productName ?? `Product #${inv.productId}`}</span>
                <div className="flex-1 h-2 bg-gray-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${Math.min((inv.estimatedProfit / (maxProfit || 1)) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white w-24 text-right tabular-nums">
                  ${inv.estimatedProfit.toFixed(2)}
                </span>
              </div>
            ))}
            {(!inventory || inventory.length === 0) && (
              <p className="text-gray-600 text-sm text-center py-8">No inventory data yet</p>
            )}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Active Promotions */}
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-emerald-500/10 rounded-xl ring-1 ring-emerald-500/20">
                <Zap size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Active Promotions</h3>
                <p className="text-xs text-gray-600">{activePromotions} running now</p>
              </div>
            </div>
            <div className="space-y-1">
              {promotions?.filter(p => p.isActive).slice(0, 5).map(p => (
                <div key={p.promoId} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm text-gray-300 truncate">{p.productName ?? `Product #${p.productId}`}</span>
                  <Badge color="green">{p.discountPercentage ?? 0}% OFF</Badge>
                </div>
              ))}
              {activePromotions === 0 && <p className="text-gray-600 text-sm text-center py-8">No active promotions</p>}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-amber-500/10 rounded-xl ring-1 ring-amber-500/20">
                <AlertTriangle size={16} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Low Stock Alert</h3>
                <p className="text-xs text-gray-600">Products below 10 units</p>
              </div>
            </div>
            <div className="space-y-1">
              {inventory?.filter(i => i.currentStock < 10).slice(0, 5).map(i => (
                <div key={i.inventoryId} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm text-gray-300 truncate">{i.productName ?? `Product #${i.productId}`}</span>
                  <Badge color={i.currentStock === 0 ? 'red' : 'yellow'}>{i.currentStock} units</Badge>
                </div>
              ))}
              {!inventory?.some(i => i.currentStock < 10) && (
                <p className="text-gray-600 text-sm text-center py-8">All products well stocked</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
