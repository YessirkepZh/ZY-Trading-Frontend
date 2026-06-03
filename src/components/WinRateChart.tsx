import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Strategy } from '../types';
import { STRATEGY_COLORS } from '../utils/constants';

interface WinRateChartProps {
  data: Record<Strategy, { total: number; wins: number; winRate: number }>;
}

export default function WinRateChart({ data }: WinRateChartProps) {
  const chartData = Object.entries(data).map(([strategy, stats]) => ({
    strategy,
    winRate: Math.round(stats.winRate),
    color: STRATEGY_COLORS[strategy] ?? '#888',
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="strategy"
          tick={{ fill: '#888', fontSize: 11 }}
          axisLine={{ stroke: '#333' }}
          tickLine={false}
        />
        <YAxis
          unit="%"
          tick={{ fill: '#888', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{ background: '#242424', border: '1px solid #333', borderRadius: 6 }}
          labelStyle={{ color: '#e0e0e0', fontSize: 12 }}
          itemStyle={{ color: '#e0e0e0', fontSize: 12 }}
          formatter={(value) => [`${value}%`, 'Win Rate']}
        />
        <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.strategy} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
