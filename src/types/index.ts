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
  summaryRu?: string;
  mistakesRu?: string[];
  improvementsRu?: string[];
  analyzedAt: string;
}

export interface DealComment {
  id: number;
  dealId: number;
  text: string;
  createdAt: string;
}

export interface MarketStats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface StrategyStats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  avgRatio: number;
  avgR: number;
  edgePlanned: number;
  edgeReal: number;
}

export interface WeeklyPerformance {
  period: string;
  weekStart: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number | null;
  avgR: number | null;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface DailyProfit {
  date: string;
  profitR: number;
  profitUsd: number;
}

export interface DailyDrawdown {
  date: string;
  drawdownR: number;
  drawdownUsd: number;
}

export interface ChecklistTopItem {
  key: string;
  label: string;
  type: ChecklistItemType;
  strategy: string;
  inWins: number;
  inLosses: number;
  total: number;
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
  /** Real fill; absent = filled at the planned entry */
  actualEntryPrice?: number;
  /** Signed % vs planned entry, positive = worse for the trader */
  slippagePercent?: number;
  closedAt?: string;
  enteredAt?: string;
  claudeStatsResult?: ClaudeStatsResult;
  screenshotSetup?: string;
  screenshotEntry?: string;
  screenshotClose?: string;
  /** Close-up of the entry timeframe pane */
  screenshotFocus?: string;
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
  /** Longer explanation for Claude; omitted when empty */
  description?: string;
  position: number;
}

export interface ChecklistItemCreate {
  groupId: number;
  itemType: ChecklistItemType;
  key: string;
  label: string;
  description?: string;
  position?: number;
}

export interface ChecklistItemUpdate {
  label?: string;
  /** null or "" clears a previously saved description */
  description?: string | null;
  position?: number;
}

export type ClaudeRecommendation = 'take' | 'skip' | 'wait';

export interface ClaudeEvalByRec {
  recommendation: ClaudeRecommendation;
  count: number;
  wins: number;
  losses: number;
  winRate: number;
  avgConfidence: number;
}

export interface ClaudeConfidenceBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  wins: number;
  winRate: number;
  avgConfidence: number;
}

export interface CalibrationPoint {
  label: string;
  claimedConfidence: number;
  actualWinRate: number;
  count: number;
  delta: number;
}

export interface ClaudeEvaluation {
  evaluatedDeals: number;
  accuracyPercent: number | null;
  byRecommendation: ClaudeEvalByRec[];
  confidenceBuckets: ClaudeConfidenceBucket[];
  calibrationCurve?: CalibrationPoint[];
  expectedCalibrationError?: number | null;
}

export interface AiUsageSummary {
  days: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  estimatedCostUsd: number;
  byPurpose: Array<{
    purpose: string;
    calls: number;
    estimatedCostUsd: number;
  }>;
}

export interface DashboardStats {
  totalDeals: number;
  winRate: number;
  avgPassRoad: number;
  expectancyR?: number;
  expectancyUsd?: number;
  maxDrawdownR?: number;
  maxDrawdownUsd?: number;
  avgDealsPerDay?: number;
  byStrategy: Record<Strategy, StrategyStats>;
  byMarket?: Record<MarketType, MarketStats>;
  weeklyPerformance?: WeeklyPerformance[];
  dealsPerDay?: DailyCount[];
  profitSumDaily?: DailyProfit[];
  dailyDrawdown?: DailyDrawdown[];
  topChecklistInWins?: ChecklistTopItem[];
  topChecklistInLoss?: ChecklistTopItem[];
  claudeEvaluation?: ClaudeEvaluation | null;
  recentDeals: Deal[];
}

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  telegramId: number | null;
}

export interface ApiToken {
  id: number;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  deviceBound: boolean;
}

export interface Invite {
  id: number;
  email: string | null;
  role: UserRole;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}
