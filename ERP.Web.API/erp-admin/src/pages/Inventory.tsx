import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Archive, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../api/inventory';
import { productsApi } from '../api/products';
import type { Inventory, CreateInventoryDto, UpdateInventoryDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';

function InventoryForm({ initial, onSave, onClose }: {
  initial?: Inventory;
  onSave: (data: CreateInventoryDto | UpdateInventoryDto) => Promise<void>;
  onClose: () => void;
}) {
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });
  const [form, setForm] = useState({
    productId: initial?.productId?.toString() ?? '',
    purchaseCost: initial?.purchaseCost?.toString() ?? '',
    suggestedRetailPrice: initial?.suggestedRetailPrice?.toString() ?? '',
    currentStock: initial?.currentStock?.toString() ?? '0',
    lastRestockDate: initial?.lastRestockDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    lastSaleDate: initial?.lastSaleDate?.slice(0, 10) ?? '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial) {
        await onSave({ inventoryId: initial.inventoryId, purchaseCost: Number(form.purchaseCost), suggestedRetailPrice: Number(form.suggestedRetailPrice), currentStock: Number(form.currentStock), lastRestockDate: form.lastRestockDate, lastSaleDate: form.lastSaleDate || undefined } as UpdateInventoryDto);
      } else {
        await onSave({ productId: Number(form.productId), purchaseCost: Number(form.purchaseCost), suggestedRetailPrice: Number(form.suggestedRetailPrice), currentStock: Number(form.currentStock), lastRestockDate: form.lastRestockDate, lastSaleDate: form.lastSaleDate || undefined } as CreateInventoryDto);
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
          <label className="text-sm font-medium text-gray-400">Product *</label>
          <select value={form.productId} onChange={set('productId')} required className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-gray-600 transition-all">
            <option value="">Select product</option>
            {products?.map(p => <option key={p.productId} value={p.productId}>{p.name}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Purchase Cost *" value={form.purchaseCost} onChange={set('purchaseCost')} type="number" step="0.01" min="0" placeholder="0.00" required />
        <FormField label="Retail Price *" value={form.suggestedRetailPrice} onChange={set('suggestedRetailPrice')} type="number" step="0.01" min="0" placeholder="0.00" required />
      </div>
      <FormField label="Current Stock *" value={form.currentStock} onChange={set('currentStock')} type="number" min="0" placeholder="0" required />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Last Restock Date" value={form.lastRestockDate} onChange={set('lastRestockDate')} type="date" />
        <FormField label="Last Sale Date" value={form.lastSaleDate} onChange={set('lastSaleDate')} type="date" />
      </div>
      {form.purchaseCost && form.suggestedRetailPrice && (
        <div className="bg-indigo-500/10 ring-1 ring-indigo-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-400" />
          <span className="text-sm text-indigo-300">Estimated Profit: <strong className="text-indigo-200">${(Number(form.suggestedRetailPrice) - Number(form.purchaseCost)).toFixed(2)}</strong></span>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-700/60 rounded-xl text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Inventory | null>(null);
  const [deleting, setDeleting] = useState<Inventory | null>(null);

  const { data: inventory, isLoading } = useQuery({ queryKey: ['inventory'], queryFn: inventoryApi.getAll });

  const createMut = useMutation({ mutationFn: (dto: CreateInventoryDto) => inventoryApi.create(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Inventory created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: UpdateInventoryDto }) => inventoryApi.update(id, dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Inventory updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => inventoryApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Inventory deleted'); setDeleting(null); } });

  const handleSave = async (data: CreateInventoryDto | UpdateInventoryDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.inventoryId, dto: data as UpdateInventoryDto });
    else await createMut.mutateAsync(data as CreateInventoryDto);
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${inventory?.length ?? 0} records`}
        action={
          <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> Add Inventory
          </button>
        }
      />
      <div className="p-8">
        {isLoading ? <LoadingSpinner /> : inventory?.length === 0 ? (
          <EmptyState icon={Archive} title="No inventory records" description="Add your first inventory record" />
        ) : (
          <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/60">
                  {['Product', 'Cost', 'Retail Price', 'Profit', 'Stock', 'Last Restock', ''].map(h => (
                    <th key={h} className="text-left px-6 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {inventory?.map(inv => (
                  <tr key={inv.inventoryId} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-white">{inv.productName ?? `#${inv.productId}`}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 tabular-nums">${inv.purchaseCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 tabular-nums">${inv.suggestedRetailPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-400 tabular-nums">+${inv.estimatedProfit.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Badge color={inv.currentStock === 0 ? 'red' : inv.currentStock < 10 ? 'yellow' : 'green'}>{inv.currentStock} units</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 tabular-nums">{new Date(inv.lastRestockDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelected(inv); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => setDeleting(inv)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Inventory' : 'Add Inventory'} onClose={() => setModal(null)}>
          <InventoryForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog message={`Delete inventory for "${deleting.productName}"?`} onConfirm={() => deleteMut.mutate(deleting.inventoryId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
