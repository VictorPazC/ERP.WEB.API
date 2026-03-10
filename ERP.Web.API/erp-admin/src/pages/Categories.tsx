import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Layers, ChevronRight, ChevronDown, FolderOpen, Folder, Eye, ImageIcon, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesApi } from '../api/categories';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types';
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

/* ── Image upload widget ──────────────────────────────────────── */
function CategoryImageUpload({
  categoryId,
  currentImagePath,
  onUploaded,
}: {
  categoryId?: number;
  currentImagePath?: string;
  onUploaded: (path: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImagePath ? imageUrl(currentImagePath) ?? null : null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    // Local preview immediately
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    if (!categoryId) {
      // Category not yet saved — caller will handle upload after creation
      onUploaded('__pending__');
      // Store file ref for later
      (handleFile as any).__pendingFile = file;
      return;
    }

    setUploading(true);
    try {
      const res = await categoriesApi.uploadImage(categoryId, file);
      onUploaded(res.imagePath);
      toast.success('Imagen guardada');
    } catch {
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Imagen de portada <span className="font-normal text-gray-400 dark:text-gray-600">(opcional, máx. 5 MB)</span>
      </label>
      <div
        onClick={() => fileRef.current?.click()}
        className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 border-dashed transition-all ${
          preview
            ? 'border-transparent'
            : 'border-gray-300 dark:border-gray-700/60 hover:border-indigo-400 dark:hover:border-indigo-500/60'
        }`}
        style={{ height: 120 }}
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Upload size={18} className="text-white" />
              <span className="text-white text-sm font-medium">Cambiar imagen</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 dark:text-gray-600 hover:text-indigo-400 transition-colors">
            <ImageIcon size={24} />
            <span className="text-xs font-medium">Clic para subir imagen</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
      {preview && !uploading && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setPreview(null); onUploaded(''); }}
          className="self-start flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
        >
          <X size={12} /> Quitar imagen
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

/* ── Category form ────────────────────────────────────────────── */
function CategoryForm({ initial, categories, onSave, onClose }: {
  initial?: Category;
  categories: Category[];
  onSave: (data: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [parentId, setParentId] = useState<string>(initial?.parentCategoryId?.toString() ?? '');
  const [imagePath, setImagePath] = useState<string>(initial?.imagePath ?? '');
  const [loading, setLoading] = useState(false);

  const isDuplicate = name.trim().length > 0 && categories.some(
    c => c.name.trim().toLowerCase() === name.trim().toLowerCase()
      && c.categoryId !== initial?.categoryId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isDuplicate) return;
    setLoading(true);
    try {
      const img = imagePath === '__pending__' ? undefined : (imagePath || undefined);
      if (initial) {
        await onSave({ categoryId: initial.categoryId, name, description: description || undefined, parentCategoryId: parentId ? Number(parentId) : undefined, imagePath: img } as UpdateCategoryDto);
      } else {
        await onSave({ name, description: description || undefined, parentCategoryId: parentId ? Number(parentId) : undefined, imagePath: img } as CreateCategoryDto);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const descendantIds = initial ? getDescendantIds(initial.categoryId, categories) : new Set<number>();
  const available = categories
    .filter(c => c.categoryId !== initial?.categoryId && !descendantIds.has(c.categoryId))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Name *"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Category name"
        required
        error={isDuplicate ? `"${name.trim()}" already exists` : undefined}
      />
      <FormField label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Parent Category</label>
        <select value={parentId} onChange={e => setParentId(e.target.value)} className={selectCls}>
          <option value="">None (Main Category)</option>
          {available.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
        </select>
      </div>
      <CategoryImageUpload
        categoryId={initial?.categoryId}
        currentImagePath={initial?.imagePath}
        onUploaded={setImagePath}
      />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading || isDuplicate} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

interface TreeNode extends Category {
  children: TreeNode[];
}

function getDescendantIds(categoryId: number, categories: Category[]): Set<number> {
  const ids = new Set<number>();
  const queue = [categoryId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const cat of categories) {
      if (cat.parentCategoryId === current && !ids.has(cat.categoryId)) {
        ids.add(cat.categoryId);
        queue.push(cat.categoryId);
      }
    }
  }
  return ids;
}

function buildTree(categories: Category[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];
  for (const cat of categories) map.set(cat.categoryId, { ...cat, children: [] });
  for (const cat of categories) {
    const node = map.get(cat.categoryId)!;
    if (cat.parentCategoryId && map.has(cat.parentCategoryId)) {
      map.get(cat.parentCategoryId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const visited = new Set<number>();
  const stack = [...roots];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (visited.has(node.categoryId)) continue;
    visited.add(node.categoryId);
    for (const child of node.children) stack.push(child);
  }
  for (const [id, node] of map) {
    if (!visited.has(id)) roots.push(node);
  }
  roots.sort((a, b) => a.name.localeCompare(b.name));
  for (const node of map.values()) {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
  }
  return roots;
}

function CategoryTreeNode({ node, depth, onEdit, onDelete, onView, isAdmin }: {
  node: TreeNode;
  depth: number;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onView: (cat: Category) => void;
  isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const imgSrc = node.imagePath ? imageUrl(node.imagePath) : null;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group border-b border-gray-100 dark:border-gray-800/40 ${depth > 0 ? 'bg-gray-50/50 dark:bg-white/[0.01]' : ''}`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`p-0.5 rounded transition-colors flex-shrink-0 ${hasChildren ? 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer' : 'text-transparent cursor-default'}`}
        >
          {hasChildren ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <ChevronRight size={14} />}
        </button>

        {/* Category thumbnail */}
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700/40 flex items-center justify-center bg-gray-100 dark:bg-gray-800/60">
          {imgSrc ? (
            <img src={imgSrc} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            depth === 0
              ? <FolderOpen size={13} className="text-indigo-400" />
              : <Folder size={13} className="text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${depth === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {node.name}
            </span>
            {node.description && (
              <span className="text-xs text-gray-500 dark:text-gray-600 truncate hidden sm:inline">— {node.description}</span>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {node.subCategoriesCount > 0
            ? <Badge color="indigo">{node.subCategoriesCount} sub</Badge>
            : <Badge color="gray">leaf</Badge>
          }
          {node.productsCount > 0 && <Badge color="gray">{node.productsCount} products</Badge>}
          {node.imagePath && <Badge color="green"><ImageIcon size={10} className="inline mr-0.5" />img</Badge>}
        </div>

        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onView(node)} title="Ver artículos" className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"><Eye size={14} /></button>
          {isAdmin && <button onClick={() => onEdit(node)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>}
          {isAdmin && <button onClick={() => onDelete(node)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>}
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <CategoryTreeNode key={child.categoryId} node={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onView={onView} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Categories() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['categories'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => categoriesApi.getAll(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
  const categories = data?.pages.flatMap(p => p.items) ?? [];
  const tree = useMemo(() => buildTree(categories), [categories]);

  const createMut = useMutation({ mutationFn: (dto: CreateCategoryDto) => categoriesApi.create(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: UpdateCategoryDto }) => categoriesApi.update(id, dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => categoriesApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category deleted'); setDeleting(null); } });

  const { isAdmin } = useUser();

  const handleSave = async (data: CreateCategoryDto | UpdateCategoryDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.categoryId, dto: data as UpdateCategoryDto });
    else await createMut.mutateAsync(data as CreateCategoryDto);
  };

  const handleEdit = (cat: Category) => { setSelected(cat); setModal('edit'); };
  const handleDelete = (cat: Category) => setDeleting(cat);
  const handleView = (cat: Category) => navigate(`/products?categoryId=${cat.categoryId}`);

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} total`}
        action={isAdmin ? (
          <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> New Category
          </button>
        ) : undefined}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? <LoadingSpinner /> : categories.length === 0 ? (
          <EmptyState icon={Layers} title="No categories yet" description="Create your first category to get started" />
        ) : (
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800/60">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <Layers size={12} />
                Category Tree
              </div>
            </div>
            <div>
              {tree.map(node => (
                <CategoryTreeNode key={node.categoryId} node={node} depth={0} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} isAdmin={isAdmin} />
              ))}
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
          </div>
        )}
      </div>

      {isAdmin && (modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Category' : 'New Category'} onClose={() => setModal(null)}>
          <CategoryForm initial={modal === 'edit' ? selected ?? undefined : undefined} categories={categories} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {isAdmin && deleting && (
        <ConfirmDialog message={`Delete "${deleting.name}"? This action cannot be undone.`} onConfirm={() => deleteMut.mutate(deleting.categoryId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
