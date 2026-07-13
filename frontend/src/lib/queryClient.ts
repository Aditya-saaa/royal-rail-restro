import { QueryClient } from '@tanstack/react-query';

/** Shared QueryClient — tuned for cold starts + warm cache. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000, // 2 min
      gcTime: 30 * 60_000, // 30 min cache
      retry: (failureCount, error) => {
        // Retry more on network/cold-start (Render free tier wake)
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
