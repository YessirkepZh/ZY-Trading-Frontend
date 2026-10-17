import { useState, useEffect } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  createAnalysis, fetchAnalysisReports, fetchAnalysisReportById,
} from '../api/deals';
import type { AnalysisReport } from '../types';
import { sanitizeHtml } from '../utils/sanitizeHtml';

const DAY_LABELS: Record<string, string> = {
  monday: 'Пн', tuesday: 'Вт', wednesday: 'Ср',
  thursday: 'Чт', friday: 'Пт', saturday: 'Сб', sunday: 'Вс',
};

function getBarColor(winRate: number): string {
  if (winRate >= 60) return '#4caf50';
  if (winRate >= 40) return '#ff9800';
  return '#f44336';
}

function winRateTooltip(value: unknown, _name: unknown, item: unknown): [string, string] {
  const v = typeof value === 'number' ? value : Number(value ?? 0);
  const count = (item as { payload?: { count?: number } })?.payload?.count ?? 0;
  return [`${v}% (${count} сделок)`, 'Win Rate'];
}

export default function AnalysisPage() {
  const [periodFrom, setPeriodFrom] = useState(
    format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
  );
  const [periodTo, setPeriodTo] = useState(
    format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
  );
  const [allPeriod, setAllPeriod] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysisReports().then(setReports).catch(console.error);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const from = allPeriod ? '2024-01-01' : periodFrom;
      const to   = allPeriod ? format(new Date(), 'yyyy-MM-dd') : periodTo;

      const result = await createAnalysis({ periodFrom: from, periodTo: to });
      // Report is created as a stub; Claude fills it in the background
      let full = await fetchAnalysisReportById(result.id);
      setCurrentReport(full);

      for (let i = 0; i < 90 && full.summary === 'Генерируется…'; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        full = await fetchAnalysisReportById(result.id);
        setCurrentReport(full);
      }
      if (full.summary === 'Генерируется…') {
        setError('Отчёт ещё генерируется — открой его из списка через минуту');
      }

      const updated = await fetchAnalysisReports();
      setReports(updated);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error ?? e.message ?? 'Ошибка генерации');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = async (id: number) => {
    try {
      const full = await fetchAnalysisReportById(id);
      setCurrentReport(full);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // silent
    }
  };

  const m = currentReport?.metrics;

  const passRoadData = m
    ? Object.entries(m.winRateByPassRoad).map(([key, v]) => ({
        name: key, winRate: v.winRate, count: v.count,
      }))
    : [];

  const atrData = m
    ? Object.entries(m.winRateByAtrPercent).map(([key, v]) => ({
        name: key, winRate: v.winRate, count: v.count,
      }))
    : [];

  const dowData = m
    ? Object.entries(m.winRateByDayOfWeek).map(([key, v]) => ({
        name: DAY_LABELS[key] ?? key, winRate: v.winRate, count: v.count,
      }))
    : [];

  const checklistData = m
    ? [...m.checklistCorrelation]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(item => ({ name: item.label, winRate: item.winRate, count: item.count, type: item.type }))
    : [];

  const timeToEntryData = m
    ? Object.values(m.timeToEntryAnalysis).map(zone => ({
        name: zone.label, winRate: zone.winRate, count: zone.count,
      }))
    : [];

  const timeToEntryTotalCount = m
    ? m.timeToEntryAnalysis.fast.count + m.timeToEntryAnalysis.medium.count + m.timeToEntryAnalysis.slow.count
    : 0;

  const checklistTypeColor: Record<string, string> = {
    plus: '#4caf50',
    minus: '#f44336',
    wait: '#ff9800',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-text">🤖 Анализ торговли</h2>

      {/* Form */}
      <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">От</label>
            <input
              type="date"
              value={periodFrom}
              onChange={e => setPeriodFrom(e.target.value)}
              disabled={allPeriod}
              className="bg-bg border border-border rounded px-3 py-1.5 text-sm text-text disabled:opacity-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">До</label>
            <input
              type="date"
              value={periodTo}
              onChange={e => setPeriodTo(e.target.value)}
              disabled={allPeriod}
              className="bg-bg border border-border rounded px-3 py-1.5 text-sm text-text disabled:opacity-40"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer pb-0.5">
            <input
              type="checkbox"
              checked={allPeriod}
              onChange={e => setAllPeriod(e.target.checked)}
              className="accent-blue"
            />
            За весь период
          </label>
        </div>

        {error && (
          <div className="rounded-lg bg-red/10 border border-red/30 p-3 text-red text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue/80 transition-colors"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {loading ? 'Анализирую...' : 'Сгенерировать анализ'}
        </button>

        {loading && (
          <div className="space-y-2">
            <p className="text-sm text-muted">🤖 Claude анализирует ваши сделки...</p>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-blue rounded-full animate-pulse w-2/3" />
            </div>
            <p className="text-xs text-muted">Это займёт 10–20 секунд</p>
          </div>
        )}
      </div>

      {/* Metrics */}
      {currentReport && m && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface border border-border rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted">Win Rate</p>
              <p className="text-xl font-bold" style={{ color: m.winRate >= 50 ? '#4caf50' : '#f44336' }}>
                {m.winRate}%
                {m.winRateChange !== undefined && (
                  <span className="text-sm ml-1" style={{ color: m.winRateChange >= 0 ? '#4caf50' : '#f44336' }}>
                    {m.winRateChange >= 0 ? '↑' : '↓'}{Math.abs(m.winRateChange)}%
                  </span>
                )}
              </p>
              <p className="text-xs text-muted">{m.closedDeals} сделок</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted">Лучшая стратегия</p>
              <p className="text-base font-semibold text-green">{m.bestStrategy}</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted">Худшая стратегия</p>
              <p className="text-base font-semibold text-red">{m.worstStrategy}</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted">Главная ошибка</p>
              <p className="text-sm font-medium text-orange">{m.topMistake}</p>
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* PassRoad */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-text mb-3">📍 PassRoad зоны</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={passRoadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#888" unit="%" />
                  <Tooltip
                    formatter={winRateTooltip}
                    contentStyle={{ background: '#242424', border: '1px solid #333', fontSize: 12 }}
                  />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {passRoadData.map((entry, i) => (
                      <Cell key={i} fill={getBarColor(entry.winRate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ATR% */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-text mb-3">📊 ATR% режимы</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={atrData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#888" unit="%" />
                  <Tooltip
                    formatter={winRateTooltip}
                    contentStyle={{ background: '#242424', border: '1px solid #333', fontSize: 12 }}
                  />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {atrData.map((entry, i) => (
                      <Cell key={i} fill={getBarColor(entry.winRate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Days of week */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-text mb-3">📅 Дни недели</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#888" unit="%" />
                  <Tooltip
                    formatter={winRateTooltip}
                    contentStyle={{ background: '#242424', border: '1px solid #333', fontSize: 12 }}
                  />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {dowData.map((entry, i) => (
                      <Cell key={i} fill={getBarColor(entry.winRate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* timeToEntry */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-text mb-3">⏱ Время до входа</h3>
              {timeToEntryTotalCount === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted text-sm text-center px-4">
                  Данные появятся по мере накопления новых сделок
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={timeToEntryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#888" unit="%" />
                      <Tooltip
                        formatter={winRateTooltip}
                        contentStyle={{ background: '#242424', border: '1px solid #333', fontSize: 12 }}
                      />
                      <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                        {timeToEntryData.map((entry, i) => (
                          <Cell key={i} fill={getBarColor(entry.winRate)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="chart-hint">
                    Быстрый вход (&lt;2ч) vs обдуманный (2–24ч) vs поздний (&gt;24ч)
                  </p>
                </>
              )}
            </div>

          </div>

          {/* Checklist correlation — full width */}
          {checklistData.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-text mb-3">✅ Чек-лист корреляция</h3>
              <ResponsiveContainer width="100%" height={checklistData.length * 32 + 20}>
                <BarChart data={checklistData} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" stroke="#888" unit="%" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#888" tick={{ fontSize: 11 }} width={160} />
                  <Tooltip
                    formatter={winRateTooltip}
                    contentStyle={{ background: '#242424', border: '1px solid #333', fontSize: 12 }}
                  />
                  <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                    {checklistData.map((entry, i) => (
                      <Cell key={i} fill={checklistTypeColor[entry.type] ?? '#888'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* HTML report */}
          {currentReport.contentHtml && (
            <div
              className="claude-report bg-surface border border-border rounded-lg p-4"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentReport.contentHtml) }}
            />
          )}
        </>
      )}

      {/* History */}
      {reports.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted border-b border-border pb-2">
            История анализов
          </h3>
          {reports.map(r => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📊</span>
                <div>
                  <p className="text-sm text-text">
                    {format(new Date(r.periodFrom), 'dd.MM')} — {format(new Date(r.periodTo), 'dd.MM.yyyy')}
                  </p>
                  <p className="text-xs text-muted">
                    {r.dealsCount} сделок · Win Rate {r.metrics.winRate}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenReport(r.id)}
                className="text-xs text-blue hover:underline"
              >
                открыть
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
