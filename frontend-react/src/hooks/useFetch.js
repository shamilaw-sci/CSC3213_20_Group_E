import { useState, useEffect, useCallback } from 'react';
import api from '../context/api';

/**
 * Generic data-fetching hook.
 *
 * @param {string} url       - API endpoint (relative to api baseURL), e.g. '/favorites'
 * @param {object} [options] - { enabled: true, initialData: null, params: {} }
 * @returns {{ data, loading, error, refetch }}
 *
 * Usage:
 *   const { data: properties, loading, error, refetch } = useFetch('/properties');
 *   const { data: agent } = useFetch(`/agents/${id}`, { enabled: !!id });
 */
export default function useFetch(url, options = {}) {
  const { enabled = true, initialData = null, params = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params: params || undefined });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params)]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
     
  }, [fetchData, enabled]);

  return { data, loading, error, refetch: fetchData, setData };
}
