import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE ?? 'http://localhost:5147';

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token and Company ID to every request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('erp-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const companyId = localStorage.getItem('erp-company-id');
  if (companyId) config.headers['X-Company-Id'] = companyId;
  return config;
});

// Auto-refresh JWT on 401, then retry. If refresh fails → redirect to login.
client.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('erp-refresh-token');
      if (refreshToken) {
        try {
          const { data } = await axios.post<{ token: string; refreshToken: string }>(
            `${baseURL}/api/users/refresh`,
            { token: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
          localStorage.setItem('erp-token', data.token);
          localStorage.setItem('erp-refresh-token', data.refreshToken);
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${data.token}`;
          return client(original);
        } catch {
          // refresh failed → fall through to logout
        }
      }
      localStorage.removeItem('erp-token');
      localStorage.removeItem('erp-refresh-token');
      localStorage.removeItem('erp-company-id');
      localStorage.removeItem('erp-active-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
