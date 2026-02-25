import client from './client';
import type { User, CreateUserDto, UpdateUserDto } from '../types';

export const usersApi = {
  getAll: () => client.get<User[]>('/api/users').then(r => r.data),
  getById: (id: number) => client.get<User>(`/api/users/${id}`).then(r => r.data),
  create: (dto: CreateUserDto) => client.post<User>('/api/users', dto).then(r => r.data),
  update: (id: number, dto: UpdateUserDto) => client.put<User>(`/api/users/${id}`, dto).then(r => r.data),
  delete: (id: number) => client.delete(`/api/users/${id}`),
};
