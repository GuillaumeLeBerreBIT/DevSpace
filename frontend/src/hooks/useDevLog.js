import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../lib/api';

export function useDevLog(projectId) {
  return useQuery({
    queryKey: ['devlog', projectId],
    queryFn: () => api.get('/devlog/', { params: { project: projectId } }).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useCreateDevLogEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/devlog/', data).then(res => res.data),
    onSuccess: (newEntry) => {
      queryClient.invalidateQueries({ queryKey: ['devlog', newEntry.project] });
      toast.success('Entry added');
    },
    onError: () => toast.error('Failed to add entry'),
  });
}

export function useDeleteDevLogEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.delete(`/devlog/${id}/`),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['devlog', projectId] });
      toast.success('Entry deleted');
    },
    onError: () => toast.error('Failed to delete entry'),
  });
}
