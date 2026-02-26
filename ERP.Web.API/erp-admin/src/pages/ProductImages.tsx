import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Image, Star, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { productImagesApi } from '../api/productImages';
import { productsApi } from '../api/products';
import type { ProductImage, UpdateProductImageDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { imageUrl } from '../utils/imageUrl';
import { useUser } from '../context/UserContext';

const selectCls = "bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all";

function UploadForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });
  const [productId, setProductId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const accepted = Array.from(newFiles).filter(f =>
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type)
    );
    if (accepted.length === 0) { toast.error('Solo JPG, PNG, GIF, WEBP'); return; }
    setFiles(prev => [...prev, ...accepted]);
    accepted.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }, []);

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadMut = useMutation({
    mutationFn: (file: File) => productImagesApi.upload(file, Number(productId), isPrimary && files.indexOf(file) === 0, Number(displayOrder)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-images'] }); },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || files.length === 0) return;
    setLoading(true);
    try {
      for (const file of files) await uploadMut.mutateAsync(file);
      toast.success(`${files.length} imagen${files.length > 1 ? 'es' : ''} subida${files.length > 1 ? 's' : ''}`);
      onClose();
    } catch {
      toast.error('Error al subir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Producto *</label>
        <select value={productId} onChange={e => setProductId(e.target.value)} required className={selectCls}>
          <option value="">Seleccionar producto</option>
          {products?.map(p => <option key={p.productId} value={p.productId}>{p.name}</option>)}
        </select>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 dark:border-gray-700/60 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
        }`}
      >
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple className="hidden"
          onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
        <Upload size={24} className={`mx-auto mb-2 ${dragOver ? 'text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`} />
        <p className="text-sm text-gray-600 dark:text-gray-400">Tocá para seleccionar o arrastrá imágenes</p>
        <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">JPG, PNG, GIF, WEBP (máx 10 MB)</p>
      </div>
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800/40 ring-1 ring-gray-200 dark:ring-gray-700/40">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={e => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-white hover:bg-red-600 transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Orden de visualización" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} type="number" min="0" placeholder="0" />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="w-4 h-4 accent-indigo-500 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">Imagen principal</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancelar</button>
        <button type="submit" disabled={loading || files.length === 0} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Subiendo…' : `Subir ${files.length || ''} imagen${files.length !== 1 ? 'es' : ''}`}
        </button>
      </div>
    </form>
  );
}

function EditForm({ initial, onSave, onClose }: {
  initial: ProductImage;
  onSave: (dto: UpdateProductImageDto) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ isPrimary: initial.isPrimary, displayOrder: initial.displayOrder.toString() });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ imageId: initial.imageId, imagePath: initial.imagePath, isPrimary: form.isPrimary, displayOrder: Number(form.displayOrder) });
      onClose();
    } finally { setLoading(false); }
  };
  const src = imageUrl(initial.imagePath);
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {src && (
        <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800/40 ring-1 ring-gray-200 dark:ring-gray-700/40">
          <img src={src} alt="" className="w-full h-full object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
      <FormField label="Orden de visualización" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} type="number" min="0" placeholder="0" />
      <label className="flex items-center gap-3 cursor-pointer group">
        <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(f => ({ ...f, isPrimary: e.target.checked }))} className="w-4 h-4 accent-indigo-500 rounded" />
        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">Imagen principal (portada)</span>
      </label>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancelar</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Guardando…' : 'Actualizar'}
        </button>
      </div>
    </form>
  );
}

export default function ProductImages() {
  const qc = useQueryClient();
  const { isAdmin } = useUser();
  const [modal, setModal] = useState<'upload' | 'edit' | null>(null);
  const [selected, setSelected] = useState<ProductImage | null>(null);
  const [deleting, setDeleting] = useState<ProductImage | null>(null);

  const { data: images, isLoading } = useQuery({ queryKey: ['product-images'], queryFn: productImagesApi.getAll });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });

  // Mapa productId → nombre
  const productNameMap = new Map(products?.map(p => [p.productId, p.name]) ?? []);

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateProductImageDto }) => productImagesApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-images'] }); toast.success('Imagen actualizada'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => productImagesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-images'] }); toast.success('Imagen eliminada'); setDeleting(null); },
  });

  return (
    <div>
      <PageHeader
        title="Imágenes de productos"
        subtitle={`${images?.length ?? 0} imágenes`}
        action={isAdmin ? (
          <button onClick={() => { setSelected(null); setModal('upload'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> Subir imagen
          </button>
        ) : undefined}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? <LoadingSpinner /> : images?.length === 0 ? (
          <EmptyState icon={Image} title="Sin imágenes" description="Subí imágenes de tus productos para mostrar el catálogo" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {images?.map(img => {
              const src = imageUrl(img.imagePath);
              const productName = productNameMap.get(img.productId);
              return (
                <div key={img.imageId} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl sm:rounded-2xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-700/60 transition-all duration-200 group">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800/40 flex items-center justify-center relative overflow-hidden">
                    {src ? (
                      <img
                        src={src}
                        alt={productName ?? ''}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={e => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = 'none';
                          const fallback = el.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {/* Fallback siempre presente */}
                    <div style={{ display: src ? 'none' : 'flex' }} className="absolute inset-0 items-center justify-center flex-col gap-1 bg-gray-100 dark:bg-gray-800/40">
                      <Image size={28} className="text-gray-400 dark:text-gray-700" />
                      <span className="text-[10px] text-gray-400 dark:text-gray-600">Sin imagen</span>
                    </div>
                    {img.isPrimary && (
                      <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 p-1 sm:p-1.5 bg-amber-500 rounded-lg shadow-lg shadow-amber-500/30">
                        <Star size={10} className="text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 sm:p-3.5">
                    {/* Nombre del producto */}
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mb-1.5">
                      {productName ?? `Producto #${img.productId}`}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex gap-1 sm:gap-1.5 flex-wrap min-w-0">
                        {img.isPrimary && <Badge color="yellow">Principal</Badge>}
                        <Badge color="gray">#{img.displayOrder}</Badge>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => { setSelected(img); setModal('edit'); }} className="p-1 rounded-lg text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => setDeleting(img)} className="p-1 rounded-lg text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal === 'upload' && isAdmin && (
        <Modal title="Subir imágenes" onClose={() => setModal(null)}>
          <UploadForm onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'edit' && selected && isAdmin && (
        <Modal title="Editar imagen" onClose={() => setModal(null)}>
          <EditForm initial={selected} onSave={async dto => { await updateMut.mutateAsync({ id: selected.imageId, dto }); }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {deleting && isAdmin && (
        <ConfirmDialog message="¿Eliminar esta imagen? No se puede deshacer." onConfirm={() => deleteMut.mutate(deleting.imageId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
