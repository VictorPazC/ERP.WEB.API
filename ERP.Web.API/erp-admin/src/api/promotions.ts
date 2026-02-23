import client from './client';
import type { Promotion, CreatePromotionDto, UpdatePromotionDto } from '../types';

export const promotionsApi = {
  getAll: () => client.get<Promotion[]>('/api/promotions').then(r => r.data),
  getActive: () => client.get<Promotion[]>('/api/promotions/active').then(r => r.data),
  getById: (id: number) => client.get<Promotion>(`/api/promotions/${id}`).then(r => r.data),
  getByProductId: (productId: number) => client.get<Promotion[]>(`/api/promotions/product/${productId}`).then(r => r.data),
  create: (dto: CreatePromotionDto) => client.post<Promotion>('/api/promotions', dto).then(r => r.data),
  update: (id: number, dto: UpdatePromotionDto) => client.put<Promotion>(`/api/promotions/${id}`, dto).then(r => r.data),
  delete: (id: number) => client.delete(`/api/promotions/${id}`),
};
