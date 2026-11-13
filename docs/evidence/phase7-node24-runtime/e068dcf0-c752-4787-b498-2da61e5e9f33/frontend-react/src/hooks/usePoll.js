import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../context/api';

/**
 * Polling hook — fetches an endpoint repeatedly at a given interval.
 * Automatically cleans up the interval on unmount.
 *
 * @param {string} url            - API endpoint, e.g. '/conversations/unread'
 * @param {number} intervalMs     - Polling interval in milliseconds, e.g. 15000
 * @param {object} [options]      - { enabled: true, initialData: null }
 * @returns {{ data, loading, error }}
 *
 * Usage:
 *   const { data } = usePoll('/conversations/unread', 15000, { enabled: !!user });
 *   // Replaces: useEffect + setInterval + clearInterval boilerplate
 */
export default function usePoll(url, intervalMs, options = {}) {
  const { enabled = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    try {
      const res = await api.get(url);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Polling failed');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) {
      // Clear any existing interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch immediately on mount / enable
    fetchData();

    // Then poll at the given interval
    intervalRef.current = setInterval(fetchData, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData, intervalMs, enabled]);

  return { data, loading, error };
}
