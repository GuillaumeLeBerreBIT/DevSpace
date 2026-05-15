import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useTasks(projectId, sprintId) {
  return useQuery({
    queryKey: ['tasks', projectId, sprintId],
    queryFn: () =>
      api.get('/tasks/', { params: { project: projectId, sprint: sprintId } }).then(res => res.data),
    enabled: !!projectId && !!sprintId,
  });
}

export function useBacklog(projectId) {
  return useQuery({
    queryKey: ['tasks', projectId, 'backlog'],
    queryFn: () =>
      api.get('/tasks/', { params: { project: projectId, sprint: 'null' } }).then(res => res.data),
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/tasks/', data).then(res => res.data),
    onSuccess: (newTask) => {
      // Invalidate all task-related cache entries for this project
      // — the new task could appear in the sprint view, backlog, or bug tracker
      queryClient.invalidateQueries({ queryKey: ['tasks', newTask.project] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/tasks/${id}/`, data).then(res => res.data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', updatedTask.project] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    // DELETE returns 204 No Content, so we pass projectId separately for cache invalidation
    mutationFn: ({ id }) => api.delete(`/tasks/${id}/`),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}
