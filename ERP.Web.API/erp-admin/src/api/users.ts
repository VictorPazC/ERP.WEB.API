import client from './client';
import type { User, CreateUserDto, UpdateUserDto, LoginDto, LoginResultDto } from '../types';
import type { CursorPagedResult } from '../types';

export const usersApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<User>>('/api/users', { params: { cursor, pageSize } }),
  getById: (id: number) => client.get<User>(`/api/users/${id}`),
  create: (dto: CreateUserDto) => client.post<User>('/api/users', dto),
  update: (id: number, dto: UpdateUserDto) => client.put<User>(`/api/users/${id}`, dto),
  delete: (id: number) => client.delete(`/api/users/${id}`),
  login: (dto: LoginDto) => client.post<LoginResultDto>('/api/users/login', dto),
  refresh: (token: string) =>
    client.post<{ token: string; userId: number; name: string; email: string; role: string; companyId: number; companyName: string; isSuperAdmin: boolean; companies?: { companyId: number; name: string; slug: string; logoUrl?: string }[]; refreshToken: string; refreshTokenExpiry: string }>('/api/users/refresh', { token }),
  revoke: (token: string) =>
    client.post('/api/users/revoke', { token }),
};
