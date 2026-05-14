import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    },
  });
}
