import client from './client';
import type { AvailableArticle, Consumption, CreateConsumptionDto } from '../types';

export const consumptionsApi = {
  getAvailable: () => client.get<AvailableArticle[]>('/api/consumptions/available').then(r => r.data),
  getAll: () => client.get<Consumption[]>('/api/consumptions').then(r => r.data),
  create: (dto: CreateConsumptionDto) => client.post<Consumption>('/api/consumptions', dto).then(r => r.data),
  delete: (id: number) => client.delete(`/api/consumptions/${id}`),
};
