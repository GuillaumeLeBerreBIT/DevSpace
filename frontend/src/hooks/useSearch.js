import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

// Debounce the raw input so we don't fire a request on every keystroke.
// Returns the value only after the user stops typing for `delay` ms.
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useSearch(query) {
  const q = useDebounce(query.trim());

  return useQuery({
    queryKey: ['search', q],
    queryFn: () => api.get('/search/', { params: { q } }).then(res => res.data),
    // Don't fetch until there's at least 2 chars — avoids noise on single letters
    enabled: q.length >= 2,
    // Keep previous results visible while the next query is loading (avoids flash of empty)
    placeholderData: (prev) => prev,
  });
}
