const baseURL = (import.meta.env.VITE_API_BASE ?? 'http://localhost:5147').replace(/\/$/, '');

function getHeaders(isFormData = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('erp-token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const companyId = localStorage.getItem('erp-company-id');
  if (companyId) headers['X-Company-Id'] = companyId;
  return headers;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
  const url = new URL(`${baseURL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function clearAuthAndRedirect() {
  localStorage.removeItem('erp-token');
  localStorage.removeItem('erp-refresh-token');
  localStorage.removeItem('erp-company-id');
  localStorage.removeItem('erp-active-user');
  window.location.href = '/login';
}

async function request<T>(
  method: string,
  path: string,
  options: {
    params?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    isFormData?: boolean;
  } = {},
  isRetry = false
): Promise<T> {
  const url = buildUrl(path, options.params);
  const headers = getHeaders(options.isFormData);

  const res = await fetch(url, {
    method,
    headers,
    body: options.body instanceof FormData
      ? options.body
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });

  if (res.status === 401 && !isRetry) {
    const refreshToken = localStorage.getItem('erp-refresh-token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${baseURL}/api/users/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json() as { token: string; refreshToken: string };
          localStorage.setItem('erp-token', data.token);
          localStorage.setItem('erp-refresh-token', data.refreshToken);
          return request<T>(method, path, options, true);
        }
      } catch { /* fall through */ }
    }
    clearAuthAndRedirect();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

const client = {
  get: <T>(path: string, options?: { params?: Record<string, string | number | boolean | undefined | null> }) =>
    request<T>('GET', path, options ?? {}),

  post: <T>(path: string, body?: unknown) =>
    body instanceof FormData
      ? request<T>('POST', path, { body, isFormData: true })
      : request<T>('POST', path, { body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>('PUT', path, { body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>('PATCH', path, { body }),

  delete: <T = void>(path: string) =>
    request<T>('DELETE', path),
};

export default client;
