import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Layers, ChevronRight, ChevronDown, FolderOpen, Folder, Eye } from 'lucide-react';
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

const selectCls = "bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all";

function CategoryForm({ initial, categories, onSave, onClose }: {
  initial?: Category;
  categories: Category[];
  onSave: (data: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [parentId, setParentId] = useState<string>(initial?.parentCategoryId?.toString() ?? '');
  const [loading, setLoading] = useState(false);

  // Duplicate check: same name (case-insensitive), different id
  const isDuplicate = name.trim().length > 0 && categories.some(
    c => c.name.trim().toLowerCase() === name.trim().toLowerCase()
      && c.categoryId !== initial?.categoryId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isDuplicate) return;
    setLoading(true);
    try {
      if (initial) {
        await onSave({ categoryId: initial.categoryId, name, description: description || undefined, parentCategoryId: parentId ? Number(parentId) : undefined } as UpdateCategoryDto);
      } else {
        await onSave({ name, description: description || undefined, parentCategoryId: parentId ? Number(parentId) : undefined } as CreateCategoryDto);
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
  // Nodos atrapados en un ciclo no son alcanzables desde la raíz — los surfaceamos
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
  // Sort roots and children alphabetically
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

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 sm:px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group border-b border-gray-100 dark:border-gray-800/40 ${depth > 0 ? 'bg-gray-50/50 dark:bg-white/[0.01]' : ''}`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`p-0.5 rounded transition-colors flex-shrink-0 ${hasChildren ? 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer' : 'text-transparent cursor-default'}`}
        >
          {hasChildren ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <ChevronRight size={14} />}
        </button>

        <div className={`p-1.5 rounded-lg flex-shrink-0 ${depth === 0 ? 'bg-indigo-500/10 ring-1 ring-indigo-500/20' : 'bg-gray-200/60 dark:bg-gray-700/30 ring-1 ring-gray-300/40 dark:ring-gray-700/40'}`}>
          {hasChildren && expanded ? (
            <FolderOpen size={14} className={depth === 0 ? 'text-indigo-400' : 'text-gray-500 dark:text-gray-400'} />
          ) : (
            <Folder size={14} className={depth === 0 ? 'text-indigo-400' : 'text-gray-500 dark:text-gray-400'} />
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
