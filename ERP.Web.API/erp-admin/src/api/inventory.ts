import client from './client';
import type { Inventory, CreateInventoryDto, UpdateInventoryDto, RestockInventoryDto } from '../types';
import type { CursorPagedResult } from '../types';

export const inventoryApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Inventory>>('/api/inventory', { params: { cursor, pageSize } }),
  getById: (id: number) => client.get<Inventory>(`/api/inventory/${id}`),
  getByProductId: (productId: number) => client.get<Inventory>(`/api/inventory/product/${productId}`),
  create: (dto: CreateInventoryDto) => client.post<Inventory>('/api/inventory', dto),
  update: (id: number, dto: UpdateInventoryDto) => client.put<Inventory>(`/api/inventory/${id}`, dto),
  restock: (id: number, dto: RestockInventoryDto) => client.patch<Inventory>(`/api/inventory/${id}/restock`, dto),
  delete: (id: number) => client.delete(`/api/inventory/${id}`),
};
