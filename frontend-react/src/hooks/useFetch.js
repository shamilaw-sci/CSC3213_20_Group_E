import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../context/api';

/**
 * Generic data-fetching hook upgraded with TanStack Query.
 * 
 * Backward Compatible API:
 * @param {string} url       - API endpoint (relative to api baseURL), e.g. '/favorites'
 * @param {object} [options] - { enabled: true, initialData: null, params: {} }
 * @returns {{ data, loading, error, refetch, setData }}
 */
export default function useFetch(url, options = {}) {
  const { enabled = true, initialData = null, params = null } = options;
  const queryClient = useQueryClient();

  // Create a stable, unique cache key based on URL and params
  // TanStack Query uses this to cache and deduplicate requests automatically.
  const queryKey = [url, params];

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!url) return null;
      const res = await api.get(url, { params: params || undefined });
      return res.data;
    },
    enabled: Boolean(enabled && url),
    initialData,
    // Cache remains fresh for 1 minute before refetching in background
    staleTime: 60 * 1000, 
  });

  // Extract human-readable error message to maintain backward compatibility
  const errorMessage = error 
    ? (error.response?.data?.message || error.message || 'Something went wrong')
    : null;

  // Provide a manual setData function to mutate cache directly
  // This completely replaces the old `setData` state setter, keeping component logic intact.
  const setData = useCallback((updater) => {
    queryClient.setQueryData(queryKey, updater);
  }, [queryClient, queryKey]);

  return { 
    // Fallback to initialData if data is undefined (just in case)
    data: data !== undefined ? data : initialData, 
    // Use isLoading because we only want a true loading state when the cache is empty.
    // (If we used isFetching, the UI would flicker on background refetches).
    loading: isLoading, 
    error: errorMessage, 
    refetch, 
    setData 
  };
}
