import { useCallback, useState, useEffect } from 'react';
import { fetchDealById } from '../api/deals';
import type { Deal, DealComment } from '../types';

interface UseDealResult {
  deal: Deal | null;
  comments: DealComment[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDeal(id: number | null): UseDealResult {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [comments, setComments] = useState<DealComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (id === null) return;

    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchDealById(id)
      .then(({ deal: fetchedDeal, comments: fetchedComments }) => {
        if (!cancelled) {
          setDeal(fetchedDeal);
          setComments(fetchedComments);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить сделку');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, version]);

  return { deal, comments, loading, error, refetch };
}
