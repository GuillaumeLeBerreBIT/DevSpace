import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/').then(res => res.data),
    // Refresh every 2 minutes so sprint countdowns and stats stay current
    refetchInterval: 120_000,
  });
}
