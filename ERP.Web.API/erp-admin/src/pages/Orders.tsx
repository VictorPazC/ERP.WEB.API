import { useState, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, CheckCircle, XCircle, ShoppingCart,
  CreditCard, Banknote, Search, Settings2, X, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../api/orders';
import { consumptionsApi } from '../api/consumptions';
import { productImagesApi } from '../api/productImages';
import type { Order, CreateOrderDto, AvailableArticle } from '../types';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { useUser } from '../context/UserContext';
import { imageUrl } from '../utils/imageUrl';

const mxnFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

function statusColor(status: string): 'gray' | 'green' | 'red' {
  if (status === 'Confirmed') return 'green';
  if (status === 'Cancelled') return 'red';
  return 'gray';
}

function paymentColor(method?: string): 'gray' | 'green' | 'indigo' {
  if (method === 'Tarjeta') return 'indigo';
  if (method === 'Efectivo') return 'green';
  return 'gray';
}

// ── Cart item ──────────────────────────────────────────────────────────────
interface CartItem {
  inventoryId: number;
  productId: number;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
}

// ── Card fee localStorage ──────────────────────────────────────────────────
const FEE_KEY = 'erp-card-fee-rate';

function loadFeeRate(): number {
  const v = localStorage.getItem(FEE_KEY);
  if (!v) return 4;
  const n = parseFloat(v);
  return isNaN(n) ? 4 : Math.min(100, Math.max(0, n));
}

// ══════════════════════════════════════════════════════════════════════════
export default function Orders() {
  const qc = useQueryClient();
  const { isAdmin } = useUser();

  // ── Modal open/close ──────────────────────────────────────────────────
  const [modal, setModal] = useState(false);

  // ── Article picker state ──────────────────────────────────────────────
  const [search, setSearch] = useState('');

  // ── Cart state ────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');

  // ── Payment state ─────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta'>('Efectivo');
  const [feeRate, setFeeRate] = useState<number>(loadFeeRate);
  const [editingFee, setEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState('');

  // ── Confirm dialog state ──────────────────────────────────────────────
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'delete'; order: Order } | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['orders'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => ordersApi.getAll(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
  });
  const orders = data?.pages.flatMap(p => p.items) ?? [];

  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['available-articles'],
    queryFn: () => consumptionsApi.getAvailable(),
    enabled: modal,
    staleTime: 2 * 60 * 1000,
  });
  const articles: AvailableArticle[] = articlesData ?? [];

  const { data: imagesData } = useQuery({
    queryKey: ['product-images-map'],
    queryFn: () => productImagesApi.getAll(undefined, 500),
    enabled: modal,
    staleTime: 5 * 60 * 1000,
  });

  // productId → imagePath (primary first, fallback to any)
  const imageMap = useMemo<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    if (!imagesData) return map;
    for (const img of imagesData.items) {
      if (img.isPrimary) map[img.productId] = img.imagePath;
    }
    for (const img of imagesData.items) {
      if (!map[img.productId]) map[img.productId] = img.imagePath;
    }
    return map;
  }, [imagesData]);

  // ── Filtered articles ─────────────────────────────────────────────────
  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter(a =>
      a.productName.toLowerCase().includes(q) ||
      (a.variantName ?? '').toLowerCase().includes(q) ||
      (a.categoryName ?? '').toLowerCase().includes(q)
    );
  }, [articles, search]);

  // ── Mutations ─────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (dto: CreateOrderDto) => ordersApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Orden creada');
      setModal(false);
    },
  });

  const confirmMut = useMutation({
    mutationFn: (id: number) => ordersApi.confirm(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Orden confirmada');
    },
  });

  const cancelMut = useMutation({
    mutationFn: (id: number) => ordersApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Orden cancelada');
      setConfirmAction(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => ordersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Orden eliminada');
      setConfirmAction(null);
    },
  });

  // ── Cart helpers ──────────────────────────────────────────────────────
  const addToCart = (article: AvailableArticle) => {
    setCart(prev => {
      const existing = prev.find(c => c.inventoryId === article.inventoryId);
      if (existing) {
        return prev.map(c =>
          c.inventoryId === article.inventoryId
            ? { ...c, quantity: Math.min(c.quantity + 1, article.currentStock) }
            : c
        );
      }
      return [...prev, {
        inventoryId: article.inventoryId,
        productId: article.productId,
        productName: article.productName,
        variantName: article.variantName,
        quantity: 1,
        unitPrice: article.suggestedRetailPrice,
      }];
    });
  };

  const updateCartItem = (inventoryId: number, patch: Partial<Pick<CartItem, 'quantity' | 'unitPrice'>>) => {
    setCart(prev => prev.map(c => c.inventoryId === inventoryId ? { ...c, ...patch } : c));
  };

  const removeCartItem = (inventoryId: number) => {
    setCart(prev => prev.filter(c => c.inventoryId !== inventoryId));
  };

  // ── Totals ────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((sum, c) => sum + c.quantity * c.unitPrice, 0);
  const feeAmount = paymentMethod === 'Tarjeta' ? subtotal * (feeRate / 100) : 0;
  const total = subtotal + feeAmount;
  const canCreate = cart.length > 0 && cart.every(c => c.quantity > 0 && c.unitPrice >= 0);

  // ── Fee settings ──────────────────────────────────────────────────────
  const openFeeEdit = () => {
    setFeeInput(feeRate.toString());
    setEditingFee(true);
  };

  const saveFee = () => {
    const v = parseFloat(feeInput);
    const safe = isNaN(v) ? 4 : Math.min(100, Math.max(0, v));
    setFeeRate(safe);
    localStorage.setItem(FEE_KEY, safe.toString());
    setEditingFee(false);
  };

  // ── Modal helpers ─────────────────────────────────────────────────────
  const openModal = () => {
    setSearch('');
    setCart([]);
    setNotes('');
    setPaymentMethod('Efectivo');
    setFeeRate(loadFeeRate());
    setEditingFee(false);
    setModal(true);
  };

  const closeModal = () => setModal(false);

  const handleCreate = () => {
    if (!canCreate) return;
    createMut.mutate({
      notes: notes.trim() || undefined,
      items: cart.map(c => ({ inventoryId: c.inventoryId, quantity: c.quantity, unitPrice: c.unitPrice })),
      paymentMethod,
    });
  };

  // ══════════════════════════════════════════════════════════════════════
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
            <Plus size={16} /> Nueva orden
          </button>
        ) : undefined}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Sin órdenes"
            description="Crea órdenes para gestionar tus ventas"
          />
        ) : (
          <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800/60">
                  {['#', 'Estado', 'Pago', 'Notas', 'Total', 'Items', 'Fecha', ''].map((h, i) => (
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
                    {/* Payment */}
                    <td className="px-5 py-3.5">
                      {order.paymentMethod ? (
                        <Badge color={paymentColor(order.paymentMethod)}>
                          {order.paymentMethod}
                        </Badge>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
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
                              title="Confirmar orden"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-500/10 transition-colors"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {(order.status === 'Draft' || order.status === 'Confirmed') && (
                            <button
                              onClick={() => setConfirmAction({ type: 'cancel', order })}
                              title="Cancelar orden"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          {order.status === 'Draft' && (
                            <button
                              onClick={() => setConfirmAction({ type: 'delete', order })}
                              title="Eliminar orden"
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

      {/* ══ New Order Modal ══════════════════════════════════════════════════ */}
      {isAdmin && modal && (
        <Modal title="Nueva orden" onClose={closeModal} size="xl">
          <div className="flex gap-5 h-[68vh] min-h-0">

            {/* ── Left panel: Article picker ─────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100 dark:border-gray-800/40 pr-5">

              {/* Search */}
              <div className="relative mb-3 flex-shrink-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar producto, variante o categoría…"
                  className="w-full bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              {/* Count */}
              {!articlesLoading && articles.length > 0 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-2 flex-shrink-0">
                  {filteredArticles.length} de {articles.length} artículos
                </p>
              )}

              {/* Article grid */}
              <div className="overflow-y-auto flex-1 -mr-1 pr-1">
                {articlesLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <LoadingSpinner />
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Package size={32} className="mb-2 opacity-40" />
                    <p className="text-sm">
                      {articles.length === 0 ? 'No hay artículos disponibles' : 'Sin resultados'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {filteredArticles.map(article => {
                      const img = imageUrl(imageMap[article.productId]);
                      const inCart = cart.some(c => c.inventoryId === article.inventoryId);
                      const cartItem = cart.find(c => c.inventoryId === article.inventoryId);
                      return (
                        <button
                          key={article.inventoryId}
                          type="button"
                          onClick={() => addToCart(article)}
                          disabled={article.currentStock === 0}
                          className={`relative text-left p-2.5 rounded-xl border transition-all ${
                            article.currentStock === 0
                              ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700/60'
                              : inCart
                                ? 'border-indigo-500/60 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500/30'
                                : 'border-gray-200 dark:border-gray-700/60 hover:border-indigo-400/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 cursor-pointer'
                          }`}
                        >
                          {/* Cart qty badge */}
                          {inCart && cartItem && (
                            <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold z-10">
                              {cartItem.quantity}
                            </span>
                          )}

                          {/* Image */}
                          <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2 flex items-center justify-center">
                            {img ? (
                              <img
                                src={img}
                                alt={article.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={22} className="text-gray-300 dark:text-gray-600" />
                            )}
                          </div>

                          {/* Name */}
                          <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-0.5">
                            {article.productName}
                            {article.variantName && (
                              <span className="font-normal text-gray-500 dark:text-gray-400"> · {article.variantName}</span>
                            )}
                          </p>

                          {/* Category */}
                          {article.categoryName && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-1.5 truncate">
                              {article.categoryName}
                            </p>
                          )}

                          {/* Price + Stock */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                              {mxnFormatter.format(article.suggestedRetailPrice)}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium tabular-nums ${
                              article.currentStock === 0
                                ? 'bg-red-500/10 text-red-500'
                                : article.currentStock <= 5
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-green-500/10 text-green-600 dark:text-green-400'
                            }`}>
                              {article.currentStock}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right panel: Cart + Payment + Totals ───────────────────── */}
            <div className="w-72 flex-shrink-0 flex flex-col min-h-0">

              {/* Cart header */}
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Carrito{' '}
                  {cart.length > 0 && (
                    <span className="text-indigo-500">({cart.length})</span>
                  )}
                </h3>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Cart items list */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                    <ShoppingCart size={28} className="mb-2 opacity-30" />
                    <p className="text-xs text-center">
                      Selecciona productos<br />del catálogo
                    </p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.inventoryId}
                      className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60 rounded-xl p-2.5"
                    >
                      {/* Name + remove */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-medium text-gray-900 dark:text-white leading-tight flex-1 line-clamp-2">
                          {item.productName}
                          {item.variantName && (
                            <span className="font-normal text-gray-400"> · {item.variantName}</span>
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.inventoryId)}
                          className="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {/* Qty + Price + Subtotal */}
                      <div className="flex gap-1.5 items-end">
                        <div className="w-14 flex-shrink-0">
                          <label className="block text-[10px] text-gray-400 mb-0.5">Cant.</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateCartItem(item.inventoryId, { quantity: Math.max(1, Number(e.target.value)) })}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-lg px-1.5 py-1 text-xs text-center text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-[10px] text-gray-400 mb-0.5">Precio</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={e => updateCartItem(item.inventoryId, { unitPrice: Math.max(0, Number(e.target.value)) })}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-lg px-1.5 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        </div>
                        <div className="flex-shrink-0 pb-1">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
                            {mxnFormatter.format(item.quantity * item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Notes */}
              <div className="mb-3 flex-shrink-0">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notas (opcional)"
                  rows={2}
                  className="w-full bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                />
              </div>

              {/* Payment method */}
              <div className="mb-3 flex-shrink-0">
                <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Método de pago
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Efectivo')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      paymentMethod === 'Efectivo'
                        ? 'bg-green-500 text-white shadow-sm shadow-green-500/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400'
                    }`}
                  >
                    <Banknote size={13} /> Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Tarjeta')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      paymentMethod === 'Tarjeta'
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <CreditCard size={13} /> Tarjeta
                  </button>
                </div>
              </div>

              {/* Totals box */}
              <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-700/60 rounded-xl p-3 mb-3 space-y-1.5 flex-shrink-0">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{mxnFormatter.format(subtotal)}</span>
                </div>

                {paymentMethod === 'Tarjeta' && (
                  <div className="flex justify-between text-xs text-indigo-600 dark:text-indigo-400">
                    <div className="flex items-center gap-1">
                      <span>Comisión</span>
                      {editingFee ? (
                        <div className="flex items-center gap-0.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={feeInput}
                            onChange={e => setFeeInput(e.target.value)}
                            onBlur={saveFee}
                            onKeyDown={e => { if (e.key === 'Enter') saveFee(); if (e.key === 'Escape') setEditingFee(false); }}
                            autoFocus
                            className="w-12 bg-white dark:bg-gray-800 border border-indigo-400/60 rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                          <span className="text-[10px]">%</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={openFeeEdit}
                          title="Editar comisión"
                          className="flex items-center gap-0.5 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                        >
                          <span>{feeRate}%</span>
                          <Settings2 size={10} />
                        </button>
                      )}
                    </div>
                    <span className="tabular-nums">+{mxnFormatter.format(feeAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-1.5 border-t border-gray-200 dark:border-gray-700/60">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                    {mxnFormatter.format(total)}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleCreate}
                disabled={!canCreate || createMut.isPending}
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-xl text-white font-medium transition-colors text-sm disabled:cursor-not-allowed flex-shrink-0"
              >
                {createMut.isPending
                  ? 'Creando…'
                  : canCreate
                    ? `Crear orden · ${mxnFormatter.format(total)}`
                    : 'Selecciona al menos un producto'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm Cancel / Delete ──────────────────────────────────────── */}
      {isAdmin && confirmAction?.type === 'cancel' && (
        <ConfirmDialog
          message={`¿Cancelar la orden #${confirmAction.order.orderId}? Esta acción no se puede deshacer.`}
          onConfirm={() => cancelMut.mutate(confirmAction.order.orderId)}
          onClose={() => setConfirmAction(null)}
          loading={cancelMut.isPending}
        />
      )}
      {isAdmin && confirmAction?.type === 'delete' && (
        <ConfirmDialog
          message={`¿Eliminar la orden #${confirmAction.order.orderId}? Esta acción no se puede deshacer.`}
          onConfirm={() => deleteMut.mutate(confirmAction.order.orderId)}
          onClose={() => setConfirmAction(null)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
}
