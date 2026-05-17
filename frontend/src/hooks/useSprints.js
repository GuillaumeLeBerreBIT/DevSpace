import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../lib/api';

export function useSprints(projectId) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => api.get('/sprints/', { params: { project: projectId } }).then(res => res.data),
    // Don't fetch until we have a projectId — avoids a request with undefined in the URL
    enabled: !!projectId,
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/sprints/', data).then(res => res.data),
    onSuccess: (newSprint) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', newSprint.project] });
      toast.success('Sprint created');
    },
    onError: () => toast.error('Failed to create sprint'),
  });
}

export function useUpdateSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/sprints/${id}/`, data).then(res => res.data),
    onSuccess: (updatedSprint) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', updatedSprint.project] });
    },
    onError: () => toast.error('Failed to save sprint'),
  });
}
