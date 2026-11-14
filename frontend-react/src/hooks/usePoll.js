import { useState, useEffect } from 'react';
import api from '../context/api';

/** Poll an endpoint; scopeKey isolates results when the signed-in account changes. */
export default function usePoll(url, intervalMs, options = {}) {
  const { enabled = true, initialData = null, scopeKey = null } = options;
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!enabled || !url) return;
    let active = true;
    let pending = false;
    const fetchData = async () => {
      if (pending) return;
      pending = true;
      try {
        const res = await api.get(url);
        if (active) setResult({ url, scopeKey, data: res.data, error: null });
      } catch (err) {
        if (active) setResult({ url, scopeKey, data: null, error: err.response?.data?.message || err.message || 'Polling failed' });
      } finally {
        pending = false;
      }
    };
    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => { active = false; clearInterval(interval); };
  }, [url, intervalMs, enabled, scopeKey]);

  const current = enabled && result?.url === url && result?.scopeKey === scopeKey ? result : null;
  return { data: current?.data ?? initialData, loading: enabled && !current, error: current?.error ?? null };
}
