import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Package, ExternalLink, Search, Upload, X, Tag as TagIcon, Camera, Archive, TrendingUp, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../api/products';
import { brandsApi } from '../api/brands';
import { categoriesApi } from '../api/categories';
import { productImagesApi } from '../api/productImages';
import { tagsApi } from '../api/tags';
import { inventoryApi } from '../api/inventory';
import type { Product, CreateProductDto, UpdateProductDto, CreateInventoryDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import SearchableSelect from '../components/SearchableSelect';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { useUser } from '../context/UserContext';
import { imageUrl } from '../utils/imageUrl';

const selectCls = "bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all";

const STOCK_STATUS_OPTIONS = [
  { value: 'NeedToOrder', label: 'Need to Order', cls: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  { value: 'OnTheWay',    label: 'On the Way',    cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { value: 'Disabled',    label: 'Disabled',      cls: 'bg-gray-500/10 text-gray-500 dark:text-gray-400' },
  { value: 'OrderLater',  label: 'Order Later',   cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
] as const;

function StockStatusBadge({ status }: { status: string }) {
  const opt = STOCK_STATUS_OPTIONS.find(o => o.value === status);
  if (!opt) return null;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium ${opt.cls}`}>{opt.label}</span>;
}

function StockStatusSelect({ productId, value, onChange }: { productId: number; value: string | null; onChange: (id: number, s: string | null) => void }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(productId, e.target.value || null)}
      onClick={e => e.stopPropagation()}
      className="text-[11px] rounded-lg border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
    >
      <option value="">— set stock status</option>
      {STOCK_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ── Image Lightbox ───────────────────────────────────────── */
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

/* ── Tag selector (edit only) ─────────────────────────────── */
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

  if (isLoading) return <p className="text-xs text-gray-400 dark:text-gray-600">Loading tags…</p>;

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
        <p className="text-xs text-gray-400 dark:text-gray-600">No tags. Create tags first from the Tags section.</p>
      )}
    </div>
  );
}

/* ── Image uploader (step 2 when creating) ────────────────── */
function ImageUploader({ productId, onDone }: { productId: number; onDone: () => void }) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const accepted = Array.from(newFiles).filter(f =>
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type)
    );
    if (accepted.length === 0) { toast.error('Only JPG, PNG, GIF, WEBP allowed'); return; }
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
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`);
      onDone();
    } catch {
      toast.error('Error uploading images');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 dark:border-gray-700/60 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
          }`}
        >
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
          <Upload size={22} className={`mx-auto mb-2 ${dragOver ? 'text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`} />
          <p className="text-sm text-gray-500 dark:text-gray-400">Click to select or drag images here</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">JPG, PNG, GIF, WEBP · max 10 MB</p>
        </div>
        <div
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 w-24 border-2 border-dashed rounded-xl cursor-pointer transition-all border-gray-300 dark:border-gray-700/60 hover:border-indigo-500 hover:bg-indigo-500/10"
        >
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
          <Camera size={22} className="text-gray-400 dark:text-gray-600" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Camera</p>
        </div>
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
          Skip
        </button>
        <button type="button" onClick={handleUpload} disabled={loading}
          className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Uploading…' : files.length > 0 ? `Upload ${files.length} image${files.length > 1 ? 's' : ''}` : 'Finish'}
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
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll, staleTime: Infinity, refetchOnWindowFocus: false });
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: brandsApi.getAll, staleTime: Infinity, refetchOnWindowFocus: false });
  const defaultBrandApplied = useRef(false);
  const [step, setStep] = useState<'form' | 'images'>('form');
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    brandId: initial?.brandId?.toString() ?? '',
    referenceLink: initial?.referenceLink ?? '',
    purchaseLocation: initial?.purchaseLocation ?? '',
    categoryId: initial?.categoryId?.toString() ?? '',
    status: initial?.status ?? 'Active',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initial && !defaultBrandApplied.current && brands) {
      const defaultBrand = brands.find(b => b.isDefault);
      if (defaultBrand) {
        setForm(f => ({ ...f, brandId: defaultBrand.brandId.toString() }));
        defaultBrandApplied.current = true;
      }
    }
  }, [brands]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const base = {
        name: form.name,
        description: form.description || undefined,
        brandId: form.brandId ? Number(form.brandId) : undefined,
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
          <span>Product created. Now you can add images.</span>
        </div>
        <ImageUploader productId={createdProductId} onDone={onClose} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Name *" value={form.name} onChange={set('name')} placeholder="Product name" required />
      <FormField label="Description" value={form.description} onChange={set('description')} placeholder="Optional description" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Brand</label>
          <select value={form.brandId} onChange={set('brandId')} className={selectCls}>
            <option value="">No brand</option>
            {brands?.map(b => <option key={b.brandId} value={b.brandId}>{b.name}</option>)}
          </select>
        </div>
        <FormField label="Purchase location" value={form.purchaseLocation} onChange={set('purchaseLocation')} placeholder="Where to buy it" />
      </div>
      <FormField label="Reference link" value={form.referenceLink} onChange={set('referenceLink')} placeholder="https://…" type="url" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchableSelect
          label="Category"
          value={form.categoryId}
          onChange={v => setForm(f => ({ ...f, categoryId: v }))}
          options={(categories ?? []).map(c => ({ value: String(c.categoryId), label: c.name }))}
          placeholder="Search category…"
          clearLabel="No category"
        />
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

      {/* Tags — edit only */}
      {initial && <TagSelector productId={initial.productId} />}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving…' : initial ? 'Update' : 'Create and add image →'}
        </button>
      </div>
    </form>
  );
}

/* ── Quick inventory form ─────────────────────────────────── */
function QuickInventoryForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    purchaseCost: '',
    suggestedRetailPrice: '',
    currentStock: '0',
    lastRestockDate: today,
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const createMut = useMutation({
    mutationFn: (dto: CreateInventoryDto) => inventoryApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Inventory created'); },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createMut.mutateAsync({
        productId: product.productId,
        purchaseCost: Number(form.purchaseCost),
        suggestedRetailPrice: Number(form.suggestedRetailPrice),
        currentStock: Number(form.currentStock),
        lastRestockDate: form.lastRestockDate,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const profit = form.purchaseCost && form.suggestedRetailPrice
    ? Number(form.suggestedRetailPrice) - Number(form.purchaseCost)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-gray-800/60">
        <Package size={14} className="text-indigo-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
          {product.brandName && <p className="text-xs text-gray-500 dark:text-gray-500">{product.brandName}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Purchase Cost *" value={form.purchaseCost} onChange={set('purchaseCost')} type="number" step="0.01" min="0" placeholder="0.00" required />
        <FormField label="Retail Price *" value={form.suggestedRetailPrice} onChange={set('suggestedRetailPrice')} type="number" step="0.01" min="0" placeholder="0.00" required />
      </div>
      <FormField label="Initial Stock *" value={form.currentStock} onChange={set('currentStock')} type="number" min="0" placeholder="0" required />
      <FormField label="Last Restock Date" value={form.lastRestockDate} onChange={set('lastRestockDate')} type="date" />
      {profit !== null && (
        <div className="bg-emerald-500/10 ring-1 ring-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-500 dark:text-emerald-400" />
          <span className="text-sm text-emerald-600 dark:text-emerald-300">Estimated Profit: <strong className="text-emerald-700 dark:text-emerald-200">${profit.toFixed(2)}</strong></span>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving…' : 'Create inventory'}
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
  const [inventoryFor, setInventoryFor] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [filterBrand, setFilterBrand] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterStock, setFilterStock] = useState<'noInventory' | 'noStock' | null>(null);
  const [filterFavorites, setFilterFavorites] = useState(false);

  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });
  const { data: allImages } = useQuery({ queryKey: ['product-images'], queryFn: productImagesApi.getAll });
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: brandsApi.getAll });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll });

  const primaryImageMap = new Map<number, string>();
  allImages?.forEach(img => {
    if (img.isPrimary || !primaryImageMap.has(img.productId)) {
      primaryImageMap.set(img.productId, img.imagePath);
    }
  });

  const createMut = useMutation({
    mutationFn: (dto: CreateProductDto) => productsApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product created'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateProductDto }) => productsApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product updated'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product deleted'); setDeleting(null); },
  });
  const toggleFavMut = useMutation({
    mutationFn: (id: number) => productsApi.toggleFavorite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
  const setStockStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string | null }) => productsApi.setStockStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
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

  const filtered = products?.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brandName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBrand && p.brandId !== filterBrand) return false;
    if (filterCategory && p.categoryId !== filterCategory) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterStock === 'noInventory' && p.hasInventory) return false;
    if (filterStock === 'noStock' && (!p.hasInventory || (p.currentStock ?? 0) > 0)) return false;
    if (filterFavorites && !p.isFavorite) return false;
    return true;
  });

  const activeFilters = [filterBrand, filterCategory, filterStatus, filterStock, filterFavorites].filter(Boolean).length;

  const openLightbox = (productId: number, name: string) => {
    const imgPath = primaryImageMap.get(productId);
    const src = imageUrl(imgPath);
    if (src) setLightbox({ src, alt: name });
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products?.length ?? 0} total`}
        action={isAdmin ? (
          <button onClick={() => { setSelected(null); setModal('create'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> New product
          </button>
        ) : undefined}
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        {/* Filter bar */}
        <div className="space-y-2">
          {/* Search — full width on mobile, fixed width on desktop */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              className="w-full sm:w-64 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" />
          </div>
          {/* Filters — horizontally scrollable on mobile, wrapping on desktop */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 sm:pb-0 sm:flex-wrap [&::-webkit-scrollbar]:hidden">
            <select value={filterBrand ?? ''} onChange={e => setFilterBrand(e.target.value ? Number(e.target.value) : null)}
              className={`${selectCls} py-2 text-xs shrink-0`}>
              <option value="">All brands</option>
              {brands?.map(b => <option key={b.brandId} value={b.brandId}>{b.name}</option>)}
            </select>
            <select value={filterCategory ?? ''} onChange={e => setFilterCategory(e.target.value ? Number(e.target.value) : null)}
              className={`${selectCls} py-2 text-xs shrink-0`}>
              <option value="">All categories</option>
              {categories?.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
            </select>
            <select value={filterStatus ?? ''} onChange={e => setFilterStatus(e.target.value || null)}
              className={`${selectCls} py-2 text-xs shrink-0`}>
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Discontinued">Discontinued</option>
            </select>
            <select value={filterStock ?? ''} onChange={e => setFilterStock((e.target.value || null) as typeof filterStock)}
              className={`${selectCls} py-2 text-xs shrink-0`}>
              <option value="">All stock</option>
              <option value="noInventory">No inventory</option>
              <option value="noStock">No stock (0)</option>
            </select>
            <button
              onClick={() => setFilterFavorites(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors shrink-0 ${filterFavorites ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' : 'bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-800/60 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'}`}
            >
              <Star size={13} className={filterFavorites ? 'fill-amber-500 text-amber-500' : ''} />
              Favorites
            </button>
            {activeFilters > 0 && (
              <button onClick={() => { setFilterBrand(null); setFilterCategory(null); setFilterStatus(null); setFilterStock(null); setFilterFavorites(false); setSearch(''); }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900/60 text-gray-500 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700/40 transition-colors shrink-0">
                <X size={12} /> Clear
              </button>
            )}
            <span className="self-center text-xs text-gray-400 dark:text-gray-600 shrink-0">{filtered?.length ?? 0} results</span>
          </div>
        </div>

        {isLoading ? <LoadingSpinner /> : filtered?.length === 0 ? (
          <EmptyState icon={Package} title="No products" description="Create your first product" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800/60">
                    {['', 'Name', 'Brand', 'Category', 'Status', 'Stock', ''].map((h, i) => (
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
                          <div
                            className={`w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800/60 ring-1 ring-gray-200 dark:ring-gray-700/30 flex items-center justify-center flex-shrink-0 ${src ? 'cursor-zoom-in' : ''}`}
                            onClick={() => openLightbox(p.productId, p.name)}
                          >
                            {src
                              ? <img src={src} alt="" className="w-full h-full object-cover" loading="lazy"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              : <Package size={14} className="text-gray-400" />}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-start gap-1.5">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                              {p.description && <p className="text-xs text-gray-500 dark:text-gray-600 truncate max-w-[200px]">{p.description}</p>}
                            </div>
                            <button
                              onClick={() => toggleFavMut.mutate(p.productId)}
                              title={p.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              className={`mt-0.5 p-0.5 rounded transition-colors flex-shrink-0 ${p.isFavorite ? 'text-amber-500' : 'text-gray-300 dark:text-gray-700 hover:text-amber-400'}`}
                            >
                              <Star size={13} className={p.isFavorite ? 'fill-amber-500' : ''} />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{p.brandName ?? '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{p.categoryName ?? '—'}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge color={p.status === 'Active' ? 'green' : p.status === 'Inactive' ? 'yellow' : 'red'}>{p.status}</Badge>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            {p.hasInventory
                              ? <Badge color={(p.currentStock ?? 0) > 0 ? 'green' : 'red'}>{p.currentStock ?? 0} units</Badge>
                              : <Badge color="gray">No inv.</Badge>
                            }
                            {p.stockStatus && <StockStatusBadge status={p.stockStatus} />}
                            {isAdmin && (!p.hasInventory || (p.currentStock ?? 1) === 0) && (
                              <StockStatusSelect
                                productId={p.productId}
                                value={p.stockStatus ?? null}
                                onChange={(id, s) => setStockStatusMut.mutate({ id, status: s })}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.referenceLink && <a href={p.referenceLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><ExternalLink size={14} /></a>}
                            {isAdmin && <>
                              <button onClick={() => setInventoryFor(p)} title="Add inventory" className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"><Archive size={14} /></button>
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
                      <div
                        className={`w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800/60 ring-1 ring-gray-200 dark:ring-gray-700/30 flex items-center justify-center flex-shrink-0 ${src ? 'cursor-zoom-in' : ''}`}
                        onClick={() => openLightbox(p.productId, p.name)}
                      >
                        {src
                          ? <img src={src} alt="" className="w-full h-full object-cover" loading="lazy"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <Package size={18} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex items-start gap-1.5">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                              {p.description && <p className="text-xs text-gray-500 dark:text-gray-600 line-clamp-2 mt-0.5">{p.description}</p>}
                            </div>
                            <button
                              onClick={() => toggleFavMut.mutate(p.productId)}
                              className={`mt-0.5 p-0.5 rounded flex-shrink-0 transition-colors ${p.isFavorite ? 'text-amber-500' : 'text-gray-300 dark:text-gray-700'}`}
                            >
                              <Star size={13} className={p.isFavorite ? 'fill-amber-500' : ''} />
                            </button>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {p.referenceLink && <a href={p.referenceLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"><ExternalLink size={13} /></a>}
                            {isAdmin && <>
                              <button onClick={() => setInventoryFor(p)} title="Add inventory" className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"><Archive size={13} /></button>
                              <button onClick={() => { setSelected(p); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={13} /></button>
                              <button onClick={() => setDeleting(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                            </>}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <Badge color={p.status === 'Active' ? 'green' : p.status === 'Inactive' ? 'yellow' : 'red'}>{p.status}</Badge>
                          {p.hasInventory
                            ? <Badge color={(p.currentStock ?? 0) > 0 ? 'green' : 'red'}>{p.currentStock ?? 0} units</Badge>
                            : <Badge color="gray">No inv.</Badge>
                          }
                          {p.stockStatus && <StockStatusBadge status={p.stockStatus} />}
                          {p.brandName && <Badge color="gray">{p.brandName}</Badge>}
                          {p.categoryName && <Badge color="indigo">{p.categoryName}</Badge>}
                        </div>
                        {isAdmin && (!p.hasInventory || (p.currentStock ?? 1) === 0) && (
                          <div className="mt-2">
                            <StockStatusSelect
                              productId={p.productId}
                              value={p.stockStatus ?? null}
                              onChange={(id, s) => setStockStatusMut.mutate({ id, status: s })}
                            />
                          </div>
                        )}
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
        <Modal title={modal === 'edit' ? 'Edit product' : 'New product'} onClose={() => setModal(null)} size="lg">
          <ProductForm
            initial={modal === 'edit' ? selected ?? undefined : undefined}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {deleting && isAdmin && (
        <ConfirmDialog
          message={`Delete "${deleting.name}"? This action cannot be undone.`}
          onConfirm={() => deleteMut.mutate(deleting.productId)}
          onClose={() => setDeleting(null)}
          loading={deleteMut.isPending}
        />
      )}

      {inventoryFor && isAdmin && (
        <Modal title="Add inventory" onClose={() => setInventoryFor(null)} size="sm">
          <QuickInventoryForm product={inventoryFor} onClose={() => setInventoryFor(null)} />
        </Modal>
      )}

      {lightbox && (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
