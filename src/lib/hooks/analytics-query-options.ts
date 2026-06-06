'use client';

// staleTime + gcTime give React Query enough cache headroom that hopping
// between tabs no longer triggers a refetch storm. refetchOnMount used to be
// true which forced every Insight render to re-issue 5 endpoints regardless
// of cache freshness — defaulting to React Query's 'always-when-stale'
// behaviour lets the 60s staleness window do its job.
export const analyticsQueryOptions = {
  retry: false,
  staleTime: 60_000,
  gcTime: 10 * 60_000,
  refetchInterval: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
} as const;
