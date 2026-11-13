import { useState, useEffect } from 'react';

/**
 * Debounce hook — delays updating a value until the user stops changing it.
 * Useful for search inputs to avoid firing API calls on every keystroke.
 *
 * @param {*} value      - The value to debounce (typically a search string)
 * @param {number} delay - Delay in milliseconds, e.g. 300
 * @returns {*}          - The debounced value
 *
 * Usage:
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *
 *   useEffect(() => {
 *     if (debouncedSearch) fetchResults(debouncedSearch);
 *   }, [debouncedSearch]);
 */
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
