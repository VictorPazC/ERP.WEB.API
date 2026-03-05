import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Image, Star, Upload, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { productImagesApi } from './api';
import { productsApi } from '../products/api';
import type { ProductImage, UpdateProductImageDto } from '../../shared/types';
import PageHeader from '../../shared/components/PageHeader';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import FormField from '../../shared/components/FormField';
import SearchableSelect from '../../shared/components/SearchableSelect';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Badge from '../../shared/components/Badge';
import { imageUrl } from '../../utils/imageUrl';
import { useUser } from '../../shared/context/UserContext';

/* ── Image Lightbox ───────────────────────────────────────── */
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
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
        className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
      {alt && (
        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap max-w-[80vw] truncate">
          {alt}
        </p>
      )}
    </div>
  );
}

function UploadForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: rawProducts } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll(), staleTime: Infinity, refetchOnWindowFocus: false });
  const products = rawProducts?.items;
  // staleTime: Infinity + refetchOnWindowFocus: false prevents opening/closing
  // the OS file picker from triggering a refetch that resets the form state
  const { data: rawImages } = useQuery({
    queryKey: ['product-images'],
    queryFn: () => productImagesApi.getAll(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const images = rawImages?.items;
  const [productId, setProductId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Snapshot of products with image on form mount — does not change during the session
  const productsWithImage = useMemo(
    () => new Set(images?.map(img => img.productId) ?? []),
    [images]
  );
  const productsWithImageRef = useRef(productsWithImage);
  useEffect(() => { productsWithImageRef.current = productsWithImage; }, [productsWithImage]);

  // Sort: first those without image, then alphabetical
  // useMemo with ref so the order doesn't change if there's a background refetch
  const sortedProducts = useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => {
      const aHas = productsWithImage.has(a.productId) ? 1 : 0;
      const bHas = productsWithImage.has(b.productId) ? 1 : 0;
      return aHas - bHas || a.name.localeCompare(b.name);
    });
  }, [products, productsWithImage]);

  // Auto-mark as primary only when the user changes the selected product
  // (not when the image snapshot changes due to a background refetch)
  useEffect(() => {
    if (!productId) return;
    setIsPrimary(!productsWithImageRef.current.has(Number(productId)));
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const accepted = Array.from(newFiles).filter(f =>
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type)
    );
    if (accepted.length === 0) { toast.error('Only JPG, PNG, GIF, WEBP'); return; }
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

  // Snapshot of files so isPrimary is evaluated with the list at the time of submit
  const filesRef = useRef(files);
  useEffect(() => { filesRef.current = files; }, [files]);

  const uploadMut = useMutation({
    mutationFn: (file: File) => productImagesApi.upload(
      file,
      Number(productId),
      isPrimary && filesRef.current.indexOf(file) === 0,
      Number(displayOrder),
    ),
    // NOT invalidated here — done ONCE in handleSubmit after the loop
    // to avoid intermediate refetches that re-render and confuse the form state
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || files.length === 0) return;
    setLoading(true);
    try {
      for (const file of files) await uploadMut.mutateAsync(file);
      // Invalidate ONCE, right before closing
      await qc.invalidateQueries({ queryKey: ['product-images'] });
      await qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`);
      onClose();
    } catch {
      toast.error('Upload error');
    } finally {
      setLoading(false);
    }
  };

  const noImage = productId ? !productsWithImage.has(Number(productId)) : false;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SearchableSelect
        label="Product *"
        value={productId}
        onChange={setProductId}
        options={sortedProducts.map(p => ({
          value: String(p.productId),
          label: productsWithImage.has(p.productId) ? p.name : `${p.name} — no image`,
        }))}
        placeholder="Search product…"
        clearLabel="Select product"
      />
      <div className="flex gap-2">
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 dark:border-gray-700/60 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
          }`}
        >
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
          <Upload size={24} className={`mx-auto mb-2 ${dragOver ? 'text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`} />
          <p className="text-sm text-gray-600 dark:text-gray-400">Click to select or drag images here</p>
          <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">JPG, PNG, GIF, WEBP · max 10 MB</p>
        </div>
        <div
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 w-24 border-2 border-dashed rounded-xl cursor-pointer transition-all border-gray-300 dark:border-gray-700/60 hover:border-indigo-500 hover:bg-indigo-500/10"
        >
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
          <Camera size={24} className="text-gray-400 dark:text-gray-600" />
          <p className="text-xs text-gray-600 dark:text-gray-400">Camera</p>
        </div>
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
        <FormField label="Display Order" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} type="number" min="0" placeholder="0" />
        <div className="flex flex-col gap-1 justify-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="w-4 h-4 accent-indigo-500 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">Primary image</span>
          </label>
          {noImage && (
            <p className="text-[11px] text-indigo-500 dark:text-indigo-400 pl-7">First image — will be marked as primary automatically</p>
          )}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading || files.length === 0} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Uploading…' : `Upload ${files.length || ''} image${files.length !== 1 ? 's' : ''}`}
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
      <FormField label="Display Order" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} type="number" min="0" placeholder="0" />
      <label className="flex items-center gap-3 cursor-pointer group">
        <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(f => ({ ...f, isPrimary: e.target.checked }))} className="w-4 h-4 accent-indigo-500 rounded" />
        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">Primary image (cover)</span>
      </label>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving…' : 'Update'}
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
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const { data: imagesData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['product-images'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => productImagesApi.getAll(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
  const images = imagesData?.pages.flatMap(p => p.items) ?? [];
  const { data: rawProducts } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });
  const products = rawProducts?.items;

  // productId → name map
  const productNameMap = new Map(products?.map(p => [p.productId, p.name]) ?? []);

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateProductImageDto }) => productImagesApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-images'] }); toast.success('Image updated'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => productImagesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['product-images'] }); toast.success('Image deleted'); setDeleting(null); },
  });

  return (
    <div>
      <PageHeader
        title="Product Images"
        subtitle={`${images.length} images`}
        action={isAdmin ? (
          <button onClick={() => { setSelected(null); setModal('upload'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> Upload image
          </button>
        ) : undefined}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? <LoadingSpinner /> : images.length === 0 ? (
          <EmptyState icon={Image} title="No images" description="Upload images for your products to display the catalog" />
        ) : (
          <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
            {images.map(img => {
              const src = imageUrl(img.imagePath);
              const productName = productNameMap.get(img.productId);
              return (
                <div key={img.imageId} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-700/60 transition-all duration-200 group">
                  <div
                    className={`aspect-square bg-gray-100 dark:bg-gray-800/40 flex items-center justify-center relative overflow-hidden ${src ? 'cursor-zoom-in' : ''}`}
                    onClick={() => src && setLightbox({ src, alt: productName ?? '' })}
                  >
                    {src ? (
                      <img
                        src={src}
                        alt={productName ?? ''}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        onError={e => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = 'none';
                          const fallback = el.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {/* Always-present fallback */}
                    <div style={{ display: src ? 'none' : 'flex' }} className="absolute inset-0 items-center justify-center flex-col gap-1 bg-gray-100 dark:bg-gray-800/40">
                      <Image size={20} className="text-gray-400 dark:text-gray-700" />
                    </div>
                    {img.isPrimary && (
                      <div className="absolute top-1 right-1 p-0.5 bg-amber-500 rounded shadow-sm shadow-amber-500/30">
                        <Star size={8} className="text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-1.5">
                    {/* Product name */}
                    <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate leading-tight mb-1">
                      {productName ?? `#${img.productId}`}
                    </p>
                    <div className="flex items-center justify-between gap-0.5">
                      <div className="flex gap-0.5 flex-wrap min-w-0">
                        {img.isPrimary && <Badge color="yellow">Primary</Badge>}
                        <Badge color="gray">#{img.displayOrder}</Badge>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => { setSelected(img); setModal('edit'); }} className="p-0.5 rounded text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={10} /></button>
                          <button onClick={() => setDeleting(img)} className="p-0.5 rounded text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={10} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
          </>
        )}
      </div>

      {modal === 'upload' && isAdmin && (
        <Modal title="Upload Images" onClose={() => setModal(null)}>
          <UploadForm onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'edit' && selected && isAdmin && (
        <Modal title="Edit Image" onClose={() => setModal(null)}>
          <EditForm initial={selected} onSave={async dto => { await updateMut.mutateAsync({ id: selected.imageId, dto }); }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {deleting && isAdmin && (
        <ConfirmDialog message="Delete this image? This action cannot be undone." onConfirm={() => deleteMut.mutate(deleting.imageId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
      {lightbox && (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
