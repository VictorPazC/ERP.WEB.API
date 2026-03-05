import client from './client';
import type { User, CreateUserDto, UpdateUserDto, LoginDto, LoginResultDto } from '../types';
import type { CursorPagedResult } from '../types';

export const usersApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<User>>('/api/users', { params: { cursor, pageSize } }).then(r => r.data),
  getById: (id: number) => client.get<User>(`/api/users/${id}`).then(r => r.data),
  create: (dto: CreateUserDto) => client.post<User>('/api/users', dto).then(r => r.data),
  update: (id: number, dto: UpdateUserDto) => client.put<User>(`/api/users/${id}`, dto).then(r => r.data),
  delete: (id: number) => client.delete(`/api/users/${id}`),
  login: (dto: LoginDto) => client.post<LoginResultDto>('/api/users/login', dto).then(r => r.data),
  refresh: (token: string) =>
    client.post<{ token: string; userId: number; name: string; email: string; role: string; companyId: number; companyName: string; isSuperAdmin: boolean; companies?: { companyId: number; name: string; slug: string; logoUrl?: string }[]; refreshToken: string; refreshTokenExpiry: string }>('/api/users/refresh', { token }).then(r => r.data),
  revoke: (token: string) =>
    client.post('/api/users/revoke', { token }),
};
