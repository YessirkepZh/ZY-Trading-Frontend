import { useNavigate } from 'react-router-dom';
import type { Deal } from '../types';
import { RESULT_COLORS, RESULT_LABELS, MARKET_LABELS } from '../utils/constants';
import { formatPrice, formatDateRelative } from '../utils/formatters';
import DealStatusBadge from './DealStatusBadge';
import StrategyBadge from './StrategyBadge';

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  const navigate = useNavigate();
  const { calcResult } = deal;

  const directionColor = deal.direction === 'long' ? '#4caf50' : '#f44336';
  const resultColor = deal.dealResult ? RESULT_COLORS[deal.dealResult] : undefined;
  const resultLabel = deal.dealResult ? RESULT_LABELS[deal.dealResult] : null;

  return (
    <div
      className="bg-surface border border-border rounded-lg p-4 cursor-pointer hover:border-blue/50 transition-colors"
      onClick={() => navigate(`/deals/${deal.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: `${directionColor}22`, color: directionColor, border: `1px solid ${directionColor}44` }}
          >
            {deal.direction === 'long' ? 'Long' : 'Short'}
          </span>
          <span className="font-semibold text-text">{deal.ticker}</span>
          <span className="text-muted text-xs">#{deal.id}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {resultLabel && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ background: `${resultColor}22`, color: resultColor, border: `1px solid ${resultColor}44` }}
            >
              {resultLabel}
            </span>
          )}
          <DealStatusBadge status={deal.status} />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-muted flex-wrap">
        <StrategyBadge strategy={deal.strategy} />
        <span>•</span>
        <span>{MARKET_LABELS[deal.marketType] ?? deal.marketType}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-muted">ATR: <span className="text-text">{calcResult.atr.toLocaleString('ru-RU')}</span></span>
        {(calcResult.passRoad !== null && calcResult.passRoad !== undefined) && (
          <span className="text-muted">PassRoad: <span className="text-text">{calcResult.passRoad}%</span></span>
        )}
        <span className="text-muted">Entry: <span className="text-text">{formatPrice(calcResult.entryPrice)}</span></span>
        <span className="text-muted">TP: <span className="text-green">{formatPrice(calcResult.takeProfitDefault)}</span></span>
        <span className="text-muted">SL: <span className="text-red">{formatPrice(calcResult.stopLossDefault)}</span></span>
        <span className="text-muted">{formatDateRelative(deal.createdAt)}</span>
      </div>
    </div>
  );
}
