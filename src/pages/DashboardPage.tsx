import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  BarChart, Bar, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import StatCard from '../components/StatCard';
import DealCard from '../components/DealCard';
import WinRateChart from '../components/WinRateChart';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { formatPercent, formatR, formatUsd, formatShortDate } from '../utils/formatters';
import { STRATEGY_COLORS, MARKET_LABELS } from '../utils/constants';
import { fetchAiUsage, fetchLatestAnalysis } from '../api/deals';
import type {
  Strategy,
  MarketType,
  AnalysisReport,
  ChecklistTopItem,
  ClaudeEvaluation,
  ClaudeRecommendation,
  AiUsageSummary,
} from '../types';

const MARKET_ORDER: MarketType[] = ['stocks', 'crypto', 'forex'];

const CHECKLIST_TYPE_COLORS: Record<string, string> = {
  plus: '#4caf50',
  minus: '#f44336',
  wait: '#ff9800',
};

const REC_LABELS: Record<ClaudeRecommendation, string> = {
  take: 'Take',
  skip: 'Skip',
  wait: 'Wait',
};

const REC_COLORS: Record<ClaudeRecommendation, string> = {
  take: '#4caf50',
  skip: '#f44336',
  wait: '#ff9800',
};

const CHART_TOOLTIP = {
  contentStyle: { background: '#242424', border: '1px solid #333', fontSize: 12 },
};

function ChartPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-muted text-sm text-center px-4">
      {message}
    </div>
  );
}

const PURPOSE_LABELS: Record<string, string> = {
  check_setup: 'Проверка сетапа',
  analyze_closed: 'Разбор сделки',
  analysis_report: 'Отчёт за период',
  other: 'Прочее',
};

function AiUsageBlock({ usage }: { usage: AiUsageSummary }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-text">Расход Claude</h3>
          <p className="text-xs text-muted mt-0.5">
            Оценка за {usage.days} дн. · ваши вызовы · не биллинг Anthropic
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted uppercase tracking-wide">~ USD</p>
          <p className="text-xl font-semibold text-text">
            ${usage.estimatedCostUsd.toFixed(3)}
          </p>
          <p className="text-[11px] text-muted/70">{usage.calls} вызовов</p>
        </div>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted">Input tokens</p>
          <p className="text-text font-medium">{usage.inputTokens.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Output tokens</p>
          <p className="text-text font-medium">{usage.outputTokens.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Cache read</p>
          <p className="text-text font-medium">{usage.cacheReadTokens.toLocaleString()}</p>
        </div>
      </div>
      {usage.byPurpose.length > 0 && (
        <div className="px-4 pb-3">
          <ul className="text-xs text-muted space-y-1">
            {usage.byPurpose.map((p) => (
              <li key={p.purpose} className="flex justify-between gap-2">
                <span>{PURPOSE_LABELS[p.purpose] ?? p.purpose}</span>
                <span className="text-text">
                  {p.calls} · ${p.estimatedCostUsd.toFixed(3)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ClaudeEvaluationBlock({ evaluation }: { evaluation: ClaudeEvaluation }) {
  const accuracy = evaluation.accuracyPercent;
  const ece = evaluation.expectedCalibrationError;
  const curve = evaluation.calibrationCurve ?? evaluation.confidenceBuckets.map((b) => ({
    label: b.label,
    claimedConfidence: b.avgConfidence,
    actualWinRate: b.winRate,
    count: b.count,
    delta: b.winRate - Math.round(b.avgConfidence),
  }));
  const chartData = curve.map((p) => ({
    label: p.label,
    claimed: p.claimedConfidence,
    actual: p.actualWinRate,
    perfect: p.claimedConfidence,
  }));

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-text">Оценка Claude</h3>
          <p className="text-xs text-muted mt-0.5">
            Закрытые win/loss с проверкой сетапа · {evaluation.evaluatedDeals} сделок
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {accuracy !== null && (
            <div className="text-right">
              <p className="text-xs text-muted uppercase tracking-wide">Точность take/skip</p>
              <p
                className="text-xl font-semibold"
                style={{ color: accuracy >= 50 ? '#4caf50' : '#f44336' }}
              >
                {accuracy}%
              </p>
              <p className="text-[11px] text-muted/70">take→win, skip→loss</p>
            </div>
          )}
          {ece != null && (
            <div className="text-right">
              <p className="text-xs text-muted uppercase tracking-wide">ECE</p>
              <p
                className="text-xl font-semibold"
                style={{ color: ece <= 10 ? '#4caf50' : ece <= 20 ? '#ff9800' : '#f44336' }}
              >
                {ece}
              </p>
              <p className="text-[11px] text-muted/70">ниже = лучше калибровка</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0 md:divide-x divide-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Рек.</th>
                <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">N</th>
                <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Win%</th>
                <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Conf</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.byRecommendation.map((row) => (
                <tr key={row.recommendation} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        background: `${REC_COLORS[row.recommendation]}22`,
                        color: REC_COLORS[row.recommendation],
                        border: `1px solid ${REC_COLORS[row.recommendation]}44`,
                      }}
                    >
                      {REC_LABELS[row.recommendation]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-text">{row.count}</td>
                  <td
                    className="px-4 py-2.5 text-right font-medium"
                    style={{
                      color: row.recommendation === 'skip'
                        ? (row.winRate <= 40 ? '#4caf50' : '#f44336')
                        : (row.winRate >= 50 ? '#4caf50' : '#f44336'),
                    }}
                  >
                    {row.winRate}%
                    <span className="text-muted font-normal text-xs ml-1">
                      ({row.wins}W/{row.losses}L)
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted">{row.avgConfidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto border-t md:border-t-0 border-border">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs text-muted">Калибровка уверенности (только take)</p>
          </div>
          {curve.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted">Нет take-рекомендаций</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Conf</th>
                  <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">N</th>
                  <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Fact win%</th>
                  <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Δ</th>
                </tr>
              </thead>
              <tbody>
                {curve.map((b) => (
                  <tr key={b.label} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-2.5 text-text">{b.label}%</td>
                    <td className="px-4 py-2.5 text-right text-text">{b.count}</td>
                    <td className="px-4 py-2.5 text-right text-text">{b.actualWinRate}%</td>
                    <td
                      className="px-4 py-2.5 text-right font-medium"
                      style={{ color: b.delta >= 0 ? '#4caf50' : '#f44336' }}
                    >
                      {b.delta > 0 ? '+' : ''}{b.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="px-4 py-4 border-t border-border">
          <p className="text-xs text-muted mb-3">
            Кривая калибровки: заявленная уверенность vs фактический winrate (идеал — совпадение линий)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" stroke="#888" tick={{ fontSize: 11 }} />
              <YAxis stroke="#888" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip {...CHART_TOOLTIP} />
              <Legend />
              <Line
                type="monotone"
                dataKey="claimed"
                name="Заявлено"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Факт win%"
                stroke="#4caf50"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ChecklistTopTable({
  title,
  items,
  highlightKey,
}: {
  title: string;
  items: ChecklistTopItem[];
  highlightKey: 'inWins' | 'inLosses';
}) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <h3 className="text-sm font-medium text-text px-4 py-3 border-b border-border">{title}</h3>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-xs text-muted">Недостаточно данных</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Пункт</th>
                <th className="text-left px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Стратегия</th>
                <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Win</th>
                <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Loss</th>
                <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Всего</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.key}-${item.strategy}`} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded mr-1.5"
                      style={{
                        background: `${CHECKLIST_TYPE_COLORS[item.type] ?? '#888'}22`,
                        color: CHECKLIST_TYPE_COLORS[item.type] ?? '#888',
                        border: `1px solid ${CHECKLIST_TYPE_COLORS[item.type] ?? '#888'}44`,
                      }}
                    >
                      {item.type}
                    </span>
                    <span className="text-text">{item.label}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted text-xs">{item.strategy}</td>
                  <td className={`px-4 py-2.5 text-right ${highlightKey === 'inWins' ? 'text-green font-semibold' : 'text-green'}`}>
                    {item.inWins}
                  </td>
                  <td className={`px-4 py-2.5 text-right ${highlightKey === 'inLosses' ? 'text-red font-semibold' : 'text-red'}`}>
                    {item.inLosses}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisReport | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsageSummary | null>(null);

  useEffect(() => {
    fetchLatestAnalysis().then(setLatestAnalysis).catch(console.error);
    fetchAiUsage(30).then(setAiUsage).catch(console.error);
  }, []);

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="rounded-lg bg-red/10 border border-red/30 p-4 text-red text-sm">
        {error}
      </div>
    );
  }

  if (!data) return <EmptyState message="Нет данных" />;

  const recentDeals = data.recentDeals ?? [];
  const activeDeals = recentDeals.filter((d) => d.status === 'entered').length;

  const weeklyData = (data.weeklyPerformance ?? []).map((w) => ({
    label: formatShortDate(w.weekStart),
    winRate: w.winRate ?? undefined,
    avgR: w.avgR ?? undefined,
    total: w.total,
  }));

  const profitData = (data.profitSumDaily ?? []).map((d) => ({
    label: formatShortDate(d.date),
    profitR: d.profitR,
    profitUsd: d.profitUsd,
  }));

  const drawdownData = (data.dailyDrawdown ?? []).map((d) => ({
    label: formatShortDate(d.date),
    drawdownR: d.drawdownR,
    drawdownUsd: d.drawdownUsd,
  }));

  const dealsPerDayData = (data.dealsPerDay ?? []).map((d) => ({
    label: formatShortDate(d.date),
    count: d.count,
  }));

  const hasAdvancedMetrics = data.expectancyR !== undefined;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-text">Дашборд</h2>

      {/* Primary KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Закрытых сделок" value={data.totalDeals} />
        <StatCard
          label="Win Rate"
          value={formatPercent(data.winRate)}
          accent={data.winRate >= 50 ? '#4caf50' : '#f44336'}
        />
        <StatCard label="Средний PassRoad" value={formatPercent(data.avgPassRoad)} />
        <StatCard
          label="Активных"
          value={activeDeals}
          accent={activeDeals > 0 ? '#ff9800' : undefined}
        />
      </div>

      {/* Advanced KPI */}
      {hasAdvancedMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label="Expectancy"
            value={formatR(data.expectancyR!)}
            accent={data.expectancyR! >= 0 ? '#4caf50' : '#f44336'}
          />
          <StatCard
            label="Expectancy $"
            value={formatUsd(data.expectancyUsd!)}
            accent={data.expectancyUsd! >= 0 ? '#4caf50' : '#f44336'}
          />
          <StatCard
            label="Max DD"
            value={formatR(data.maxDrawdownR!)}
            accent="#f44336"
          />
          <StatCard
            label="Max DD $"
            value={formatUsd(data.maxDrawdownUsd!)}
            accent="#f44336"
          />
          <StatCard
            label="Сделок / день"
            value={data.avgDealsPerDay!.toFixed(1)}
          />
        </div>
      )}

      {data.claudeEvaluation && (
        <ClaudeEvaluationBlock evaluation={data.claudeEvaluation} />
      )}

      {aiUsage && aiUsage.calls > 0 && (
        <AiUsageBlock usage={aiUsage} />
      )}

      {/* Weekly performance */}
      {data.weeklyPerformance && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-text mb-4">Win Rate + Avg R по неделям</h3>
          {weeklyData.length === 0 ? (
            <ChartPlaceholder message="Нет данных по неделям" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={weeklyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="label" stroke="#888" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#888" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#888" tick={{ fontSize: 11 }} />
                <Tooltip
                  {...CHART_TOOLTIP}
                  formatter={(value, name, item) => {
                    const total = (item as { payload?: { total?: number } }).payload?.total ?? 0;
                    if (name === 'Win Rate') {
                      return value != null ? [`${value}% (${total} сделок)`, name] : ['—', name];
                    }
                    return value != null ? [`${Number(value).toFixed(2)}R`, name] : ['—', name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="winRate" name="Win Rate" fill="#2196f3" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avgR" name="Avg R" stroke="#ff9800" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Daily charts */}
      {hasAdvancedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text mb-3">P&L по дням (R)</h3>
            {profitData.length === 0 ? (
              <ChartPlaceholder message="Нет данных" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="label" stroke="#888" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                  <Tooltip
                    {...CHART_TOOLTIP}
                    formatter={(value, name) => {
                      if (name === 'profitR') return [`${Number(value).toFixed(2)}R`, 'P&L R'];
                      return [formatUsd(Number(value)), 'P&L $'];
                    }}
                  />
                  <Bar dataKey="profitR" radius={[3, 3, 0, 0]}>
                    {profitData.map((entry, i) => (
                      <Cell key={i} fill={entry.profitR >= 0 ? '#4caf50' : '#f44336'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-surface border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text mb-3">Просадка по дням</h3>
            {drawdownData.length === 0 ? (
              <ChartPlaceholder message="Нет данных" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={drawdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="label" stroke="#888" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                  <Tooltip
                    {...CHART_TOOLTIP}
                    formatter={(value, name) =>
                      name === 'drawdownR'
                        ? [`${Number(value).toFixed(2)}R`, 'DD R']
                        : [formatUsd(Number(value)), 'DD $']
                    }
                  />
                  <Line type="monotone" dataKey="drawdownR" stroke="#f44336" strokeWidth={2} dot={{ r: 2 }} name="drawdownR" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-surface border border-border rounded-lg p-4 md:col-span-2 xl:col-span-1">
            <h3 className="text-sm font-medium text-text mb-3">Сделок в день</h3>
            {dealsPerDayData.length === 0 ? (
              <ChartPlaceholder message="Нет данных" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dealsPerDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="label" stroke="#888" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#888" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    {...CHART_TOOLTIP}
                    formatter={(value) => [`${value}`, 'Сделок']}
                  />
                  <Bar dataKey="count" fill="#2196f3" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Strategy win rate chart */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-text mb-4">Win Rate по стратегиям</h3>
        <WinRateChart data={data.byStrategy} />
      </div>

      {/* Strategy & market tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <h3 className="text-sm font-medium text-text px-4 py-3 border-b border-border">Статистика по стратегиям</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2.5 text-muted font-normal text-xs uppercase tracking-wide whitespace-nowrap">Стратегия</th>
                  <th className="text-right px-3 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Всего</th>
                  <th className="text-right px-3 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">W</th>
                  <th className="text-right px-3 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">L</th>
                  <th className="text-right px-3 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">WR</th>
                  <th className="text-right px-3 py-2.5 text-muted font-normal text-xs uppercase tracking-wide whitespace-nowrap">Ratio</th>
                  <th className="text-right px-3 py-2.5 text-muted font-normal text-xs uppercase tracking-wide whitespace-nowrap">Avg R</th>
                  <th className="text-right px-3 py-2.5 text-muted font-normal text-xs uppercase tracking-wide whitespace-nowrap">Edge plan</th>
                  <th className="text-right px-3 py-2.5 text-muted font-normal text-xs uppercase tracking-wide whitespace-nowrap">Edge real</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(data.byStrategy) as [Strategy, typeof data.byStrategy[Strategy]][]).map(
                  ([strategy, stats]) => (
                    <tr key={strategy} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{
                            background: `${STRATEGY_COLORS[strategy]}22`,
                            color: STRATEGY_COLORS[strategy],
                            border: `1px solid ${STRATEGY_COLORS[strategy]}44`,
                          }}
                        >
                          {strategy}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-text">{stats.total}</td>
                      <td className="px-3 py-2.5 text-right text-green">{stats.wins}</td>
                      <td className="px-3 py-2.5 text-right text-red">{stats.losses}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span style={{ color: stats.winRate >= 50 ? '#4caf50' : '#f44336' }}>
                          {formatPercent(stats.winRate)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-text">{stats.avgRatio.toFixed(1)}</td>
                      <td className="px-3 py-2.5 text-right text-text">{stats.avgR.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right text-text">{stats.edgePlanned.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span style={{ color: stats.edgeReal >= 0 ? '#4caf50' : '#f44336' }}>
                          {stats.edgeReal.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>

        {data.byMarket && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <h3 className="text-sm font-medium text-text px-4 py-3 border-b border-border">Статистика по рынкам</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Рынок</th>
                    <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Всего</th>
                    <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Win</th>
                    <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Loss</th>
                    <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {MARKET_ORDER.map((market) => {
                    const stats = data.byMarket![market];
                    if (!stats) return null;
                    return (
                      <tr key={market} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-2.5 text-text">{MARKET_LABELS[market] ?? market}</td>
                        <td className="px-4 py-2.5 text-right text-text">{stats.total}</td>
                        <td className="px-4 py-2.5 text-right text-green">{stats.wins}</td>
                        <td className="px-4 py-2.5 text-right text-red">{stats.losses}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span style={{ color: stats.winRate >= 50 ? '#4caf50' : '#f44336' }}>
                            {formatPercent(stats.winRate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Checklist tops */}
      {(data.topChecklistInWins || data.topChecklistInLoss) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.topChecklistInWins && (
            <ChecklistTopTable
              title="✅ Чек-лист в победах"
              items={data.topChecklistInWins}
              highlightKey="inWins"
            />
          )}
          {data.topChecklistInLoss && (
            <ChecklistTopTable
              title="❌ Чек-лист в поражениях"
              items={data.topChecklistInLoss}
              highlightKey="inLosses"
            />
          )}
        </div>
      )}

      {/* Recent deals */}
      <div>
        <h3 className="text-sm font-medium text-text mb-3">Последние сделки</h3>
        {recentDeals.length === 0 ? (
          <EmptyState message="Нет недавних сделок" />
        ) : (
          <div className="space-y-2">
            {recentDeals.slice(0, 5).map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>

      {/* Latest analysis */}
      {latestAnalysis && (
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text">🤖 Последний анализ</span>
            <span className="text-xs text-muted">
              {format(new Date(latestAnalysis.periodFrom), 'dd.MM')} —{' '}
              {format(new Date(latestAnalysis.periodTo), 'dd.MM.yyyy')}
            </span>
          </div>
          <p className="text-sm text-muted line-clamp-3">{latestAnalysis.summary}</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted">
            <span>
              Win Rate:{' '}
              <span style={{ color: latestAnalysis.metrics.winRate >= 50 ? '#4caf50' : '#f44336' }}>
                {latestAnalysis.metrics.winRate}%
              </span>
            </span>
            <span>Лучшая: <span className="text-text">{latestAnalysis.metrics.bestStrategy}</span></span>
            <span>Ошибка: <span className="text-orange">{latestAnalysis.metrics.topMistake}</span></span>
          </div>
          <Link to="/analysis" className="text-xs text-blue hover:underline">
            Читать полностью →
          </Link>
        </div>
      )}
    </div>
  );
}
