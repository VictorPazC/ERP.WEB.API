import client from './client';
import type { Tag, CreateTagDto, UpdateTagDto } from '../types';
import type { CursorPagedResult } from '../types';

export const tagsApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Tag>>('/api/tags', { params: { cursor, pageSize } }),
  getById: (id: number) => client.get<Tag>(`/api/tags/${id}`),
  getByProductId: (productId: number) => client.get<Tag[]>(`/api/tags/product/${productId}`),
  create: (dto: CreateTagDto) => client.post<Tag>('/api/tags', dto),
  update: (id: number, dto: UpdateTagDto) => client.put<Tag>(`/api/tags/${id}`, dto),
  delete: (id: number) => client.delete(`/api/tags/${id}`),
  addToProduct: (tagId: number, productId: number) => client.post(`/api/tags/${tagId}/products/${productId}`),
  removeFromProduct: (tagId: number, productId: number) => client.delete(`/api/tags/${tagId}/products/${productId}`),
};
