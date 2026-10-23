/** @file useAdmissionDossier.js @description Loads and refreshes private dossier state without stale-response identity changes. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getDossier } from '../services/leadService';

/** Keep mutations serialized and ignore late responses after another dossier opens. */
export default function useAdmissionDossier(id) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const active = useRef(id);
  const pending = useRef(false);
  const refresh = useCallback(async () => {
    const response = await getDossier(id);
    if (active.current === id) setData(response.data.data);
    return response.data.data;
  }, [id]);
  useEffect(() => {
    active.current = id;
    setData(null);
    setError(null);
    refresh().catch((failure) => { if (active.current === id) setError(failure); });
    return () => { active.current = null; };
  }, [id, refresh]);
  const run = useCallback(async (work) => {
    if (pending.current) return null;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await work();
      if (active.current === id) await refresh();
      return response?.data?.data ?? null;
    } catch (failure) {
      if (active.current === id) { setError(failure); await refresh().catch(() => {}); }
      return null;
    } finally {
      pending.current = false;
      if (active.current === id) setBusy(false);
    }
  }, [id, refresh]);
  return { data, busy, error, run, refresh };
}
