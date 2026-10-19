import { apiClient } from './client';
import type { RiskPreset, TradingStrategy } from '../types';

export async function fetchRiskPresets(): Promise<RiskPreset[]> {
  const { data } = await apiClient.get<{ success: boolean; presets: RiskPreset[] }>(
    '/api/risk-presets',
  );
  return data.presets;
}

export async function createRiskPreset(input: {
  name: string;
  riskPercent: number;
  ratio: number;
  luftPercent: number;
  riskSum: number;
  isDefault?: boolean;
}): Promise<RiskPreset> {
  const { data } = await apiClient.post<{ success: boolean; preset: RiskPreset }>(
    '/api/risk-presets',
    input,
  );
  return data.preset;
}

export async function updateRiskPreset(
  id: number,
  input: Partial<{
    name: string;
    riskPercent: number;
    ratio: number;
    luftPercent: number;
    riskSum: number;
    isDefault: boolean;
  }>,
): Promise<RiskPreset> {
  const { data } = await apiClient.patch<{ success: boolean; preset: RiskPreset }>(
    `/api/risk-presets/${id}`,
    input,
  );
  return data.preset;
}

export async function archiveRiskPreset(id: number): Promise<void> {
  await apiClient.delete(`/api/risk-presets/${id}`);
}

export async function fetchStrategies(): Promise<TradingStrategy[]> {
  const { data } = await apiClient.get<{ success: boolean; strategies: TradingStrategy[] }>(
    '/api/strategies',
  );
  return data.strategies;
}

export async function createStrategy(input: {
  name: string;
  defaultRiskPresetId?: number | null;
}): Promise<TradingStrategy> {
  const { data } = await apiClient.post<{ success: boolean; strategy: TradingStrategy }>(
    '/api/strategies',
    input,
  );
  return data.strategy;
}

export async function updateStrategy(
  id: number,
  input: Partial<{
    name: string;
    defaultRiskPresetId: number | null;
    position: number;
  }>,
): Promise<TradingStrategy> {
  const { data } = await apiClient.patch<{ success: boolean; strategy: TradingStrategy }>(
    `/api/strategies/${id}`,
    input,
  );
  return data.strategy;
}

export async function archiveStrategy(id: number): Promise<void> {
  await apiClient.delete(`/api/strategies/${id}`);
}
