import { useState, useEffect } from 'react';
import { fetchDealById } from '../api/deals';
import type { Deal } from '../types';

interface UseDealResult {
  deal: Deal | null;
  loading: boolean;
  error: string | null;
}

export function useDeal(id: number | null): UseDealResult {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) return;

    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchDealById(id)
      .then((res) => {
        if (!cancelled) setDeal(res);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить сделку');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  return { deal, loading, error };
}
