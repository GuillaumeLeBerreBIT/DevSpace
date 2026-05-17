import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
      queryClient.invalidateQueries({ queryKey: ['tasks', newTask.project] });
      toast.success('Task created');
    },
    onError: () => toast.error('Failed to create task'),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/tasks/${id}/`, data).then(res => res.data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', updatedTask.project] });
    },
    onError: () => toast.error('Failed to save task'),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.delete(`/tasks/${id}/`),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task deleted');
    },
    onError: () => toast.error('Failed to delete task'),
  });
}
