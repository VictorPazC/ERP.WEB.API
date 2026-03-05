import client from './client';
import type { Tag, CreateTagDto, UpdateTagDto } from '../types';
import type { CursorPagedResult } from '../types';

export const tagsApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Tag>>('/api/tags', { params: { cursor, pageSize } }).then(r => r.data),
  getById: (id: number) => client.get<Tag>(`/api/tags/${id}`).then(r => r.data),
  getByProductId: (productId: number) => client.get<Tag[]>(`/api/tags/product/${productId}`).then(r => r.data),
  create: (dto: CreateTagDto) => client.post<Tag>('/api/tags', dto).then(r => r.data),
  update: (id: number, dto: UpdateTagDto) => client.put<Tag>(`/api/tags/${id}`, dto).then(r => r.data),
  delete: (id: number) => client.delete(`/api/tags/${id}`),
  addToProduct: (tagId: number, productId: number) => client.post(`/api/tags/${tagId}/products/${productId}`),
  removeFromProduct: (tagId: number, productId: number) => client.delete(`/api/tags/${tagId}/products/${productId}`),
};
