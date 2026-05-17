import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../lib/api';

export function useSnippets(projectId) {
  return useQuery({
    queryKey: ['snippets', projectId ?? 'all'],
    queryFn: () =>
      api.get('/snippets/', { params: projectId ? { project: projectId } : {} }).then(res => res.data),
  });
}

export function useCreateSnippet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/snippets/', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      toast.success('Snippet created');
    },
    onError: () => toast.error('Failed to create snippet'),
  });
}

export function useDeleteSnippet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.delete(`/snippets/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      toast.success('Snippet deleted');
    },
    onError: () => toast.error('Failed to delete snippet'),
  });
}
