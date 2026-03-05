import client from '../../shared/api/client';
import type { Company, CreateCompanyDto, UpdateCompanyDto } from '../../shared/types';
import type { CursorPagedResult } from '../../shared/types';

export const companiesApi = {
  getAll:  (cursor?: string, pageSize = 20)        => client.get<CursorPagedResult<Company>>('/api/companies', { params: { cursor, pageSize } }),
  getById: (id: number)                            => client.get<Company>(`/api/companies/${id}`),
  create:  (dto: CreateCompanyDto)                 => client.post<Company>('/api/companies', dto),
  update:  (id: number, dto: UpdateCompanyDto)     => client.put(`/api/companies/${id}`, dto),
  delete:  (id: number)                            => client.delete(`/api/companies/${id}`),
};
