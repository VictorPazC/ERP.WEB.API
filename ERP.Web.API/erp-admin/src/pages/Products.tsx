import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Package, ExternalLink, Search, Upload, X, Tag as TagIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';
import { productImagesApi } from '../api/productImages';
import { tagsApi } from '../api/tags';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { useUser } from '../context/UserContext';
import { imageUrl } from '../utils/imageUrl';

const selectCls = "bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all";

/* ── Tag selector (solo en edición) ──────────────────────── */
function TagSelector({ productId }: { productId: number }) {
  const qc = useQueryClient();
  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll });
  const { data: productTags, isLoading } = useQuery({
    queryKey: ['product-tags', productId],
    queryFn: () => tagsApi.getByProductId(productId),
  });

  const addMut = useMutation({
    mutationFn: (tagId: number) => tagsApi.addToProduct(tagId, productId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-tags', productId] }); qc.invalidateQueries({ queryKey: ['tags'] }); },
  });
  const removeMut = useMutation({
    mutationFn: (tagId: number) => tagsApi.removeFromProduct(tagId, productId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-tags', productId] }); qc.invalidateQueries({ queryKey: ['tags'] }); },
  });

  const assignedIds = new Set(productTags?.map(t => t.tagId) ?? []);

  if (isLoading) return <p className="text-xs text-gray-400 dark:text-gray-600">Cargando tags…</p>;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Tags</label>
      {allTags && allTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => {
            const assigned = assignedIds.has(tag.tagId);
            return (
              <button
                key={tag.tagId}
                type="button"
                onClick={() => assigned ? removeMut.mutate(tag.tagId) : addMut.mutate(tag.tagId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  assigned
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-gray-800/60 border-gray-300 dark:border-gray-700/60 text-gray-500 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-600'
                }`}
              >
                <TagIcon size={11} />
                {tag.tagName}
                {assigned && <X size={10} className="opacity-60" />}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-600">No hay tags. Creá tags primero desde la sección Tags.</p>
      )}
    </div>
  );
}

/* ── Image uploader (paso 2 al crear producto) ───────────── */
function ImageUploader({ productId, onDone }: { productId: number; onDone: () => void }) {
  const qc = useQueryClient();
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

  const handleUpload = async () => {
    if (files.length === 0) { onDone(); return; }
    setLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await productImagesApi.upload(files[i], productId, i === 0, i);
      }
      qc.invalidateQueries({ queryKey: ['product-images'] });
      toast.success(`${files.length} imagen${files.length > 1 ? 'es' : ''} subida${files.length > 1 ? 's' : ''}`);
      onDone();
    } catch {
      toast.error('Error al subir imágenes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 dark:border-gray-700/60 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
        }`}
      >
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple className="hidden"
          onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
        <Upload size={22} className={`mx-auto mb-2 ${dragOver ? 'text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`} />
        <p className="text-sm text-gray-500 dark:text-gray-400">Tocá para seleccionar o arrastrá imágenes aquí</p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">JPG, PNG, GIF, WEBP · máx 10 MB</p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800/40 ring-1 ring-gray-200 dark:ring-gray-700/40">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeFile(i)}
                className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-md text-white hover:bg-red-600 transition-colors">
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onDone}
          className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">
          Omitir
        </button>
        <button type="button" onClick={handleUpload} disabled={loading}
          className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Subiendo…' : files.length > 0 ? `Subir ${files.length} imagen${files.length > 1 ? 'es' : ''}` : 'Finalizar'}
        </button>
      </div>
    </div>
  );
}

/* ── Product form ─────────────────────────────────────────── */
function ProductForm({ initial, onSave, onClose }: {
  initial?: Product;
  onSave: (data: CreateProductDto | UpdateProductDto) => Promise<number>;
  onClose: () => void;
}) {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll });
  const [step, setStep] = useState<'form' | 'images'>('form');
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
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
      const productId = await onSave(initial
        ? { ...base, productId: initial.productId, status: form.status } as UpdateProductDto
        : base as CreateProductDto
      );
      if (!initial) {
        setCreatedProductId(productId);
        setStep('images');
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'images' && createdProductId !== null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
          <Package size={14} className="text-green-500 flex-shrink-0" />
          <span>Producto creado. Ahora podés agregar imágenes.</span>
        </div>
        <ImageUploader productId={createdProductId} onDone={onClose} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre *" value={form.name} onChange={set('name')} placeholder="Nombre del producto" required />
      <FormField label="Descripción" value={form.description} onChange={set('description')} placeholder="Descripción opcional" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Marca" value={form.brand} onChange={set('brand')} placeholder="Marca" />
        <FormField label="Lugar de compra" value={form.purchaseLocation} onChange={set('purchaseLocation')} placeholder="Dónde comprarlo" />
      </div>
      <FormField label="Link de referencia" value={form.referenceLink} onChange={set('referenceLink')} placeholder="https://…" type="url" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Categoría</label>
          <select value={form.categoryId} onChange={set('categoryId')} className={selectCls}>
            <option value="">Sin categoría</option>
            {categories?.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
          </select>
        </div>
        {initial && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado</label>
            <select value={form.status} onChange={set('status')} className={selectCls}>
              <option>Active</option>
              <option>Inactive</option>
              <option>Discontinued</option>
            </select>
          </div>
        )}
      </div>

      {/* Tags solo al editar */}
      {initial && <TagSelector productId={initial.productId} />}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Guardando…' : initial ? 'Actualizar' : 'Crear y agregar imagen →'}
        </button>
      </div>
    </form>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function Products() {
  const qc = useQueryClient();
  const { isAdmin } = useUser();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });
  const { data: allImages } = useQuery({ queryKey: ['product-images'], queryFn: productImagesApi.getAll });

  // Mapa productId → path de imagen primaria
  const primaryImageMap = new Map<number, string>();
  allImages?.forEach(img => {
    if (img.isPrimary || !primaryImageMap.has(img.productId)) {
      primaryImageMap.set(img.productId, img.imagePath);
    }
  });

  const createMut = useMutation({
    mutationFn: (dto: CreateProductDto) => productsApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Producto creado'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateProductDto }) => productsApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Producto actualizado'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Producto eliminado'); setDeleting(null); },
  });

  const handleSave = async (data: CreateProductDto | UpdateProductDto): Promise<number> => {
    if (selected) {
      const result = await updateMut.mutateAsync({ id: selected.productId, dto: data as UpdateProductDto });
      return result.productId;
    } else {
      const result = await createMut.mutateAsync(data as CreateProductDto);
      return result.productId;
    }
  };

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle={`${products?.length ?? 0} total`}
        action={isAdmin ? (
          <button onClick={() => { setSelected(null); setModal('create'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> Nuevo producto
          </button>
        ) : undefined}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar productos…"
            className="w-full bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" />
        </div>

        {isLoading ? <LoadingSpinner /> : filtered?.length === 0 ? (
          <EmptyState icon={Package} title="Sin productos" description="Crea tu primer producto" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800/60">
                    {['', 'Nombre', 'Marca', 'Categoría', 'Estado', 'Creado', ''].map((h, i) => (
                      <th key={i} className="text-left px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                  {filtered?.map(p => {
                    const imgPath = primaryImageMap.get(p.productId);
                    const src = imageUrl(imgPath);
                    return (
                      <tr key={p.productId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800/60 ring-1 ring-gray-200 dark:ring-gray-700/30 flex items-center justify-center flex-shrink-0">
                            {src
                              ? <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                              : <Package size={14} className="text-gray-400" />}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                            {p.description && <p className="text-xs text-gray-500 dark:text-gray-600 truncate max-w-[200px]">{p.description}</p>}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{p.brand ?? '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{p.categoryName ?? '—'}</td>
                        <td className="px-5 py-3">
                          <Badge color={p.status === 'Active' ? 'green' : p.status === 'Inactive' ? 'yellow' : 'red'}>{p.status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-600 tabular-nums">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.referenceLink && <a href={p.referenceLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><ExternalLink size={14} /></a>}
                            {isAdmin && <>
                              <button onClick={() => { setSelected(p); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
                              <button onClick={() => setDeleting(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered?.map(p => {
                const imgPath = primaryImageMap.get(p.productId);
                const src = imageUrl(imgPath);
                return (
                  <div key={p.productId} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800/60 ring-1 ring-gray-200 dark:ring-gray-700/30 flex items-center justify-center flex-shrink-0">
                        {src
                          ? <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                          : <Package size={18} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                            {p.description && <p className="text-xs text-gray-500 dark:text-gray-600 line-clamp-2 mt-0.5">{p.description}</p>}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 flex-shrink-0">
                              {p.referenceLink && <a href={p.referenceLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"><ExternalLink size={13} /></a>}
                              <button onClick={() => { setSelected(p); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={13} /></button>
                              <button onClick={() => setDeleting(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <Badge color={p.status === 'Active' ? 'green' : p.status === 'Inactive' ? 'yellow' : 'red'}>{p.status}</Badge>
                          {p.brand && <Badge color="gray">{p.brand}</Badge>}
                          {p.categoryName && <Badge color="indigo">{p.categoryName}</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && isAdmin && (
        <Modal title={modal === 'edit' ? 'Editar producto' : 'Nuevo producto'} onClose={() => setModal(null)} size="lg">
          <ProductForm
            initial={modal === 'edit' ? selected ?? undefined : undefined}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {deleting && isAdmin && (
        <ConfirmDialog
          message={`¿Eliminar "${deleting.name}"? Esta acción no se puede deshacer.`}
          onConfirm={() => deleteMut.mutate(deleting.productId)}
          onClose={() => setDeleting(null)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
}
