export type DealStatus = 'created' | 'notified' | 'entered' | 'closed' | 'missed';
export type MarketType = 'crypto' | 'stocks' | 'forex';
export type Direction = 'long' | 'short';
export type Strategy = 'Пробой' | 'Ложный Пробой' | 'Отбой';
export type DealResult = 'win' | 'loss' | 'breakeven';

export interface CalculationResult {
  atr: number;
  rangeReserve: number | null;
  passRoad: number | null;
  entryPrice: number;
  stopLossDefault: number;
  takeProfitDefault: number;
  quantity: number;
  sum: number;
  entryPriceByStop?: number;
  stopLossByStop?: number;
  takeProfitByStop?: number;
  takeProfitByStop2?: number;
  takeProfitByStop3?: number;
  quantityByStop?: number;
  sumByStop?: number;
}

export interface ClaudeCheckResult {
  recommendation: 'take' | 'skip' | 'wait';
  confidence: number;
  reasoning: string;
  warnings: string[];
  checkedAt: string;
}

export interface ClaudeStatsResult {
  summary: string;
  mistakes: string[];
  improvements: string[];
  analyzedAt: string;
}

export interface ChecklistSnapshot {
  plus: string[];
  minus: string[];
  wait: string[];
}

export interface Deal {
  id: number;
  ticker: string;
  marketType: MarketType;
  strategy: Strategy;
  direction: Direction;
  entryRaw: number;
  status: DealStatus;
  calcResult: CalculationResult;
  claudeCheckResult?: ClaudeCheckResult;
  checklistSnapshot?: ChecklistSnapshot;
  hasDeal: boolean;
  dealResult?: DealResult;
  closePrice?: number;
  closedAt?: string;
  claudeStatsResult?: ClaudeStatsResult;
  screenshotSetup?: string;
  screenshotEntry?: string;
  screenshotClose?: string;
  passRoad?: number;
  atr?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalDeals: number;
  winRate: number;
  avgPassRoad: number;
  byStrategy: Record<Strategy, {
    total: number;
    wins: number;
    winRate: number;
  }>;
  recentDeals: Deal[];
}
