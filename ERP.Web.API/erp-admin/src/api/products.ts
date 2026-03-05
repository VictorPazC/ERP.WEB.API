import client from './client';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';
import type { CursorPagedResult } from '../types';

export const productsApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Product>>('/api/products', { params: { cursor, pageSize } }),
  getById: (id: number) => client.get<Product>(`/api/products/${id}`),
  create: (dto: CreateProductDto) => client.post<Product>('/api/products', dto),
  update: (id: number, dto: UpdateProductDto) => client.put<Product>(`/api/products/${id}`, dto),
  delete: (id: number) => client.delete(`/api/products/${id}`),
  toggleFavorite: (id: number) => client.put<boolean>(`/api/products/${id}/toggle-favorite`),
  setStockStatus: (id: number, status: string | null) => client.put(`/api/products/${id}/stock-status`, { status }),
};
