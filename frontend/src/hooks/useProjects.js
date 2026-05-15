import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects/').then(res => res.data),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/projects/', data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    // PATCH /api/projects/:id/ — send only the fields that changed
    mutationFn: ({ id, ...data }) => api.patch(`/projects/${id}/`, data).then(res => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.delete(`/projects/${id}/`),
    onSuccess: () => {
      // Invalidate the projects list AND any nested per-project query keys.
      // The simplest correct thing is to nuke the whole cache for related queries.
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      queryClient.invalidateQueries({ queryKey: ['devlog'] });
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
    },
  });
}
