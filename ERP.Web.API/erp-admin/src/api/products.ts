import client from './client';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';

export const productsApi = {
  getAll: () => client.get<Product[]>('/api/products').then(r => r.data),
  getById: (id: number) => client.get<Product>(`/api/products/${id}`).then(r => r.data),
  create: (dto: CreateProductDto) => client.post<Product>('/api/products', dto).then(r => r.data),
  update: (id: number, dto: UpdateProductDto) => client.put<Product>(`/api/products/${id}`, dto).then(r => r.data),
  delete: (id: number) => client.delete(`/api/products/${id}`),
};
