import client from './client';
import type { Company, CreateCompanyDto, UpdateCompanyDto } from '../types';
import type { CursorPagedResult } from '../types';

export const companiesApi = {
  getAll:  (cursor?: string, pageSize = 20)        => client.get<CursorPagedResult<Company>>('/api/companies', { params: { cursor, pageSize } }).then(r => r.data),
  getById: (id: number)                            => client.get<Company>(`/api/companies/${id}`).then(r => r.data),
  create:  (dto: CreateCompanyDto)                 => client.post<Company>('/api/companies', dto).then(r => r.data),
  update:  (id: number, dto: UpdateCompanyDto)     => client.put(`/api/companies/${id}`, dto),
  delete:  (id: number)                            => client.delete(`/api/companies/${id}`),
};
