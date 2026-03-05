import client from './client';
import type { CursorPagedResult, Order, CreateOrderDto } from '../types';

export const ordersApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Order>>('/api/orders', { params: { cursor, pageSize } }).then(r => r.data),
  getById: (id: number) =>
    client.get<Order>(`/api/orders/${id}`).then(r => r.data),
  create: (dto: CreateOrderDto) =>
    client.post<Order>('/api/orders', dto).then(r => r.data),
  confirm: (id: number) =>
    client.post<Order>(`/api/orders/${id}/confirm`).then(r => r.data),
  cancel: (id: number) =>
    client.post<Order>(`/api/orders/${id}/cancel`).then(r => r.data),
  delete: (id: number) =>
    client.delete(`/api/orders/${id}`),
};
