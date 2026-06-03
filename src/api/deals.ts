import { apiClient } from './client';
import type { Deal, DashboardStats, AnalysisReport } from '../types';

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

export async function createAnalysis(params: {
  periodFrom: string;
  periodTo:   string;
}): Promise<{ id: number; summary: string }> {
  const { data } = await apiClient.post('/api/analysis', params);
  return data;
}

export async function fetchAnalysisReports(): Promise<AnalysisReport[]> {
  const { data } = await apiClient.get('/api/analysis');
  return data;
}

export async function fetchAnalysisReportById(id: number): Promise<AnalysisReport> {
  const { data } = await apiClient.get(`/api/analysis/${id}`);
  return data;
}

export async function fetchLatestAnalysis(): Promise<AnalysisReport | null> {
  try {
    const { data } = await apiClient.get('/api/analysis/latest');
    return data;
  } catch {
    return null;
  }
}
