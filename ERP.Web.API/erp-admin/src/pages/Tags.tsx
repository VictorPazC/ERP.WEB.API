import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tag as TagIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { tagsApi } from '../api/tags';
import type { Tag, CreateTagDto, UpdateTagDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { useUser } from '../context/UserContext';

function TagForm({ initial, onSave, onClose }: {
  initial?: Tag;
  onSave: (data: CreateTagDto | UpdateTagDto) => Promise<void>;
  onClose: () => void;
}) {
  const [tagName, setTagName] = useState(initial?.tagName ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    setLoading(true);
    try {
      if (initial) {
        await onSave({ tagId: initial.tagId, tagName } as UpdateTagDto);
      } else {
        await onSave({ tagName } as CreateTagDto);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Tag Name *" value={tagName} onChange={e => setTagName(e.target.value)} placeholder="e.g. Bestseller, New Arrival" required />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function Tags() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['tags'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => tagsApi.getAll(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
  const tags = data?.pages.flatMap(p => p.items) ?? [];
  const { isAdmin } = useUser();

  const createMut = useMutation({ mutationFn: (dto: CreateTagDto) => tagsApi.create(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Tag created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: UpdateTagDto }) => tagsApi.update(id, dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Tag updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => tagsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Tag deleted'); setDeleting(null); } });

  const handleSave = async (data: CreateTagDto | UpdateTagDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.tagId, dto: data as UpdateTagDto });
    else await createMut.mutateAsync(data as CreateTagDto);
  };

  return (
    <div>
      <PageHeader
        title="Tags"
        subtitle={`${tags.length} total`}
        action={
          isAdmin ? (
            <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
              <Plus size={16} /> New Tag
            </button>
          ) : undefined
        }
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? <LoadingSpinner /> : tags.length === 0 ? (
          <EmptyState icon={TagIcon} title="No tags yet" description="Create tags to label and group your products" />
        ) : (
          <>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {tags.map(tag => (
                <div key={tag.tagId} className="flex items-center gap-2 sm:gap-2.5 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 hover:border-indigo-500/30 transition-all duration-200 group">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <TagIcon size={13} className="text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{tag.tagName}</span>
                  <Badge color="gray">{tag.productsCount}</Badge>
                  {isAdmin && (
                    <div className="flex gap-1 ml-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelected(tag); setModal('edit'); }} className="p-1 rounded-lg text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={12} /></button>
                      <button onClick={() => setDeleting(tag)} className="p-1 rounded-lg text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
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
          </>
        )}
      </div>

      {isAdmin && (modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Tag' : 'New Tag'} onClose={() => setModal(null)} size="sm">
          <TagForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {isAdmin && deleting && (
        <ConfirmDialog message={`Delete tag "${deleting.tagName}"?`} onConfirm={() => deleteMut.mutate(deleting.tagId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
