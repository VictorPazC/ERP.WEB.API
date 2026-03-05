import { useState } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Percent, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { promotionsApi } from '../api/promotions';
import { productsApi } from '../api/products';
import type { Promotion, CreatePromotionDto, UpdatePromotionDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { useUser } from '../context/UserContext';

const selectCls = "bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all";

function PromotionForm({ initial, onSave, onClose }: {
  initial?: Promotion;
  onSave: (data: CreatePromotionDto | UpdatePromotionDto) => Promise<void>;
  onClose: () => void;
}) {
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });
  const [form, setForm] = useState({
    productId: initial?.productId?.toString() ?? '',
    discountPercentage: initial?.discountPercentage?.toString() ?? '',
    startDate: initial?.startDate?.slice(0, 10) ?? '',
    endDate: initial?.endDate?.slice(0, 10) ?? '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial) {
        await onSave({ promoId: initial.promoId, discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : undefined, startDate: form.startDate, endDate: form.endDate } as UpdatePromotionDto);
      } else {
        await onSave({ productId: Number(form.productId), discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : undefined, startDate: form.startDate, endDate: form.endDate } as CreatePromotionDto);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initial && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Product *</label>
          <select value={form.productId} onChange={set('productId')} required className={selectCls}>
            <option value="">Select product</option>
            {products?.map(p => <option key={p.productId} value={p.productId}>{p.name}</option>)}
          </select>
        </div>
      )}
      <FormField label="Discount %" value={form.discountPercentage} onChange={set('discountPercentage')} type="number" step="0.01" min="0" max="100" placeholder="e.g. 15.50" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Start Date *" value={form.startDate} onChange={set('startDate')} type="date" required />
        <FormField label="End Date *" value={form.endDate} onChange={set('endDate')} type="date" required />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function Promotions() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState<Promotion | null>(null);
  const [filter, setFilter] = useState<'all' | 'active'>('all');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['promotions'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => promotionsApi.getAll(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
  const allPromos = data?.pages.flatMap(p => p.items) ?? [];
  const promotions = filter === 'active' ? allPromos.filter(p => p.isActive) : allPromos;
  const { isAdmin } = useUser();

  const createMut = useMutation({ mutationFn: (dto: CreatePromotionDto) => promotionsApi.create(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Promotion created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: UpdatePromotionDto }) => promotionsApi.update(id, dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Promotion updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => promotionsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); toast.success('Promotion deleted'); setDeleting(null); } });

  const handleSave = async (data: CreatePromotionDto | UpdatePromotionDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.promoId, dto: data as UpdatePromotionDto });
    else await createMut.mutateAsync(data as CreatePromotionDto);
  };

  return (
    <div>
      <PageHeader
        title="Promotions"
        subtitle={`${allPromos.length} total · ${allPromos.filter(p => p.isActive).length} active`}
        action={
          isAdmin ? (
            <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
              <Plus size={16} /> New Promotion
            </button>
          ) : undefined
        }
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="flex gap-2">
          {(['all', 'active'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20'
                  : 'bg-white dark:bg-gray-900/60 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {f === 'all' ? 'All' : 'Active Only'}
            </button>
          ))}
        </div>
        {isLoading ? <LoadingSpinner /> : promotions.length === 0 ? (
          <EmptyState icon={Percent} title="No promotions found" description="Create promotions to offer discounts on your products" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {promotions.map(promo => (
              <div key={promo.promoId} className={`bg-white dark:bg-gray-900/60 border rounded-2xl p-4 sm:p-5 hover:border-gray-300 dark:hover:border-gray-700/60 transition-all duration-200 group ${promo.isActive ? 'border-emerald-500/20' : 'border-gray-200 dark:border-gray-800/60'}`}>
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={`p-2 sm:p-2.5 rounded-xl ring-1 flex-shrink-0 ${promo.isActive ? 'bg-emerald-500/10 ring-emerald-500/20' : 'bg-gray-100 dark:bg-gray-800/60 ring-gray-200 dark:ring-gray-700/30'}`}>
                      <Percent size={16} className={promo.isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-500'} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{promo.productName ?? `Product #${promo.productId}`}</p>
                      <Badge color={promo.isActive ? 'green' : 'gray'}>{promo.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => { setSelected(promo); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setDeleting(promo)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-3 tabular-nums">{promo.discountPercentage ?? 0}<span className="text-lg text-gray-500">%</span></div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-600">
                  <Calendar size={12} />
                  <span className="tabular-nums">{new Date(promo.startDate).toLocaleDateString()} — {new Date(promo.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {hasNextPage && (
          <div className="flex justify-center p-4 border-t border-gray-100 dark:border-gray-800/40">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
            </button>
          </div>
        )}
      </div>

      {isAdmin && (modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Promotion' : 'New Promotion'} onClose={() => setModal(null)}>
          <PromotionForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {isAdmin && deleting && (
        <ConfirmDialog message={`Delete promotion for "${deleting.productName}"?`} onConfirm={() => deleteMut.mutate(deleting.promoId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
