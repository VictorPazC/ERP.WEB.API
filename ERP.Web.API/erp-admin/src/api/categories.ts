import client from './client';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types';
import type { CursorPagedResult } from '../types';

export const categoriesApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Category>>('/api/categories', { params: { cursor, pageSize } }).then(r => r.data),
  getById: (id: number) => client.get<Category>(`/api/categories/${id}`).then(r => r.data),
  getMain: () => client.get<Category[]>('/api/categories/main').then(r => r.data),
  create: (dto: CreateCategoryDto) => client.post<Category>('/api/categories', dto).then(r => r.data),
  update: (id: number, dto: UpdateCategoryDto) => client.put<Category>(`/api/categories/${id}`, dto).then(r => r.data),
  delete: (id: number) => client.delete(`/api/categories/${id}`),
};
