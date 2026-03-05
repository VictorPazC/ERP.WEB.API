import client from './client';
import type { AvailableArticle, Consumption, CreateConsumptionDto } from '../types';
import type { CursorPagedResult } from '../types';

export const consumptionsApi = {
  getAvailable: () => client.get<AvailableArticle[]>('/api/consumptions/available'),
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<Consumption>>('/api/consumptions', { params: { cursor, pageSize } }),
  create: (dto: CreateConsumptionDto) => client.post<Consumption>('/api/consumptions', dto),
  delete: (id: number) => client.delete(`/api/consumptions/${id}`),
};
