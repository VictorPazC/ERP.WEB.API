import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Package, ExternalLink, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';

const selectCls = "bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all";

function ProductForm({ initial, onSave, onClose }: {
  initial?: Product;
  onSave: (data: CreateProductDto | UpdateProductDto) => Promise<void>;
  onClose: () => void;
}) {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll });
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    brand: initial?.brand ?? '',
    referenceLink: initial?.referenceLink ?? '',
    purchaseLocation: initial?.purchaseLocation ?? '',
    categoryId: initial?.categoryId?.toString() ?? '',
    status: initial?.status ?? 'Active',
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const base = {
        name: form.name,
        description: form.description || undefined,
        brand: form.brand || undefined,
        referenceLink: form.referenceLink || undefined,
        purchaseLocation: form.purchaseLocation || undefined,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      };
      if (initial) {
        await onSave({ ...base, productId: initial.productId, status: form.status } as UpdateProductDto);
      } else {
        await onSave(base as CreateProductDto);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Name *" value={form.name} onChange={set('name')} placeholder="Product name" required />
      <FormField label="Description" value={form.description} onChange={set('description')} placeholder="Optional description" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Brand" value={form.brand} onChange={set('brand')} placeholder="Brand name" />
        <FormField label="Purchase Location" value={form.purchaseLocation} onChange={set('purchaseLocation')} placeholder="Where to buy" />
      </div>
      <FormField label="Reference Link" value={form.referenceLink} onChange={set('referenceLink')} placeholder="https://..." type="url" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
          <select value={form.categoryId} onChange={set('categoryId')} className={selectCls}>
            <option value="">No Category</option>
            {categories?.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
          </select>
        </div>
        {initial && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select value={form.status} onChange={set('status')} className={selectCls}>
              <option>Active</option>
              <option>Inactive</option>
              <option>Discontinued</option>
            </select>
          </div>
        )}
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

export default function Products() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });

  const createMut = useMutation({ mutationFn: (dto: CreateProductDto) => productsApi.create(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: UpdateProductDto }) => productsApi.update(id, dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => productsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deleted'); setDeleting(null); } });

  const handleSave = async (data: CreateProductDto | UpdateProductDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.productId, dto: data as UpdateProductDto });
    else await createMut.mutateAsync(data as CreateProductDto);
  };

  const filtered = products?.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products?.length ?? 0} total`}
        action={
          <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> New Product
          </button>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
        </div>
        {isLoading ? <LoadingSpinner /> : filtered?.length === 0 ? (
          <EmptyState icon={Package} title="No products found" description="Create your first product or adjust the search" />
        ) : (
          <>
            <div className="hidden md:block bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800/60">
                    {['Name', 'Brand', 'Category', 'Status', 'Created', ''].map(h => (
                      <th key={h} className="text-left px-6 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                  {filtered?.map(p => (
                    <tr key={p.productId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800/60 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700/30"><Package size={14} className="text-gray-500" /></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                            {p.description && <p className="text-xs text-gray-500 dark:text-gray-600 truncate max-w-xs">{p.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.brand ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.categoryName ?? '—'}</td>
                      <td className="px-6 py-4">
                        <Badge color={p.status === 'Active' ? 'green' : p.status === 'Inactive' ? 'yellow' : 'red'}>{p.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-600 tabular-nums">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.referenceLink && <a href={p.referenceLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><ExternalLink size={14} /></a>}
                          <button onClick={() => { setSelected(p); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => setDeleting(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filtered?.map(p => (
                <div key={p.productId} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800/60 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700/30 flex-shrink-0">
                        <Package size={14} className="text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-500 dark:text-gray-600 line-clamp-2 mt-0.5">{p.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {p.referenceLink && <a href={p.referenceLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><ExternalLink size={14} /></a>}
                      <button onClick={() => { setSelected(p); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setDeleting(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge color={p.status === 'Active' ? 'green' : p.status === 'Inactive' ? 'yellow' : 'red'}>{p.status}</Badge>
                    {p.brand && <Badge color="gray">{p.brand}</Badge>}
                    {p.categoryName && <Badge color="indigo">{p.categoryName}</Badge>}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-600 mt-2 tabular-nums">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Product' : 'New Product'} onClose={() => setModal(null)} size="lg">
          <ProductForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog message={`Delete "${deleting.name}"? This action cannot be undone.`} onConfirm={() => deleteMut.mutate(deleting.productId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
