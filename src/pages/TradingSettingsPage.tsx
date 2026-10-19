import { useCallback, useEffect, useState } from 'react';
import {
  archiveRiskPreset,
  archiveStrategy,
  createRiskPreset,
  createStrategy,
  fetchRiskPresets,
  fetchStrategies,
  updateRiskPreset,
  updateStrategy,
} from '../api/tradingSettings';
import { getApiErrorMessage } from '../api/client';
import Loader from '../components/Loader';
import type { RiskPreset, TradingStrategy } from '../types';

const INPUT =
  'w-full bg-bg border border-border rounded-lg px-3 py-2 text-text text-sm outline-none focus:border-blue transition-colors placeholder:text-muted/50';
const BTN =
  'bg-blue/20 text-blue border border-blue/30 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-blue/30 transition-colors disabled:opacity-50';
const BTN_DANGER =
  'text-red border border-red/30 rounded-lg px-3 py-1.5 text-sm hover:bg-red/10 transition-colors disabled:opacity-50';

export default function TradingSettingsPage() {
  const [presets, setPresets] = useState<RiskPreset[]>([]);
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [presetForm, setPresetForm] = useState({
    name: '',
    riskPercent: '15',
    ratio: '3',
    luftPercent: '20',
    riskSum: '15',
    isDefault: false,
  });
  const [strategyName, setStrategyName] = useState('');
  const [strategyPresetId, setStrategyPresetId] = useState<string>('');

  const reload = useCallback(async () => {
    const [p, s] = await Promise.all([fetchRiskPresets(), fetchStrategies()]);
    setPresets(p);
    setStrategies(s);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить настройки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reload]);

  const handleCreatePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createRiskPreset({
        name: presetForm.name.trim(),
        riskPercent: Number(presetForm.riskPercent),
        ratio: Number(presetForm.ratio),
        luftPercent: Number(presetForm.luftPercent),
        riskSum: Number(presetForm.riskSum),
        isDefault: presetForm.isDefault,
      });
      setPresetForm({
        name: '',
        riskPercent: '15',
        ratio: '3',
        luftPercent: '20',
        riskSum: '15',
        isDefault: false,
      });
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось создать пресет'));
    } finally {
      setBusy(false);
    }
  };

  const handleSetDefault = async (preset: RiskPreset) => {
    setBusy(true);
    setError(null);
    try {
      await updateRiskPreset(preset.id, { isDefault: true });
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось обновить пресет'));
    } finally {
      setBusy(false);
    }
  };

  const handleArchivePreset = async (preset: RiskPreset) => {
    if (preset.isSystem) return;
    if (!window.confirm(`Архивировать пресет «${preset.name}»?`)) return;
    setBusy(true);
    setError(null);
    try {
      await archiveRiskPreset(preset.id);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось архивировать пресет'));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createStrategy({
        name: strategyName.trim(),
        defaultRiskPresetId: strategyPresetId ? Number(strategyPresetId) : null,
      });
      setStrategyName('');
      setStrategyPresetId('');
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось создать стратегию'));
    } finally {
      setBusy(false);
    }
  };

  const handleStrategyPreset = async (strategy: TradingStrategy, presetId: string) => {
    setBusy(true);
    setError(null);
    try {
      await updateStrategy(strategy.id, {
        defaultRiskPresetId: presetId ? Number(presetId) : null,
      });
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось обновить стратегию'));
    } finally {
      setBusy(false);
    }
  };

  const handleArchiveStrategy = async (strategy: TradingStrategy) => {
    if (strategy.isSystem) return;
    if (!window.confirm(
      `Архивировать стратегию «${strategy.name}»? Открытые сделки сохранят старое имя.`,
    )) return;
    setBusy(true);
    setError(null);
    try {
      await archiveStrategy(strategy.id);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось архивировать стратегию'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-text">Торговые настройки</h2>
        <p className="text-sm text-muted mt-1">
          Пресеты риска (рынок-агностичные) и стратегии. Системные нельзя переименовать или архивировать.
        </p>
      </div>

      {error && (
        <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3 text-sm text-red">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Пресеты риска</h3>
        <ul className="space-y-2">
          {presets.map((p) => (
            <li
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-surface border border-border rounded-lg px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text font-medium">
                  {p.name}
                  {p.isDefault && (
                    <span className="ml-2 text-xs text-blue">default</span>
                  )}
                  {p.isSystem && (
                    <span className="ml-2 text-xs text-muted">system</span>
                  )}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  риск {p.riskPercent}% · ratio {p.ratio} · luft {p.luftPercent}% · sum {p.riskSum}
                </p>
              </div>
              <div className="flex gap-2">
                {!p.isDefault && (
                  <button type="button" className={BTN} disabled={busy} onClick={() => handleSetDefault(p)}>
                    Сделать default
                  </button>
                )}
                {!p.isSystem && (
                  <button type="button" className={BTN_DANGER} disabled={busy} onClick={() => handleArchivePreset(p)}>
                    Архив
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={handleCreatePreset} className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <p className="text-xs text-muted">Новый пресет</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <input
              className={`${INPUT} col-span-2 sm:col-span-3`}
              placeholder="Название"
              value={presetForm.name}
              onChange={(e) => setPresetForm((f) => ({ ...f, name: e.target.value }))}
              required
              maxLength={80}
            />
            <input
              className={INPUT}
              type="number"
              step="any"
              placeholder="Риск %"
              value={presetForm.riskPercent}
              onChange={(e) => setPresetForm((f) => ({ ...f, riskPercent: e.target.value }))}
              required
            />
            <input
              className={INPUT}
              type="number"
              step="any"
              placeholder="Ratio"
              value={presetForm.ratio}
              onChange={(e) => setPresetForm((f) => ({ ...f, ratio: e.target.value }))}
              required
            />
            <input
              className={INPUT}
              type="number"
              step="any"
              placeholder="Luft %"
              value={presetForm.luftPercent}
              onChange={(e) => setPresetForm((f) => ({ ...f, luftPercent: e.target.value }))}
              required
            />
            <input
              className={INPUT}
              type="number"
              step="any"
              placeholder="Risk sum"
              value={presetForm.riskSum}
              onChange={(e) => setPresetForm((f) => ({ ...f, riskSum: e.target.value }))}
              required
            />
            <label className="flex items-center gap-2 text-sm text-muted col-span-2 sm:col-span-1">
              <input
                type="checkbox"
                checked={presetForm.isDefault}
                onChange={(e) => setPresetForm((f) => ({ ...f, isDefault: e.target.checked }))}
              />
              Default
            </label>
          </div>
          <button type="submit" className={BTN} disabled={busy || !presetForm.name.trim()}>
            Добавить пресет
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Стратегии</h3>
        <ul className="space-y-2">
          {strategies.map((s) => (
            <li
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-surface border border-border rounded-lg px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text font-medium">
                  {s.name}
                  {s.isSystem && (
                    <span className="ml-2 text-xs text-muted">system</span>
                  )}
                </p>
              </div>
              <select
                className={`${INPUT} sm:w-48`}
                value={s.defaultRiskPresetId ?? ''}
                disabled={busy}
                onChange={(e) => handleStrategyPreset(s, e.target.value)}
              >
                <option value="">Пресет: user default</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {!s.isSystem && (
                <button type="button" className={BTN_DANGER} disabled={busy} onClick={() => handleArchiveStrategy(s)}>
                  Архив
                </button>
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={handleCreateStrategy} className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <p className="text-xs text-muted">Новая стратегия (создаст группу чеклиста)</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className={INPUT}
              placeholder="Название"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              required
              maxLength={80}
            />
            <select
              className={`${INPUT} sm:w-48`}
              value={strategyPresetId}
              onChange={(e) => setStrategyPresetId(e.target.value)}
            >
              <option value="">Пресет: user default</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button type="submit" className={BTN} disabled={busy || !strategyName.trim()}>
              Добавить
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
