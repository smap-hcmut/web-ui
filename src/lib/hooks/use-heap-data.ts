/**
 * Heap Data Hook
 *
 * React Query hook for fetching hierarchical tree data for the
 * HeapSpace bubble visualization from the analytics API.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getCachedAnalyticsData,
  getCachedAnalyticsUpdatedAt,
  usePersistedAnalyticsCache,
} from './analytics-cache';
import { analyticsQueryOptions } from './analytics-query-options';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeapNodeMetrics {
  mentions: number;
  engagement: number;
  sentiment: number;
  childCount: number;
}

export interface HeapNode {
  id: string;
  type: 'campaign' | 'project' | 'keyword';
  name: string;
  platform?: string;
  metrics: HeapNodeMetrics;
  children?: HeapNode[];
}

export interface HeapResponse {
  tree: HeapNode | null;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const heapKeys = {
  all: ['analytics', 'heap'] as const,
  campaign: (campaignId: string, sourceKind = 'all') => [...heapKeys.all, campaignId, { sourceKind }] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchHeapData(campaignId: string, sourceKind = 'all'): Promise<HeapResponse> {
  const params = new URLSearchParams({ campaignId });
  if (sourceKind !== 'all') params.set('sourceKind', sourceKind);
  const res = await fetch(`/api/analytics/heap?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch heap data (${res.status})`);
  }
  return res.json();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetch heap tree data for a campaign's HeapSpace visualization.
 *
 * Returns a hierarchical tree: campaign → project → keyword
 * Each node has metrics: mentions, engagement, sentiment, childCount.
 * Returns null tree if no projects exist for the campaign.
 */
export function useHeapData(campaignId: string | undefined, sourceKind = 'all') {
  const queryKey = campaignId
    ? heapKeys.campaign(campaignId, sourceKind)
    : [...heapKeys.all, '__pending__', { sourceKind }] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchHeapData(campaignId!, sourceKind),
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
    initialData: campaignId ? getCachedAnalyticsData<HeapResponse>(queryKey) : undefined,
    initialDataUpdatedAt: campaignId ? getCachedAnalyticsUpdatedAt(queryKey) : undefined,
    ...analyticsQueryOptions,
    staleTime: 2 * 60_000, // heap data is heavier — longer stale time
  });

  usePersistedAnalyticsCache(queryKey, query.data, query.dataUpdatedAt, !!campaignId);

  return query;
}
