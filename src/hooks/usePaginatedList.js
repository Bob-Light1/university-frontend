import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic paginated-list hook.
 *
 * @param {(page: number) => Promise} fetcher  — stable callback (wrap in useCallback).
 *   Expected response shape: res.data?.data (array) + res.data?.pagination?.total (number).
 * @returns {{ items, total, page, setPage, loading, error, refresh }}
 */
export default function usePaginatedList(fetcher) {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tick,    setTick]    = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Reset to page 1 when fetcher reference changes (i.e. filters changed)
  const prevFetcherRef = useRef(fetcher);
  useEffect(() => {
    if (prevFetcherRef.current !== fetcher) {
      prevFetcherRef.current = fetcher;
      setPage(1);
    }
  }, [fetcher]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcherRef.current(page)
      .then((res) => {
        if (cancelled) return;
        setItems(res.data?.data ?? []);
        setTotal(res.data?.pagination?.total ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Failed to load data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, fetcher, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { items, total, page, setPage, loading, error, refresh };
}
