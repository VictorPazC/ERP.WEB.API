import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Users as UsersIcon, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../api/users';
import type { User, CreateUserDto, UpdateUserDto } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { useUser } from '../context/UserContext';

const selectCls = "bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:border-gray-400 dark:hover:border-gray-600 transition-all";

function UserForm({ initial, onSave, onClose }: {
  initial?: User;
  onSave: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    role: initial?.role ?? 'User',
    status: initial?.status ?? 'Active',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    try {
      if (initial) {
        await onSave({ userId: initial.userId, name: form.name, email: form.email, role: form.role, status: form.status, password: form.password || undefined } as UpdateUserDto);
      } else {
        await onSave({ name: form.name, email: form.email, role: form.role, password: form.password || undefined } as CreateUserDto);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Name *" value={form.name} onChange={set('name')} placeholder="Full name" required />
      <FormField label="Email *" value={form.email} onChange={set('email')} placeholder="email@example.com" type="email" required />
      <FormField
        label={initial ? 'New password (leave blank to keep current)' : 'Password'}
        value={form.password}
        onChange={set('password')}
        type="password"
        placeholder="••••••••"
        required={!initial}
      />
      <div className={`grid grid-cols-1 ${initial ? 'sm:grid-cols-2' : ''} gap-4`}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</label>
          <select value={form.role} onChange={set('role')} className={selectCls}>
            <option>User</option>
            <option>Admin</option>
            <option>Manager</option>
          </select>
        </div>
        {initial && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select value={form.status} onChange={set('status')} className={selectCls}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50">
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function Users() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.getAll });
  const { isAdmin } = useUser();

  const createMut = useMutation({ mutationFn: (dto: CreateUserDto) => usersApi.create(dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created'); } });
  const updateMut = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: UpdateUserDto }) => usersApi.update(id, dto), onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => usersApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); setDeleting(null); } });

  const handleSave = async (data: CreateUserDto | UpdateUserDto) => {
    if (selected) await updateMut.mutateAsync({ id: selected.userId, dto: data as UpdateUserDto });
    else await createMut.mutateAsync(data as CreateUserDto);
  };

  const filtered = users?.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = (role: string): 'indigo' | 'yellow' | 'green' | 'gray' =>
    role === 'Admin' ? 'indigo' : role === 'Manager' ? 'yellow' : 'gray';

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${users?.length ?? 0} total`}
        action={
          isAdmin ? (
            <button onClick={() => { setSelected(null); setModal('create'); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30">
              <Plus size={16} /> New User
            </button>
          ) : undefined
        }
      />
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
        </div>

        {isLoading ? <LoadingSpinner /> : filtered?.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" description="Create your first user or adjust the search" />
        ) : (
          <>
            <div className="hidden md:block bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800/60">
                    {['Name', 'Email', 'Role', 'Status', 'Created', ''].map(h => (
                      <th key={h} className="text-left px-6 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                  {filtered?.map(u => (
                    <tr key={u.userId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{u.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4"><Badge color={roleColor(u.role)}>{u.role}</Badge></td>
                      <td className="px-6 py-4"><Badge color={u.status === 'Active' ? 'green' : 'yellow'}>{u.status}</Badge></td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-600 tabular-nums">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelected(u); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
                            <button onClick={() => setDeleting(u)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filtered?.map(u => (
                <div key={u.userId} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-600 truncate">{u.email}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setSelected(u); setModal('edit'); }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => setDeleting(u)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge color={u.status === 'Active' ? 'green' : 'yellow'}>{u.status}</Badge>
                    <Badge color={roleColor(u.role)}>{u.role}</Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-600 mt-2 tabular-nums">{new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {isAdmin && (modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit User' : 'New User'} onClose={() => setModal(null)}>
          <UserForm initial={modal === 'edit' ? selected ?? undefined : undefined} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
      {isAdmin && deleting && (
        <ConfirmDialog message={`Delete "${deleting.name}"? This action cannot be undone.`} onConfirm={() => deleteMut.mutate(deleting.userId)} onClose={() => setDeleting(null)} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
