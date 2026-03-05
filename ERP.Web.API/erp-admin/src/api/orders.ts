import client from './client';
import type { CursorPagedResult, Order, CreateOrderDto } from '../types';

export const ordersApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Order>>('/api/orders', { params: { cursor, pageSize } }),
  getById: (id: number) =>
    client.get<Order>(`/api/orders/${id}`),
  create: (dto: CreateOrderDto) =>
    client.post<Order>('/api/orders', dto),
  confirm: (id: number) =>
    client.post<Order>(`/api/orders/${id}/confirm`),
  cancel: (id: number) =>
    client.post<Order>(`/api/orders/${id}/cancel`),
  delete: (id: number) =>
    client.delete(`/api/orders/${id}`),
};
