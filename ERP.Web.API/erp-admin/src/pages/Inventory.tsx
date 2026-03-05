import { useState, useRef, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Archive, TrendingUp, Search, Check, ChevronDown, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../api/inventory';
import { productsApi } from '../api/products';
import { productImagesApi } from '../api/productImages';
import type { Product, Inventory, CreateInventoryDto, UpdateInventoryDto, ProductImage } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { imageUrl } from '../utils/imageUrl';
import { useUser } from '../context/UserContext';

/* ── Image Lightbox ─────────────────────────────────────────── */
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

/* ── Product thumbnail ──────────────────────────────────────── */
function ProductThumb({
  images, productId, onClick,
}: {
  images: ProductImage[] | undefined;
  productId: number;
  onClick?: () => void;
}) {
  const img = images?.find(i => i.productId === productId && i.isPrimary) ?? images?.find(i => i.productId === productId);
  const src = img ? imageUrl(img.imagePath) : undefined;

  const cls = `w-9 h-9 sm:w-10 sm:h-10 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700/40 flex-shrink-0 ${onClick && src ? 'cursor-zoom-in' : ''}`;

  if (!src) return (
    <div className={`${cls} bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center`}>
      <Package size={14} className="text-gray-400 dark:text-gray-500" />
    </div>
  );
  return (
    <img
      src={src}
      alt=""
      className={`${cls} object-cover bg-gray-100 dark:bg-gray-800/60`}
      loading="lazy"
      onClick={onClick}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

/* ── Product selector ───────────────────────────────────────── */
function ProductSelector({ value, onChange, products, allImages }: {
  value: string;
  onChange: (val: string) => void;
  products: Product[] | undefined;
  allImages: ProductImage[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = products?.find(p => p.productId.toString() === value);

  const filtered = (products ?? []).filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q)
      || (p.description ?? '').toLowerCase().includes(q)
      || (p.brand ?? '').toLowerCase().includes(q);
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Product *</label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all flex items-center gap-2"
        >
          {selected ? (
            <div className="flex-1 min-w-0">
              <span className="text-gray-900 dark:text-white font-medium">{selected.name}</span>
              {selected.description && (
                <span className="text-gray-500 ml-2 text-xs truncate hidden sm:inline">— {selected.description}</span>
              )}
            </div>
          ) : (
            <span className="text-gray-500 flex-1">Select a product...</span>
          )}
          <ChevronDown size={14} className={`text-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
            <div className="p-2 border-b border-gray-100 dark:border-gray-800/60">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, description or brand..."
                  className="w-full bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/40 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-600">No products found</div>
              ) : (
                filtered.map(p => (
                  <button
                    key={p.productId}
                    type="button"
                    onClick={() => { onChange(p.productId.toString()); setOpen(false); setSearch(''); }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors flex items-start gap-3 border-b border-gray-100 dark:border-gray-800/30 last:border-0 ${
                      value === p.productId.toString() ? 'bg-indigo-500/10' : ''
                    }`}
                  >
                    <ProductThumb images={allImages} productId={p.productId} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                        {p.brand && <Badge color="gray">{p.brand}</Badge>}
                      </div>
                      {p.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>
                      )}
                      {p.categoryName && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-600 mt-1 inline-block">{p.categoryName}</span>
                      )}
                    </div>
                    {value === p.productId.toString() && (
                      <Check size={14} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Inventory form ─────────────────────────────────────────── */
function InventoryForm({ initial, onSave, onClose }: {
  initial?: Inventory;
  onSave: (data: CreateInventoryDto | UpdateInventoryDto) => Promise<void>;
  onClose: () => void;
}) {
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.getAll });
  const { data: allImages } = useQuery({ queryKey: ['product-images'], queryFn: productImagesApi.getAll });
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
    if (!initial && !form.productId) return;
    setLoading(true);
    try {
      if (initial) {
        await onSave({ inventoryId: initial.inventoryId, purchaseCost: Number(form.purchaseCost), suggestedRetailPrice: Number(form.suggestedRetailPrice), currentStock: Number(form.currentStock), lastRestockDate: form.lastRestockDate, lastSaleDate: form.lastSaleDate || undefined, needsRestock: initial.needsRestock } as UpdateInventoryDto);
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
        <ProductSelector value={form.productId} onChange={val => setForm(f => ({ ...f, productId: val }))} products={products} allImages={allImages} />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Purchase Cost *" value={form.purchaseCost} onChange={set('purchaseCost')} type="number" step="0.01" min="0" placeholder="0.00" required />
        <FormField label="Retail Price *" value={form.suggestedRetailPrice} onChange={set('suggestedRetailPrice')} type="number" step="0.01" min="0" placeholder="0.00" required />
      </div>
      <FormField label="Current Stock *" value={form.currentStock} onChange={set('currentStock')} type="number" min="0" placeholder="0" required />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Last Restock Date" value={form.lastRestockDate} onChange={set('lastRestockDate')} type="date" />
        <FormField label="Last Sale Date" value={form.lastSaleDate} onChange={set('lastSaleDate')} type="date" />
      </div>
      {form.purchaseCost && form.suggestedRetailPrice && (
        <div className="bg-indigo-500/10 ring-1 ring-indigo-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-500 dark:text-indigo-400" />
          <span className="text-sm text-indigo-600 dark:text-indigo-300">Estimated Profit: <strong className="text-indigo-700 dark:text-indigo-200">${(Number(form.suggestedRetailPrice) - Number(form.purchaseCost)).toFixed(2)}</strong></span>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function InventoryPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Inventory | null>(null);
  const [deleting, setDeleting] = useState<Inventory | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['inventory'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => inventoryApi.getAll(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
  const inventory = data?.pages.flatMap(p => p.items) ?? [];
  const { data: allImages } = useQuery({ queryKey: ['product-images'], queryFn: productImagesApi.getAll });

  const createMut = useMutation({ mutationFn: (dto: CreateInventoryDto) => inventoryApi.create(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Inventory created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: UpdateInventoryDto }) => inventoryApi.update(id, dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Inventory updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => inventoryApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Inventory deleted'); setDeleting(null); } });

  const { isAdmin } = useUser();

  const handleSave = async (data: CreateInventoryDto | UpdateInventoryDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.inventoryId, dto: data as UpdateInventoryDto });
    else await createMut.mutateAsync(data as CreateInventoryDto);
  };

  const openLightbox = (productId: number, name: string) => {
    const img = allImages?.find(i => i.productId === productId && i.isPrimary) ?? allImages?.find(i => i.productId === productId);
    if (img) setLightbox({ src: imageUrl(img.imagePath)!, alt: name });
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${inventory.length} records`}
        action={isAdmin ? (
          <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> Add Inventory
          </button>
        ) : undefined}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? <LoadingSpinner /> : inventory.length === 0 ? (
          <EmptyState icon={Archive} title="No inventory records" description="Add your first inventory record" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800/60">
                    {['', 'Product', 'Cost', 'Retail Price', 'Profit', 'Stock', 'Last Restock', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                  {inventory.map(inv => (
                    <tr key={inv.inventoryId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-3">
                        <ProductThumb
                          images={allImages}
                          productId={inv.productId}
                          onClick={() => openLightbox(inv.productId, inv.productName ?? '')}
                        />
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{inv.productName ?? `#${inv.productId}`}</td>
                      <td className="px-5 py-3 text-sm text-gray-500 tabular-nums">${inv.purchaseCost.toFixed(2)}</td>
                      <td className="px-5 py-3 text-sm text-gray-500 tabular-nums">${inv.suggestedRetailPrice.toFixed(2)}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">+${inv.estimatedProfit.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <Badge color={inv.currentStock === 0 ? 'red' : inv.currentStock < 10 ? 'yellow' : 'green'}>{inv.currentStock} units</Badge>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-600 tabular-nums">{new Date(inv.lastRestockDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAdmin && <button onClick={() => { setSelected(inv); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>}
                          {isAdmin && <button onClick={() => setDeleting(inv)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>}
                        </div>
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

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {inventory.map(inv => (
                <div key={inv.inventoryId} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800/60 ring-1 ring-gray-200 dark:ring-gray-700/40 flex items-center justify-center flex-shrink-0 cursor-zoom-in"
                      onClick={() => openLightbox(inv.productId, inv.productName ?? '')}
                    >
                      {(() => {
                        const img = allImages?.find(i => i.productId === inv.productId && i.isPrimary) ?? allImages?.find(i => i.productId === inv.productId);
                        const src = img ? imageUrl(img.imagePath) : null;
                        return src
                          ? <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <Package size={20} className="text-gray-400 dark:text-gray-600" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{inv.productName ?? `#${inv.productId}`}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-600 mt-0.5 tabular-nums">Restock: {new Date(inv.lastRestockDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {isAdmin && <button onClick={() => { setSelected(inv); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>}
                          {isAdmin && <button onClick={() => setDeleting(inv)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-600 uppercase">Cost</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">${inv.purchaseCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-600 uppercase">Retail</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">${inv.suggestedRetailPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-600 uppercase">Profit</p>
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">+${inv.estimatedProfit.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Badge color={inv.currentStock === 0 ? 'red' : inv.currentStock < 10 ? 'yellow' : 'green'}>{inv.currentStock} units</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {isAdmin && (modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Inventory' : 'Add Inventory'} onClose={() => setModal(null)}>
          <InventoryForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {isAdmin && deleting && (
        <ConfirmDialog message={`Delete inventory for "${deleting.productName}"?`} onConfirm={() => deleteMut.mutate(deleting.inventoryId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
      {lightbox && (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
