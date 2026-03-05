import client from './client';
import type { Brand, CreateBrandDto, UpdateBrandDto } from '../types';
import type { CursorPagedResult } from '../types';

export const brandsApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Brand>>('/api/brands', { params: { cursor, pageSize } }).then(r => r.data),
  getById: (id: number) => client.get<Brand>(`/api/brands/${id}`).then(r => r.data),
  create: (dto: CreateBrandDto) => client.post<Brand>('/api/brands', dto).then(r => r.data),
  update: (id: number, dto: UpdateBrandDto) => client.put<Brand>(`/api/brands/${id}`, dto).then(r => r.data),
  setDefault: (id: number) => client.put(`/api/brands/${id}/set-default`),
  delete: (id: number) => client.delete(`/api/brands/${id}`),
};
