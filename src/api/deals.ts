import { apiClient } from './client';
import type { Deal, DashboardStats } from '../types';

export async function fetchDashboard(): Promise<DashboardStats> {
  const { data } = await apiClient.get<{ success: boolean; stats: DashboardStats }>('/api/dashboard');
  return data.stats;
}

export async function fetchDeals(params?: {
  status?: string;
  strategy?: string;
  marketType?: string;
  limit?: number;
  offset?: number;
}): Promise<Deal[]> {
  const { data } = await apiClient.get<{ success: boolean; deals: Deal[] }>('/api/deals', { params });
  return data.deals;
}

export async function fetchDealById(id: number): Promise<Deal> {
  const { data } = await apiClient.get<{ success: boolean; deal: Deal }>(`/api/deals/${id}`);
  return data.deal;
}
