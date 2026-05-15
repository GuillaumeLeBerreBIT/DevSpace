import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/me/').then(res => res.data),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch('/me/', data).then(res => res.data),
    // Optimistically update the cache so the sidebar updates immediately
    onSuccess: (updated) => queryClient.setQueryData(['me'], updated),
  });
}
