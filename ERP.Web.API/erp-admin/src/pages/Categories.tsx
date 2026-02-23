import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Layers, ChevronRight } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
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

  const available = categories.filter(c => c.categoryId !== initial?.categoryId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Name *" value={name} onChange={e => setName(e.target.value)} placeholder="Category name" required />
      <FormField label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-400">Parent Category</label>
        <select
          value={parentId}
          onChange={e => setParentId(e.target.value)}
          className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-gray-600 transition-all"
        >
          <option value="">None (Main Category)</option>
          {available.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-700/60 rounded-xl text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function Categories() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll });

  const createMut = useMutation({ mutationFn: (dto: CreateCategoryDto) => categoriesApi.create(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: UpdateCategoryDto }) => categoriesApi.update(id, dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => categoriesApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category deleted'); setDeleting(null); } });

  const handleSave = async (data: CreateCategoryDto | UpdateCategoryDto) => {
    if (selected) {
      await updateMut.mutateAsync({ id: selected.categoryId, dto: data as UpdateCategoryDto });
    } else {
      await createMut.mutateAsync(data as CreateCategoryDto);
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${categories?.length ?? 0} total`}
        action={
          <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> New Category
          </button>
        }
      />
      <div className="p-8">
        {isLoading ? <LoadingSpinner /> : categories?.length === 0 ? (
          <EmptyState icon={Layers} title="No categories yet" description="Create your first category to get started" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categories?.map(cat => (
              <div key={cat.categoryId} className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 hover:border-gray-700/60 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl ring-1 ring-indigo-500/20">
                      <Layers size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{cat.name}</h3>
                      {cat.parentCategoryName && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <ChevronRight size={12} className="text-gray-600" />
                          <span className="text-xs text-gray-600">{cat.parentCategoryName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSelected(cat); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleting(cat)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                {cat.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{cat.description}</p>}
                <div className="flex gap-2">
                  <Badge color="indigo">{cat.subCategoriesCount} subcategories</Badge>
                  <Badge color="gray">{cat.productsCount} products</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Category' : 'New Category'} onClose={() => setModal(null)}>
          <CategoryForm initial={modal === 'edit' ? selected ?? undefined : undefined} categories={categories ?? []} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog message={`Delete "${deleting.name}"? This action cannot be undone.`} onConfirm={() => deleteMut.mutate(deleting.categoryId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
