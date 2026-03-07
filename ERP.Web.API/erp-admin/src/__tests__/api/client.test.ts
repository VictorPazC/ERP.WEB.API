import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import client from '../../api/client';

// Helper to create a mock Response
function mockResponse(status: number, body?: unknown, headers: Record<string, string> = {}): Response {
  const bodyStr = body !== undefined ? JSON.stringify(body) : '';
  return new Response(bodyStr, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('client request headers', () => {
  it('includes Authorization Bearer header when token in localStorage', async () => {
    localStorage.setItem('erp-token', 'my-jwt');
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await client.get('/api/test');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer my-jwt' });
  });

  it('includes X-Company-Id header when companyId in localStorage', async () => {
    localStorage.setItem('erp-company-id', '42');
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await client.get('/api/test');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ 'X-Company-Id': '42' });
  });
});

describe('client 401 refresh flow', () => {
  it('on 401 with valid refresh token: calls /api/users/refresh and retries', async () => {
    localStorage.setItem('erp-refresh-token', 'old-refresh');

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(401))                              // first request → 401
      .mockResolvedValueOnce(mockResponse(200, { token: 'new-jwt', refreshToken: 'new-refresh' })) // refresh call
      .mockResolvedValueOnce(mockResponse(200, { data: 'ok' }));             // retry

    const result = await client.get('/api/brands');
    expect(result).toEqual({ data: 'ok' });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
  });

  it('on successful refresh: updates erp-token and erp-refresh-token in localStorage', async () => {
    localStorage.setItem('erp-refresh-token', 'old-refresh');

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(401))
      .mockResolvedValueOnce(mockResponse(200, { token: 'new-jwt', refreshToken: 'new-refresh' }))
      .mockResolvedValueOnce(mockResponse(200, {}));

    await client.get('/api/brands');

    expect(localStorage.getItem('erp-token')).toBe('new-jwt');
    expect(localStorage.getItem('erp-refresh-token')).toBe('new-refresh');
  });

  it('on 401 with failed refresh: clears auth and redirects to /login', async () => {
    localStorage.setItem('erp-refresh-token', 'bad-refresh');
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(401))
      .mockResolvedValueOnce(mockResponse(401));  // refresh fails

    await expect(client.get('/api/brands')).rejects.toThrow('Unauthorized');
    expect(window.location.href).toBe('/login');
    expect(localStorage.getItem('erp-token')).toBeNull();
  });

  it('on 401 without refresh token: calls clearAuthAndRedirect immediately', async () => {
    // No refresh token in localStorage
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    });

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(401));

    await expect(client.get('/api/brands')).rejects.toThrow('Unauthorized');
    expect(window.location.href).toBe('/login');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1); // no refresh attempt
  });
});

describe('client response handling', () => {
  it('returns parsed JSON on 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(200, { id: 1, name: 'Test' }));

    const result = await client.get<{ id: number; name: string }>('/api/brands/1');

    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('returns undefined on 204 No Content', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await client.delete('/api/brands/1');

    expect(result).toBeUndefined();
  });

  it('throws on non-ok non-401 status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(500, 'Internal Server Error'));

    await expect(client.get('/api/brands')).rejects.toThrow();
  });
});
