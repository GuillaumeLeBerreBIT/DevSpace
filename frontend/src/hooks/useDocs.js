import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useDocs(projectId) {
  return useQuery({
    queryKey: ['docs', projectId],
    queryFn: () => api.get('/docs/', { params: { project: projectId } }).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useCreateDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/docs/', data).then(res => res.data),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['docs', newDoc.project] });
    },
  });
}

export function useUpdateDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/docs/${id}/`, data).then(res => res.data),
    onSuccess: (updatedDoc) => {
      queryClient.invalidateQueries({ queryKey: ['docs', updatedDoc.project] });
    },
  });
}

export function useDeleteDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }) => api.delete(`/docs/${id}/`),
    onSuccess: (_, variables) => {
      // DELETE returns no body — we get projectId from the variables we passed in
      queryClient.invalidateQueries({ queryKey: ['docs', variables.projectId] });
    },
  });
}
