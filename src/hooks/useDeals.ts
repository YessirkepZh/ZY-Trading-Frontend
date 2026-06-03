import { useState, useEffect } from 'react';
import { fetchDeals } from '../api/deals';
import type { Deal } from '../types';

interface UseDealsParams {
  status?: string;
  strategy?: string;
  marketType?: string;
  page?: number;
  pageSize?: number;
}

interface UseDealsResult {
  deals: Deal[];
  loading: boolean;
  error: string | null;
}

export function useDeals(params: UseDealsParams = {}): UseDealsResult {
  const { status, strategy, marketType, page = 0, pageSize = 20 } = params;
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchDeals({
      status: status || undefined,
      strategy: strategy || undefined,
      marketType: marketType || undefined,
      limit: pageSize,
      offset: page * pageSize,
    })
      .then((res) => {
        if (!cancelled) setDeals(res);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить сделки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [status, strategy, marketType, page, pageSize]);

  return { deals, loading, error };
}
