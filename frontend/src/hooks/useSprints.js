import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      // Invalidate only this project's sprint list, not all sprint cache entries
      queryClient.invalidateQueries({ queryKey: ['sprints', newSprint.project] });
    },
  });
}
