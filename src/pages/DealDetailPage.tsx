import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDeal } from '../hooks/useDeal';
import DealStatusBadge from '../components/DealStatusBadge';
import StrategyBadge from '../components/StrategyBadge';
import ScreenshotModal from '../components/ScreenshotModal';
import Loader from '../components/Loader';
import { formatPrice, formatDate } from '../utils/formatters';
import { RESULT_COLORS, RESULT_LABELS, MARKET_LABELS } from '../utils/constants';
import { fetchChecklistItems } from '../api/checklist';

interface ScreenshotThumbProps {
  src: string;
  label: string;
  onClick: () => void;
}

function ScreenshotThumb({ src, label, onClick }: ScreenshotThumbProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <button
        onClick={onClick}
        className="relative w-full aspect-video rounded-lg overflow-hidden border border-border hover:border-blue/50 transition-colors"
      >
        <img src={src} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
          <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </button>
    </div>
  );
}

interface TableRowProps {
  label: string;
  value: React.ReactNode;
}

function TableRow({ label, value }: TableRowProps) {
  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="px-4 py-2.5 text-muted text-sm">{label}</td>
      <td className="px-4 py-2.5 text-text text-sm">{value}</td>
    </tr>
  );
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numId = id ? parseInt(id, 10) : null;
  const { deal, loading, error } = useDeal(numId);

  const [modalSrc, setModalSrc] = useState<{ src: string; label: string } | null>(null);
  const [checklistLabels, setChecklistLabels] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!deal?.strategy) return;
    fetchChecklistItems({ strategy: deal.strategy })
      .then((items) => {
        setChecklistLabels(new Map(items.map((i) => [i.key, i.label])));
      })
      .catch(() => {});
  }, [deal?.strategy]);

  const resolveKey = (key: string) => checklistLabels.get(key) ?? key;

  if (loading) return <Loader />;

  if (error || !deal) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-muted text-sm hover:text-text transition-colors flex items-center gap-1">
          ← Назад
        </button>
        <div className="rounded-lg bg-red/10 border border-red/30 p-4 text-red text-sm">
          {error ?? 'Сделка не найдена'}
        </div>
      </div>
    );
  }

  const { calcResult, claudeCheckResult, checklistSnapshot, claudeStatsResult } = deal;
  const resultColor = deal.dealResult ? RESULT_COLORS[deal.dealResult] : undefined;
  const resultLabel = deal.dealResult ? RESULT_LABELS[deal.dealResult] : null;
  const directionColor = deal.direction === 'long' ? '#4caf50' : '#f44336';

  const hasCustomStop = !!calcResult.entryPriceByStop;
  const screenshots = [
    deal.screenshotSetup && { src: deal.screenshotSetup, label: 'Setup' },
    deal.screenshotEntry && { src: deal.screenshotEntry, label: 'Entry' },
    deal.screenshotClose && { src: deal.screenshotClose, label: 'Close' },
  ].filter(Boolean) as Array<{ src: string; label: string }>;

  const recommendationColors: Record<string, string> = {
    take: '#4caf50',
    skip: '#f44336',
    wait: '#ff9800',
  };

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="text-muted text-sm hover:text-text transition-colors flex items-center gap-1"
        >
          ← Назад
        </button>
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: `${directionColor}22`, color: directionColor, border: `1px solid ${directionColor}44` }}
          >
            {deal.direction === 'long' ? 'Long' : 'Short'}
          </span>
          <h2 className="text-lg font-semibold text-text">{deal.ticker}</h2>
          <span className="text-muted text-sm">•</span>
          <span className="text-muted text-sm">{MARKET_LABELS[deal.marketType] ?? deal.marketType}</span>
          {resultLabel && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ background: `${resultColor}22`, color: resultColor, border: `1px solid ${resultColor}44` }}
            >
              {resultLabel}
            </span>
          )}
          <DealStatusBadge status={deal.status} />
          <StrategyBadge strategy={deal.strategy} />
          <span className="text-muted text-xs">#{deal.id}</span>
        </div>
      </div>

      <div className="text-xs text-muted">
        Создана: {formatDate(deal.createdAt)}
        {deal.closedAt && <> • Закрыта: {formatDate(deal.closedAt)}</>}
      </div>

      {/* Calculations */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <h3 className="text-sm font-medium text-text px-4 py-3 border-b border-border">Расчёты</h3>
        <table className="w-full">
          <tbody>
            <TableRow label="ATR" value={calcResult.atr.toLocaleString('ru-RU')} />
            {calcResult.passRoad !== null && calcResult.passRoad !== undefined && (
              <TableRow label="PassRoad" value={`${calcResult.passRoad}%`} />
            )}
            <TableRow label="Entry" value={formatPrice(calcResult.entryPrice)} />
            <TableRow label="SL" value={<span className="text-red">{formatPrice(calcResult.stopLossDefault)}</span>} />
            <TableRow label="TP" value={<span className="text-green">{formatPrice(calcResult.takeProfitDefault)}</span>} />
            <TableRow label="Количество" value={calcResult.quantity} />
            <TableRow label="Сумма" value={`$${calcResult.sum.toLocaleString('ru-RU')}`} />
          </tbody>
        </table>
      </div>

      {/* Custom stop table */}
      {hasCustomStop && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <h3 className="text-sm font-medium text-text px-4 py-3 border-b border-border">Технический вход</h3>
          <table className="w-full">
            <tbody>
              {calcResult.entryPriceByStop && (
                <TableRow label="Entry (tech)" value={formatPrice(calcResult.entryPriceByStop)} />
              )}
              {calcResult.stopLossByStop && (
                <TableRow label="SL (tech)" value={<span className="text-red">{formatPrice(calcResult.stopLossByStop)}</span>} />
              )}
              {calcResult.takeProfitByStop && (
                <TableRow label="TP1" value={<span className="text-green">{formatPrice(calcResult.takeProfitByStop)}</span>} />
              )}
              {calcResult.takeProfitByStop2 && (
                <TableRow label="TP2" value={<span className="text-green">{formatPrice(calcResult.takeProfitByStop2)}</span>} />
              )}
              {calcResult.takeProfitByStop3 && (
                <TableRow label="TP3" value={<span className="text-green">{formatPrice(calcResult.takeProfitByStop3)}</span>} />
              )}
              {calcResult.quantityByStop && (
                <TableRow label="Количество" value={calcResult.quantityByStop} />
              )}
              {calcResult.sumByStop && (
                <TableRow label="Сумма" value={`$${calcResult.sumByStop.toLocaleString('ru-RU')}`} />
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Claude check */}
      {claudeCheckResult && (
        <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">🤖 Claude:</span>
            <span
              className="text-sm font-semibold uppercase"
              style={{ color: recommendationColors[claudeCheckResult.recommendation] }}
            >
              {claudeCheckResult.recommendation} ({claudeCheckResult.confidence}%)
            </span>
          </div>
          <p className="text-sm text-text/80 italic">"{claudeCheckResult.reasoningRu ?? claudeCheckResult.reasoning}"</p>
          {(claudeCheckResult.warningsRu ?? claudeCheckResult.warnings).length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-orange font-medium mb-1">⚠️ Предупреждения:</p>
              <ul className="space-y-0.5">
                {(claudeCheckResult.warningsRu ?? claudeCheckResult.warnings).map((w, i) => (
                  <li key={i} className="text-xs text-muted">• {w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Checklist */}
      {checklistSnapshot && (
        <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-medium text-text">Чек-лист</h3>
          {checklistSnapshot.plus.length > 0 && (
            <div>
              <p className="text-xs text-green font-medium mb-1">✅ ПРЕДПОСЫЛКИ:</p>
              <p className="text-xs text-muted">{checklistSnapshot.plus.map(resolveKey).join(', ')}</p>
            </div>
          )}
          {checklistSnapshot.minus.length > 0 && (
            <div>
              <p className="text-xs text-red font-medium mb-1">❌ МИНУСЫ:</p>
              <p className="text-xs text-muted">{checklistSnapshot.minus.map(resolveKey).join(', ')}</p>
            </div>
          )}
          {checklistSnapshot.wait.length > 0 && (
            <div>
              <p className="text-xs text-orange font-medium mb-1">⏳ ОЖИДАЮ:</p>
              <p className="text-xs text-muted">{checklistSnapshot.wait.map(resolveKey).join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text mb-3">Скриншоты</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {screenshots.map((ss) => (
              <ScreenshotThumb
                key={ss.label}
                src={ss.src}
                label={ss.label}
                onClick={() => setModalSrc(ss)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Claude stats */}
      {claudeStatsResult && (
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div>
            <p className="text-sm">📊 Итог:</p>
            <p className="text-sm text-muted mt-1">{claudeStatsResult.summary}</p>
          </div>
          {claudeStatsResult.mistakes.length > 0 && (
            <div>
              <p className="text-xs text-red font-medium mb-1">❌ Ошибки:</p>
              <ul className="space-y-0.5">
                {claudeStatsResult.mistakes.map((m, i) => (
                  <li key={i} className="text-xs text-muted">• {m}</li>
                ))}
              </ul>
            </div>
          )}
          {claudeStatsResult.improvements.length > 0 && (
            <div>
              <p className="text-xs text-blue font-medium mb-1">💡 Улучшения:</p>
              <ul className="space-y-0.5">
                {claudeStatsResult.improvements.map((imp, i) => (
                  <li key={i} className="text-xs text-muted">• {imp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Screenshot modal */}
      {modalSrc && (
        <ScreenshotModal
          src={modalSrc.src}
          label={modalSrc.label}
          onClose={() => setModalSrc(null)}
        />
      )}
    </div>
  );
}
