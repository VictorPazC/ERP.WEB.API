import { useState } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from './api';
import { inventoryApi } from '../inventory/api';
import type { Order, CreateOrderDto, CreateOrderItemDto } from '../../shared/types';
import PageHeader from '../../shared/components/PageHeader';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import EmptyState from '../../shared/components/EmptyState';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import Badge from '../../shared/components/Badge';
import { useUser } from '../../shared/context/UserContext';

const mxnFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

function statusColor(status: string): 'gray' | 'green' | 'red' {
  if (status === 'Confirmed') return 'green';
  if (status === 'Cancelled') return 'red';
  return 'gray';
}

const emptyItem = (): CreateOrderItemDto => ({ inventoryId: 0, quantity: 1, unitPrice: 0 });

export default function Orders() {
  const qc = useQueryClient();
  const { isAdmin } = useUser();

  const [modal, setModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreateOrderItemDto[]>([emptyItem()]);
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'delete'; order: Order } | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['orders'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => ordersApi.getAll(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
  const orders = data?.pages.flatMap(p => p.items) ?? [];

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-all'],
    queryFn: () => inventoryApi.getAll(undefined, 500),
  });
  const inventories = inventoryData?.items ?? [];

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (dto: CreateOrderDto) => ordersApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created');
      setModal(false);
    },
  });

  const confirmMut = useMutation({
    mutationFn: (id: number) => ordersApi.confirm(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order confirmed');
    },
  });

  const cancelMut = useMutation({
    mutationFn: (id: number) => ordersApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled');
      setConfirmAction(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => ordersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted');
      setConfirmAction(null);
    },
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openModal = () => {
    setNotes('');
    setItems([emptyItem()]);
    setModal(true);
  };

  const closeModal = () => setModal(false);

  const updateItem = (index: number, patch: Partial<CreateOrderItemDto>) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const liveTotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const canCreate = items.length > 0 && items.every(i => i.inventoryId > 0 && i.quantity > 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    createMut.mutate({ notes: notes.trim() || undefined, items });
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total`}
        action={isAdmin ? (
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30"
          >
            <Plus size={16} /> New order
          </button>
        ) : undefined}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders"
            description="Create orders to manage your sales"
          />
        ) : (
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800/60">
                  {['#', 'Status', 'Notes', 'Total', 'Items', 'Date', ''].map((h, i) => (
                    <th key={i} className="text-left px-5 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                {orders.map(order => (
                  <tr key={order.orderId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                    {/* # */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                          <ShoppingCart size={13} className="text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                          #{order.orderId}
                        </span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <Badge color={statusColor(order.status)}>{order.status}</Badge>
                    </td>
                    {/* Notes */}
                    <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {order.notes ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    {/* Total */}
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                      {mxnFormatter.format(order.totalAmount)}
                    </td>
                    {/* Items count */}
                    <td className="px-5 py-3.5">
                      <Badge color="gray">{order.items.length}</Badge>
                    </td>
                    {/* Date */}
                    <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-600 tabular-nums">
                      {new Date(order.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {order.status === 'Draft' && (
                            <button
                              onClick={() => confirmMut.mutate(order.orderId)}
                              title="Confirm order"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-500/10 transition-colors"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {(order.status === 'Draft' || order.status === 'Confirmed') && (
                            <button
                              onClick={() => setConfirmAction({ type: 'cancel', order })}
                              title="Cancel order"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          {order.status === 'Draft' && (
                            <button
                              onClick={() => setConfirmAction({ type: 'delete', order })}
                              title="Delete order"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
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
        )}
      </div>

      {/* ── New Order Modal ─────────────────────────────────────────────────── */}
      {isAdmin && modal && (
        <Modal title="New order" onClose={closeModal} size="md">
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
              />
            </div>

            {/* Items */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Items
              </label>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    {/* Inventory select */}
                    <div className="flex-1 min-w-0">
                      <select
                        value={item.inventoryId}
                        onChange={e => updateItem(index, { inventoryId: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      >
                        <option value={0} disabled>Select product…</option>
                        {inventories.map(inv => (
                          <option key={inv.inventoryId} value={inv.inventoryId}>
                            {inv.productName} (Stock: {inv.currentStock})
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Quantity */}
                    <div className="w-20 flex-shrink-0">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => updateItem(index, { quantity: Math.max(1, Number(e.target.value)) })}
                        placeholder="Qty"
                        className="w-full bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                    {/* Unit price */}
                    <div className="w-28 flex-shrink-0">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={e => updateItem(index, { unitPrice: Math.max(0, Number(e.target.value)) })}
                        placeholder="Unit price"
                        className="w-full bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="flex-shrink-0 p-2.5 rounded-xl text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add item */}
              <button
                type="button"
                onClick={addItem}
                className="mt-2 flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
              >
                <Plus size={14} /> Add item
              </button>
            </div>

            {/* Live total */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-700/60 rounded-xl">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                {mxnFormatter.format(liveTotal)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700/60 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canCreate || createMut.isPending}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors text-sm disabled:opacity-50"
              >
                {createMut.isPending ? 'Creating…' : 'Create order'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Confirm Cancel / Delete ──────────────────────────────────────────── */}
      {isAdmin && confirmAction?.type === 'cancel' && (
        <ConfirmDialog
          message={`Cancel order #${confirmAction.order.orderId}? This action cannot be undone.`}
          onConfirm={() => cancelMut.mutate(confirmAction.order.orderId)}
          onClose={() => setConfirmAction(null)}
          loading={cancelMut.isPending}
        />
      )}
      {isAdmin && confirmAction?.type === 'delete' && (
        <ConfirmDialog
          message={`Delete order #${confirmAction.order.orderId}? This action cannot be undone.`}
          onConfirm={() => deleteMut.mutate(confirmAction.order.orderId)}
          onClose={() => setConfirmAction(null)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
}
