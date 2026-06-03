import { useState, useEffect } from 'react';
import { fetchDashboard } from '../api/deals';
import type { DashboardStats } from '../types';

interface UseDashboardResult {
  data: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchDashboard()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить данные дашборда');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
