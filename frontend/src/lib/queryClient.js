import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 3 minutes — no refetch within that window
      staleTime: 1000 * 60 * 3,
      // Retry once on failure before showing an error state
      retry: 1,
      // Don't refetch just because the user switched browser tabs
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
