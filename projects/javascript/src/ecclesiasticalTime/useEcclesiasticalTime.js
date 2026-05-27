import { useCallback, useEffect, useRef, useState } from 'react';
import { ECCLESIASTICAL_REFRESH_MS } from './constants';
import { getEcclesiasticalTime } from './getEcclesiasticalTime';

export function useEcclesiasticalTime() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    const next = await getEcclesiasticalTime(controller.signal);
    if (!controller.signal.aborted) {
      setResult(next);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const intervalId = window.setInterval(refresh, ECCLESIASTICAL_REFRESH_MS);
    return () => {
      window.clearInterval(intervalId);
      abortRef.current?.abort();
    };
  }, [refresh]);

  return {
    data: result?.data ?? { season: 'Ordinary Time', celebration: '—', color: 'Green' },
    source: result?.source ?? 'fallback',
    loading,
    fetchedAt: result?.fetchedAt ?? null,
    liturgicalDate: result?.liturgicalDate,
    refresh,
  };
}
