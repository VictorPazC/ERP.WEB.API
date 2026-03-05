import client from '../../shared/api/client';
import type { LoginDto, LoginResultDto } from '../../shared/types';

export const authApi = {
  login: (dto: LoginDto) => client.post<LoginResultDto>('/api/users/login', dto),
  refresh: (token: string) =>
    client.post<{ token: string; userId: number; name: string; email: string; role: string; companyId: number; companyName: string; isSuperAdmin: boolean; companies?: { companyId: number; name: string; slug: string; logoUrl?: string }[]; refreshToken: string; refreshTokenExpiry: string }>('/api/users/refresh', { token }),
  revoke: (token: string) =>
    client.post('/api/users/revoke', { token }),
};
