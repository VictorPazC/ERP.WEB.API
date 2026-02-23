import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-700/60 rounded-xl text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
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

  const { data: tags, isLoading } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll });

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
        subtitle={`${tags?.length ?? 0} total`}
        action={
          <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> New Tag
          </button>
        }
      />
      <div className="p-8">
        {isLoading ? <LoadingSpinner /> : tags?.length === 0 ? (
          <EmptyState icon={TagIcon} title="No tags yet" description="Create tags to label and group your products" />
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags?.map(tag => (
              <div key={tag.tagId} className="flex items-center gap-2.5 bg-gray-900/60 border border-gray-800/60 rounded-xl px-4 py-3 hover:border-indigo-500/30 transition-all duration-200 group">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                  <TagIcon size={13} className="text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-white">{tag.tagName}</span>
                <Badge color="gray">{tag.productsCount}</Badge>
                <div className="flex gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setSelected(tag); setModal('edit'); }} className="p-1 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-colors"><Pencil size={12} /></button>
                  <button onClick={() => setDeleting(tag)} className="p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Tag' : 'New Tag'} onClose={() => setModal(null)} size="sm">
          <TagForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog message={`Delete tag "${deleting.tagName}"?`} onConfirm={() => deleteMut.mutate(deleting.tagId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
