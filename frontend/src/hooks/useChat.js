import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Conversations (CRUD) ────────────────────────────────────────────────────

export function useConversations(projectId) {
  return useQuery({
    queryKey: ['conversations', projectId],
    queryFn: () => api.get('/conversations/', { params: { project: projectId } }).then(r => r.data),
    enabled: !!projectId,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, title }) =>
      api.post('/conversations/', { project: projectId, title: title || 'New chat' }).then(r => r.data),
    onSuccess: (conv) => qc.invalidateQueries({ queryKey: ['conversations', conv.project] }),
  });
}

export function useRenameConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }) => api.patch(`/conversations/${id}/`, { title }).then(r => r.data),
    onSuccess: (conv) => qc.invalidateQueries({ queryKey: ['conversations', conv.project] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.delete(`/conversations/${id}/`),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
  });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function useMessages(conversationId) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.get(`/conversations/${conversationId}/messages/`).then(r => r.data),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }) =>
      api.post(`/conversations/${conversationId}/messages/`, { content }).then(r => r.data),
    onSuccess: (data, { conversationId }) => {
      // Append both the user and assistant messages to the cache without refetching
      qc.setQueryData(['messages', conversationId], (prev = []) => [...prev, data.user, data.assistant]);
      // Conversation's updated_at changed → resort the sidebar
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// POST /api/conversations/:conv/messages/:msg/apply/
// Executes queued mutations. We then invalidate every domain that could have
// been touched so the project UI updates immediately.
export function useApplyMutations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId }) =>
      api.post(`/conversations/${conversationId}/messages/${messageId}/apply/`).then(r => r.data),
    onSuccess: (data, { conversationId }) => {
      // Replace the message in the messages cache with the new state (applied_at set, pending cleared)
      if (data.message) {
        qc.setQueryData(['messages', conversationId], (prev = []) =>
          prev.map(m => m.id === data.message.id ? data.message : m)
        );
      }
      // The agent might have touched any of these — invalidate by prefix
      ['tasks', 'sprints', 'devlog', 'snippets', 'docs', 'dashboard'].forEach(key =>
        qc.invalidateQueries({ queryKey: [key] })
      );
    },
  });
}

export function useDiscardMutations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId }) =>
      api.post(`/conversations/${conversationId}/messages/${messageId}/discard/`).then(r => r.data),
    onSuccess: (_, { conversationId, messageId }) => {
      // Clear pending_mutations on the cached message
      qc.setQueryData(['messages', conversationId], (prev = []) =>
        prev.map(m => m.id === messageId ? { ...m, pending_mutations: [] } : m)
      );
    },
  });
}
