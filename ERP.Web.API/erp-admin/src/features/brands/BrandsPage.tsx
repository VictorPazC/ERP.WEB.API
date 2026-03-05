import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Bookmark, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { brandsApi } from './api';
import type { Brand, CreateBrandDto, UpdateBrandDto } from '../../shared/types';
import PageHeader from '../../shared/components/PageHeader';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import FormField from '../../shared/components/FormField';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Badge from '../../shared/components/Badge';
import { useUser } from '../../shared/context/UserContext';

function BrandForm({ initial, onSave, onClose }: {
  initial?: Brand;
  onSave: (data: CreateBrandDto | UpdateBrandDto) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: initial?.name ?? '', description: initial?.description ?? '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      if (initial) {
        await onSave({ brandId: initial.brandId, name: form.name, description: form.description || undefined } as UpdateBrandDto);
      } else {
        await onSave({ name: form.name, description: form.description || undefined } as CreateBrandDto);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Nike, Samsung, Apple" required />
      <FormField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function Brands() {
  const qc = useQueryClient();
  const { isAdmin } = useUser();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState<Brand | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['brands'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => brandsApi.getAll(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
  const brands = data?.pages.flatMap(p => p.items) ?? [];

  const createMut = useMutation({
    mutationFn: (dto: CreateBrandDto) => brandsApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Brand created'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateBrandDto }) => brandsApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Brand updated'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => brandsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Brand deleted'); setDeleting(null); },
  });
  const setDefaultMut = useMutation({
    mutationFn: (id: number) => brandsApi.setDefault(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Default brand updated'); },
  });

  const handleSave = async (data: CreateBrandDto | UpdateBrandDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.brandId, dto: data as UpdateBrandDto });
    else await createMut.mutateAsync(data as CreateBrandDto);
  };

  return (
    <div>
      <PageHeader
        title="Brands"
        subtitle={`${brands.length} total`}
        action={isAdmin ? (
          <button onClick={() => { setSelected(null); setModal('create'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> New brand
          </button>
        ) : undefined}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? <LoadingSpinner /> : brands.length === 0 ? (
          <EmptyState icon={Bookmark} title="No brands" description="Create brands to assign them to products" />
        ) : (
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800/60">
                  {['Name', 'Description', 'Products', 'Default', ''].map((h, i) => (
                    <th key={i} className="text-left px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                {brands.map(brand => (
                  <tr key={brand.brandId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                          <Bookmark size={13} className="text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{brand.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {brand.description ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge color="gray">{brand.productsCount}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {brand.isDefault && (
                        <Badge color="yellow">
                          <Star size={10} className="inline mr-1 fill-current" />Default
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!brand.isDefault && (
                            <button onClick={() => setDefaultMut.mutate(brand.brandId)} title="Set as default" className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Star size={14} /></button>
                          )}
                          <button onClick={() => { setSelected(brand); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => setDeleting(brand)} className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        )}
      </div>

      {isAdmin && (modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit brand' : 'New brand'} onClose={() => setModal(null)} size="sm">
          <BrandForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {isAdmin && deleting && (
        <ConfirmDialog
          message={`Delete brand "${deleting.name}"? Associated products will have no brand.`}
          onConfirm={() => deleteMut.mutate(deleting.brandId)}
          onClose={() => setDeleting(null)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
}
