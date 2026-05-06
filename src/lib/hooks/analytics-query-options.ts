'use client';

export const analyticsQueryOptions = {
  retry: false,
  staleTime: 60_000,
  gcTime: 10 * 60_000,
  refetchInterval: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
} as const;
