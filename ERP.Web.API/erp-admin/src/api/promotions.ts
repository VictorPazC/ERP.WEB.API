import client from './client';
import type { Promotion, CreatePromotionDto, UpdatePromotionDto } from '../types';
import type { CursorPagedResult } from '../types';

export const promotionsApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Promotion>>('/api/promotions', { params: { cursor, pageSize } }),
  getActive: () => client.get<Promotion[]>('/api/promotions/active'),
  getById: (id: number) => client.get<Promotion>(`/api/promotions/${id}`),
  getByProductId: (productId: number) => client.get<Promotion[]>(`/api/promotions/product/${productId}`),
  create: (dto: CreatePromotionDto) => client.post<Promotion>('/api/promotions', dto),
  update: (id: number, dto: UpdatePromotionDto) => client.put<Promotion>(`/api/promotions/${id}`, dto),
  delete: (id: number) => client.delete(`/api/promotions/${id}`),
};
