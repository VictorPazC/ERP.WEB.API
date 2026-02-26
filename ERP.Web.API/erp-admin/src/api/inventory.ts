import client from './client';
import type { Inventory, CreateInventoryDto, UpdateInventoryDto, RestockInventoryDto } from '../types';

export const inventoryApi = {
  getAll: () => client.get<Inventory[]>('/api/inventory').then(r => r.data),
  getById: (id: number) => client.get<Inventory>(`/api/inventory/${id}`).then(r => r.data),
  getByProductId: (productId: number) => client.get<Inventory>(`/api/inventory/product/${productId}`).then(r => r.data),
  create: (dto: CreateInventoryDto) => client.post<Inventory>('/api/inventory', dto).then(r => r.data),
  update: (id: number, dto: UpdateInventoryDto) => client.put<Inventory>(`/api/inventory/${id}`, dto).then(r => r.data),
  restock: (id: number, dto: RestockInventoryDto) => client.patch<Inventory>(`/api/inventory/${id}/restock`, dto).then(r => r.data),
  delete: (id: number) => client.delete(`/api/inventory/${id}`),
};
