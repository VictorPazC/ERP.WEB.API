import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Factory } from 'lucide-react';
import toast from 'react-hot-toast';
import { companiesApi } from '../api/companies';
import type { Company, CreateCompanyDto, UpdateCompanyDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';

function CompanyForm({ initial, onSave, onClose }: {
  initial?: Company;
  onSave: (data: CreateCompanyDto | UpdateCompanyDto) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    logoUrl: initial?.logoUrl ?? '',
    customDomain: initial?.customDomain ?? '',
    primaryColor: initial?.primaryColor ?? '#6366f1',
    isActive: initial?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    setLoading(true);
    try {
      if (initial) {
        await onSave({
          companyId: initial.companyId, name: form.name, slug: form.slug,
          description: form.description || undefined, logoUrl: form.logoUrl || undefined,
          customDomain: form.customDomain || undefined, primaryColor: form.primaryColor || undefined,
          isActive: form.isActive,
        } as UpdateCompanyDto);
      } else {
        await onSave({
          name: form.name, slug: form.slug,
          description: form.description || undefined, logoUrl: form.logoUrl || undefined,
          customDomain: form.customDomain || undefined, primaryColor: form.primaryColor || undefined,
        } as CreateCompanyDto);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(f => ({
      ...f,
      name,
      slug: f.slug === '' || f.slug === slugify(f.name) ? slugify(name) : f.slug,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Name *" value={form.name} onChange={handleNameChange} placeholder="Company name" required />
      <FormField label="Slug *" value={form.slug} onChange={set('slug')} placeholder="company-slug" required />
      <FormField label="Description" value={form.description} onChange={set('description')} placeholder="Optional description" />
      <FormField label="Logo URL" value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." />
      <FormField label="Custom Domain" value={form.customDomain} onChange={set('customDomain')} placeholder="company1.erp.com" />
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary Color</label>
        <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
          className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer" />
        <span className="text-xs text-gray-500 font-mono">{form.primaryColor}</span>
      </div>
      {initial && (
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
            className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
          <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
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

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function Companies() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState<Company | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['companies'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => companiesApi.getAll(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
  const companies = data?.pages.flatMap(p => p.items) ?? [];

  const createMut = useMutation({ mutationFn: (dto: CreateCompanyDto) => companiesApi.create(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); toast.success('Company created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: UpdateCompanyDto }) => companiesApi.update(id, dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); toast.success('Company updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => companiesApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); toast.success('Company deactivated'); setDeleting(null); } });

  const handleSave = async (data: CreateCompanyDto | UpdateCompanyDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.companyId, dto: data as UpdateCompanyDto });
    else await createMut.mutateAsync(data as CreateCompanyDto);
  };

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle={`${companies.length} total`}
        action={
          <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
            <Plus size={16} /> New Company
          </button>
        }
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? <LoadingSpinner /> : companies.length === 0 ? (
          <EmptyState icon={Factory} title="No companies yet" description="Create your first company to get started" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map(p => (
              <div key={p.companyId} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: (p.primaryColor ?? '#6366f1') + '15', border: `1px solid ${p.primaryColor ?? '#6366f1'}33` }}>
                      {p.logoUrl
                        ? <img src={p.logoUrl} alt="" className="w-6 h-6 rounded object-cover" />
                        : <Factory size={18} style={{ color: p.primaryColor ?? '#6366f1' }} />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-600 font-mono">{p.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setSelected(p); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleting(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                {p.description && <p className="text-xs text-gray-500 dark:text-gray-600 mb-3 line-clamp-2">{p.description}</p>}
                <div className="flex flex-wrap gap-2">
                  <Badge color={p.isActive ? 'green' : 'yellow'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                  {p.customDomain && <Badge color="indigo">{p.customDomain}</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
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

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Company' : 'New Company'} onClose={() => setModal(null)}>
          <CompanyForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog message={`Deactivate "${deleting.name}"? The company will be hidden but data preserved.`} onConfirm={() => deleteMut.mutate(deleting.companyId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
