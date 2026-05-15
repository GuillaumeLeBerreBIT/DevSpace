import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useEnvVars(projectId) {
  return useQuery({
    queryKey: ['env-vars', projectId],
    queryFn: () => api.get('/env-vars/', { params: { project: projectId } }).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useCreateEnvVar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/env-vars/', data).then(res => res.data),
    onSuccess: (newVar) => {
      queryClient.invalidateQueries({ queryKey: ['env-vars', newVar.project] });
    },
  });
}

export function useUpdateEnvVar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/env-vars/${id}/`, data).then(res => res.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['env-vars', updated.project] });
    },
  });
}

export function useDeleteEnvVar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.delete(`/env-vars/${id}/`),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['env-vars', projectId] });
    },
  });
}

export function useUnlockVault() {
  return useMutation({
    mutationFn: ({ projectId, password }) =>
      api.post(`/projects/${projectId}/unlock-vault/`, { password }).then(res => res.data),
  });
}

export function useSetVaultPassword() {
  return useMutation({
    mutationFn: ({ projectId, password }) =>
      api.post(`/projects/${projectId}/set-vault-password/`, { password }).then(res => res.data),
  });
}
