import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    onSuccess: (newSnippet) => {
      // Invalidate both the project-scoped and global snippet lists
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
    },
  });
}

export function useDeleteSnippet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.delete(`/snippets/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
    },
  });
}
