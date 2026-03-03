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

// Auto-redirect to login on 401 (expired/invalid token)
client.interceptors.response.use(
  res => res,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp-token');
      localStorage.removeItem('erp-company-id');
      localStorage.removeItem('erp-active-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
