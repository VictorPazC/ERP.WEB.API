import client from '../../shared/api/client';
import type { User, CreateUserDto, UpdateUserDto } from '../../shared/types';
import type { CursorPagedResult } from '../../shared/types';

export const usersApi = {
  getAll: (cursor?: string, pageSize = 20) =>
    client.get<CursorPagedResult<User>>('/api/users', { params: { cursor, pageSize } }),
  getById: (id: number) => client.get<User>(`/api/users/${id}`),
  create: (dto: CreateUserDto) => client.post<User>('/api/users', dto),
  update: (id: number, dto: UpdateUserDto) => client.put<User>(`/api/users/${id}`, dto),
  delete: (id: number) => client.delete(`/api/users/${id}`),
};
