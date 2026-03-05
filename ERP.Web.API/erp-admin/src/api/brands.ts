import client from './client';
import type { Brand, CreateBrandDto, UpdateBrandDto } from '../types';
import type { CursorPagedResult } from '../types';

export const brandsApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Brand>>('/api/brands', { params: { cursor, pageSize } }),
  getById: (id: number) => client.get<Brand>(`/api/brands/${id}`),
  create: (dto: CreateBrandDto) => client.post<Brand>('/api/brands', dto),
  update: (id: number, dto: UpdateBrandDto) => client.put<Brand>(`/api/brands/${id}`, dto),
  setDefault: (id: number) => client.put(`/api/brands/${id}/set-default`),
  delete: (id: number) => client.delete(`/api/brands/${id}`),
};
