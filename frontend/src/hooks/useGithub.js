import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// GET /api/github/account/ — { connected, github_username?, connected_at?, last_validated_at? }
export function useGithubAccount() {
  return useQuery({
    queryKey: ['github', 'account'],
    queryFn: () => api.get('/github/account/').then(res => res.data),
    // Don't keep retrying if the user hasn't connected yet — empty state is the answer.
    retry: false,
  });
}

// POST /api/github/account/ — body: { token }
export function useConnectGithub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token) => api.post('/github/account/', { token }).then(res => res.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['github', 'account'], data);
      // New connection means the user's repo list is now available — bust any cache
      queryClient.invalidateQueries({ queryKey: ['github', 'repos'] });
    },
  });
}

// DELETE /api/github/account/
export function useDisconnectGithub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/github/account/'),
    onSuccess: () => {
      queryClient.setQueryData(['github', 'account'], { connected: false });
      queryClient.removeQueries({ queryKey: ['github', 'repos'] });
    },
  });
}

// GET /api/github/repos/ — only enabled once the user has connected
export function useGithubRepos(enabled = true) {
  return useQuery({
    queryKey: ['github', 'repos'],
    queryFn: () => api.get('/github/repos/').then(res => res.data),
    enabled,
    // Repos rarely change during a session — keep them fresh for 5 min
    staleTime: 5 * 60 * 1000,
  });
}
