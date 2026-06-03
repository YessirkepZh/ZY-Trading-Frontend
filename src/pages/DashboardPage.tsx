import { useDashboard } from '../hooks/useDashboard';
import StatCard from '../components/StatCard';
import DealCard from '../components/DealCard';
import WinRateChart from '../components/WinRateChart';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { formatPercent } from '../utils/formatters';
import { STRATEGY_COLORS } from '../utils/constants';
import type { Strategy } from '../types';

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();

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

      {/* Strategy table */}
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
    </div>
  );
}
