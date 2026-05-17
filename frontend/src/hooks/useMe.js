import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated);
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });
}
