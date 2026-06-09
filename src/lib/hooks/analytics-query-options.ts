'use client';

// staleTime + refetchInterval are tuned so the Insight dashboard tracks
// the backend's 2-min rollup cadence without hammering it. staleTime
// 15 s means a manual refresh always re-fetches; refetchInterval 30 s
// pulls fresh numbers on its own while the tab is open. refetchOnMount
// is back on so reloading the page (or navigating away and back)
// shows the current value — the previous false setting was the visible
// half of the "vẫn 3.2K" bug.
export const analyticsQueryOptions = {
  retry: false,
  staleTime: 15_000,
  gcTime: 10 * 60_000,
  refetchInterval: 30_000,
  refetchOnReconnect: true,
  refetchOnMount: true,
} as const;
