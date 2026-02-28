import client from './client';
import type { Brand, CreateBrandDto, UpdateBrandDto } from '../types';

export const brandsApi = {
  getAll: () => client.get<Brand[]>('/api/brands').then(r => r.data),
  getById: (id: number) => client.get<Brand>(`/api/brands/${id}`).then(r => r.data),
  create: (dto: CreateBrandDto) => client.post<Brand>('/api/brands', dto).then(r => r.data),
  update: (id: number, dto: UpdateBrandDto) => client.put<Brand>(`/api/brands/${id}`, dto).then(r => r.data),
  delete: (id: number) => client.delete(`/api/brands/${id}`),
};
