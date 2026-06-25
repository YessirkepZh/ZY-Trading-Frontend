import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useDashboard } from '../hooks/useDashboard';
import StatCard from '../components/StatCard';
import DealCard from '../components/DealCard';
import WinRateChart from '../components/WinRateChart';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { formatPercent } from '../utils/formatters';
import { STRATEGY_COLORS, MARKET_LABELS } from '../utils/constants';
import { fetchLatestAnalysis } from '../api/deals';
import type { Strategy, MarketType, AnalysisReport } from '../types';

const MARKET_ORDER: MarketType[] = ['stocks', 'crypto', 'forex'];

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisReport | null>(null);

  useEffect(() => {
    fetchLatestAnalysis().then(setLatestAnalysis).catch(console.error);
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

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-text">Дашборд</h2>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Всего сделок" value={data.totalDeals} />
        <StatCard
          label="Win Rate"
          value={formatPercent(data.winRate)}
          accent={data.winRate >= 50 ? '#4caf50' : '#f44336'}
        />
        <StatCard
          label="Средний PassRoad"
          value={formatPercent(data.avgPassRoad)}
        />
        <StatCard
          label="Активных"
          value={activeDeals}
          accent={activeDeals > 0 ? '#ff9800' : undefined}
        />
      </div>

      {/* Chart */}
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
                  <th className="text-left px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Стратегия</th>
                  <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Всего</th>
                  <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Win</th>
                  <th className="text-right px-4 py-2.5 text-muted font-normal text-xs uppercase tracking-wide">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(data.byStrategy) as [Strategy, { total: number; wins: number; winRate: number }][]).map(
                  ([strategy, stats]) => (
                    <tr key={strategy} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2.5">
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
                      <td className="px-4 py-2.5 text-right text-text">{stats.total}</td>
                      <td className="px-4 py-2.5 text-right text-green">{stats.wins}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span style={{ color: stats.winRate >= 50 ? '#4caf50' : '#f44336' }}>
                          {formatPercent(stats.winRate)}
                        </span>
                      </td>
                    </tr>
                  )
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
