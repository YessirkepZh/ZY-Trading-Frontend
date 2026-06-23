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
  reasoningRu?: string;
  warnings: string[];
  warningsRu?: string[];
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

export interface AnalysisMetrics {
  totalDeals:    number;
  closedDeals:   number;
  winRate:       number;
  winRateChange?: number;
  bestStrategy:  string;
  worstStrategy: string;
  topMistake:    string;
  winRateByPassRoad: Record<string, { count: number; winRate: number }>;
  winRateByStrategy: Record<string, { total: number; wins: number; winRate: number }>;
  winRateByAtrPercent: Record<string, { count: number; winRate: number }>;
  winRateByDayOfWeek: Record<string, { count: number; winRate: number }>;
  checklistCorrelation: Array<{
    key: string; label: string; type: string;
    count: number; winRate: number;
  }>;
  streakAnalysis: {
    afterLoss2plus: { count: number; winRate: number };
    afterWin3plus:  { count: number; winRate: number };
  };
  ratioAnalysis: { plannedAvg: number; realAvg: number };
  timeToEntryAnalysis: {
    fast:   { label: string; count: number; winRate: number };
    medium: { label: string; count: number; winRate: number };
    slow:   { label: string; count: number; winRate: number };
  };
}

export interface AnalysisReport {
  id:          number;
  periodFrom:  string;
  periodTo:    string;
  dealsCount:  number;
  metrics:     AnalysisMetrics;
  summary:     string;
  contentHtml: string;
  createdAt:   string;
}

export type ChecklistItemType = 'plus' | 'minus' | 'wait';

export interface ChecklistGroup {
  id: number;
  name: string;
  position: number;
}

export interface ChecklistItem {
  id: number;
  groupId: number;
  strategy: string;
  itemType: ChecklistItemType;
  key: string;
  label: string;
  position: number;
}

export interface ChecklistItemCreate {
  groupId: number;
  itemType: ChecklistItemType;
  key: string;
  label: string;
  position?: number;
}

export interface ChecklistItemUpdate {
  label?: string;
  position?: number;
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
