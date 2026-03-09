import client from './client';
import type { WeeklyStat, TopProduct, ActivityLog, CriticalInventory } from '../types';

export const dashboardApi = {
  getWeeklyStats: (days = 7) =>
    client.get<WeeklyStat[]>('/api/dashboard/weekly-stats', { params: { days } }),

  getActivity: (limit = 10) =>
    client.get<ActivityLog[]>('/api/dashboard/activity', { params: { limit } }),

  getTopProducts: (limit = 5, metric = 'revenue') =>
    client.get<TopProduct[]>('/api/dashboard/top-products', { params: { limit, metric } }),

  getCriticalInventory: (threshold = 5) =>
    client.get<CriticalInventory[]>('/api/dashboard/critical-inventory', { params: { threshold } }),
};
