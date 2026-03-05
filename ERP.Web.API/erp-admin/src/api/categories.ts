import client from './client';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types';
import type { CursorPagedResult } from '../types';

export const categoriesApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Category>>('/api/categories', { params: { cursor, pageSize } }),
  getById: (id: number) => client.get<Category>(`/api/categories/${id}`),
  getMain: () => client.get<Category[]>('/api/categories/main'),
  create: (dto: CreateCategoryDto) => client.post<Category>('/api/categories', dto),
  update: (id: number, dto: UpdateCategoryDto) => client.put<Category>(`/api/categories/${id}`, dto),
  delete: (id: number) => client.delete(`/api/categories/${id}`),
};
