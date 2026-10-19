import { useEffect, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { fetchStrategies } from '../api/tradingSettings';
import DealCard from '../components/DealCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import type { DealStatus, MarketType } from '../types';
import { STATUS_LABELS, MARKET_LABELS } from '../utils/constants';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Все' },
  ...(['created', 'notified', 'entered', 'closed', 'missed'] as DealStatus[]).map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
  })),
];

const MARKET_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Все' },
  ...(['crypto', 'stocks', 'forex'] as MarketType[]).map((m) => ({
    value: m,
    label: MARKET_LABELS[m],
  })),
];

const PAGE_SIZE = 20;

interface FilterSelectProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function DealsPage() {
  const [status, setStatus] = useState('');
  const [strategy, setStrategy] = useState('');
  const [marketType, setMarketType] = useState('');
  const [page, setPage] = useState(0);
  const [strategyOptions, setStrategyOptions] = useState<Array<{ value: string; label: string }>>([
    { value: '', label: 'Все' },
  ]);

  const { deals, loading, error } = useDeals({ status, strategy, marketType, page, pageSize: PAGE_SIZE });

  useEffect(() => {
    let cancelled = false;
    fetchStrategies()
      .then((list) => {
        if (cancelled) return;
        setStrategyOptions([
          { value: '', label: 'Все' },
          ...list.map((s) => ({ value: s.name, label: s.name })),
        ]);
      })
      .catch(() => { /* keep "Все" only */ });
    return () => { cancelled = true; };
  }, []);

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(0);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">Сделки</h2>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FilterSelect
          label="Статус"
          value={status}
          options={STATUS_OPTIONS}
          onChange={handleFilterChange(setStatus)}
        />
        <FilterSelect
          label="Стратегия"
          value={strategy}
          options={strategyOptions}
          onChange={handleFilterChange(setStrategy)}
        />
        <FilterSelect
          label="Маркет"
          value={marketType}
          options={MARKET_OPTIONS}
          onChange={handleFilterChange(setMarketType)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="rounded-lg bg-red/10 border border-red/30 p-4 text-red text-sm">{error}</div>
      ) : deals.length === 0 ? (
        <EmptyState message="Сделки не найдены" />
      ) : (
        <div className="space-y-2">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && (
        <div className="flex items-center justify-between pt-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted disabled:opacity-40 hover:border-blue/50 hover:text-text transition-colors disabled:cursor-not-allowed"
          >
            ← Назад
          </button>
          <span className="text-xs text-muted">Стр. {page + 1}</span>
          <button
            disabled={deals.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted disabled:opacity-40 hover:border-blue/50 hover:text-text transition-colors disabled:cursor-not-allowed"
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}
