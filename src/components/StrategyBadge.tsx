import { STRATEGY_COLORS } from '../utils/constants';
import type { Strategy } from '../types';

interface StrategyBadgeProps {
  strategy: Strategy;
}

export default function StrategyBadge({ strategy }: StrategyBadgeProps) {
  const color = STRATEGY_COLORS[strategy] ?? '#888';

  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {strategy}
    </span>
  );
}
