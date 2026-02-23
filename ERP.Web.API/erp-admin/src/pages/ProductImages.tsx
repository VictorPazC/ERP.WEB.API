import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Image, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { productImagesApi } from '../api/productImages';
import { productsApi } from '../api/products';
import type { ProductImage, CreateProductImageDto, UpdateProductImageDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';

function ImageForm({ initial, onSave, onClose }: {
  initial?: ProductImage;
  onSave: (data: CreateProductImageDto | UpdateProductImageDto) => Promise<void>;
  onClose: () => void;
}) {
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });
  const [form, setForm] = useState({
    productId: initial?.productId?.toString() ?? '',
    imagePath: initial?.imagePath ?? '',
    isPrimary: initial?.isPrimary ?? false,
    displayOrder: initial?.displayOrder?.toString() ?? '0',
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial) {
        await onSave({ imageId: initial.imageId, imagePath: form.imagePath, isPrimary: form.isPrimary, displayOrder: Number(form.displayOrder) } as UpdateProductImageDto);
      } else {
        await onSave({ productId: Number(form.productId), imagePath: form.imagePath, isPrimary: form.isPrimary, displayOrder: Number(form.displayOrder) } as CreateProductImageDto);
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
      <FormField label="Image Path *" value={form.imagePath} onChange={set('imagePath')} placeholder="images/products/item-01.jpg" required />
      <FormField label="Display Order" value={form.displayOrder} onChange={set('displayOrder')} type="number" min="0" placeholder="0" />
      <label className="flex items-center gap-3 cursor-pointer group">
        <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(f => ({ ...f, isPrimary: e.target.checked }))} className="w-4 h-4 accent-indigo-500 rounded" />
        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Set as primary image (cover)</span>
      </label>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-700/60 rounded-xl text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving...' : initial ? 'Update' : 'Add Image'}
        </button>
      </div>
    </form>
  );
}

export default function ProductImages() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<ProductImage | null>(null);
  const [deleting, setDeleting] = useState<ProductImage | null>(null);

  const { data: images, isLoading } = useQuery({ queryKey: ['product-images'], queryFn: productImagesApi.getAll });

  const createMut = useMutation({ mutationFn: (dto: CreateProductImageDto) => productImagesApi.create(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-images'] }); toast.success('Image added'); } });
  const updateMut = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: UpdateProductImageDto }) => productImagesApi.update(id, dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-images'] }); toast.success('Image updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => productImagesApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-images'] }); toast.success('Image deleted'); setDeleting(null); } });

  const handleSave = async (data: CreateProductImageDto | UpdateProductImageDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.imageId, dto: data as UpdateProductImageDto });
    else await createMut.mutateAsync(data as CreateProductImageDto);
  };

  return (
    <div>
      <PageHeader
        title="Product Images"
        subtitle={`${images?.length ?? 0} images`}
        action={
          <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> Add Image
          </button>
        }
      />
      <div className="p-8">
        {isLoading ? <LoadingSpinner /> : images?.length === 0 ? (
          <EmptyState icon={Image} title="No images yet" description="Add product images to showcase your catalog" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {images?.map(img => (
              <div key={img.imageId} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl overflow-hidden hover:border-gray-700/60 transition-all duration-200 group">
                <div className="aspect-square bg-gray-800/40 flex items-center justify-center relative">
                  <Image size={32} className="text-gray-700" />
                  {img.isPrimary && (
                    <div className="absolute top-2.5 right-2.5 p-1.5 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/30">
                      <Star size={10} className="text-white fill-white" />
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-xs text-gray-500 truncate mb-2.5" title={img.imagePath}>{img.imagePath}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {img.isPrimary && <Badge color="yellow">Primary</Badge>}
                      <Badge color="gray">#{img.displayOrder}</Badge>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelected(img); setModal('edit'); }} className="p-1 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => setDeleting(img)} className="p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-2">Product #{img.productId}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Image' : 'Add Image'} onClose={() => setModal(null)}>
          <ImageForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog message={`Delete image "${deleting.imagePath}"?`} onConfirm={() => deleteMut.mutate(deleting.imageId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
