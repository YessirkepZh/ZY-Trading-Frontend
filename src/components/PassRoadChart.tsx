import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Deal } from '../types';
import { RESULT_COLORS } from '../utils/constants';

interface PassRoadChartProps {
  deals: Deal[];
}

export default function PassRoadChart({ deals }: PassRoadChartProps) {
  const data = deals
    .filter((d) => d.dealResult && d.calcResult.passRoad !== null)
    .map((d) => ({
      passRoad: d.calcResult.passRoad,
      result: d.dealResult,
      ticker: d.ticker,
      fill: d.dealResult ? RESULT_COLORS[d.dealResult] : '#888',
    }));

  if (data.length === 0) {
    return <p className="text-muted text-sm text-center py-8">Недостаточно данных</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ScatterChart margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="passRoad"
          name="PassRoad"
          unit="%"
          tick={{ fill: '#888', fontSize: 11 }}
          axisLine={{ stroke: '#333' }}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{ background: '#242424', border: '1px solid #333', borderRadius: 6 }}
          labelStyle={{ color: '#e0e0e0', fontSize: 12 }}
          itemStyle={{ color: '#e0e0e0', fontSize: 12 }}
          formatter={(value, name) => [name === 'passRoad' ? `${value}%` : value, String(name)]}
        />
        <Scatter
          data={data}
          fill="#2196f3"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
