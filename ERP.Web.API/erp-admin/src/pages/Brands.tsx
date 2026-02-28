import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Bookmark, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { brandsApi } from '../api/brands';
import type { Brand, CreateBrandDto, UpdateBrandDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { useUser } from '../context/UserContext';

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
      <FormField label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Nike, Samsung, Apple" required />
      <FormField label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción opcional" />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancelar</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Guardando…' : initial ? 'Actualizar' : 'Crear'}
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

  const { data: brands, isLoading } = useQuery({ queryKey: ['brands'], queryFn: brandsApi.getAll });

  const createMut = useMutation({
    mutationFn: (dto: CreateBrandDto) => brandsApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Marca creada'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateBrandDto }) => brandsApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Marca actualizada'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => brandsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Marca eliminada'); setDeleting(null); },
  });
  const setDefaultMut = useMutation({
    mutationFn: (id: number) => brandsApi.setDefault(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Marca predeterminada actualizada'); },
  });

  const handleSave = async (data: CreateBrandDto | UpdateBrandDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.brandId, dto: data as UpdateBrandDto });
    else await createMut.mutateAsync(data as CreateBrandDto);
  };

  return (
    <div>
      <PageHeader
        title="Marcas"
        subtitle={`${brands?.length ?? 0} total`}
        action={isAdmin ? (
          <button onClick={() => { setSelected(null); setModal('create'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> Nueva marca
          </button>
        ) : undefined}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? <LoadingSpinner /> : brands?.length === 0 ? (
          <EmptyState icon={Bookmark} title="Sin marcas" description="Creá las marcas para asignarlas a los productos" />
        ) : (
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800/60">
                  {['Nombre', 'Descripción', 'Productos', 'Default', ''].map((h, i) => (
                    <th key={i} className="text-left px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                {brands?.map(brand => (
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
                          <Star size={10} className="inline mr-1 fill-current" />Predeterminada
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!brand.isDefault && (
                            <button onClick={() => setDefaultMut.mutate(brand.brandId)} title="Establecer como predeterminada" className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Star size={14} /></button>
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
          </div>
        )}
      </div>

      {isAdmin && (modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Editar marca' : 'Nueva marca'} onClose={() => setModal(null)} size="sm">
          <BrandForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {isAdmin && deleting && (
        <ConfirmDialog
          message={`¿Eliminar la marca "${deleting.name}"? Los productos asociados quedarán sin marca.`}
          onConfirm={() => deleteMut.mutate(deleting.brandId)}
          onClose={() => setDeleting(null)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
}
