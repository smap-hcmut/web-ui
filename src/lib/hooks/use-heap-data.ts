/**
 * Heap Data Hook
 *
 * React Query hook for fetching hierarchical tree data for the
 * HeapSpace bubble visualization from the analytics API.
 */

import { useQuery } from '@tanstack/react-query';

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
  campaign: (campaignId: string) => [...heapKeys.all, campaignId] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchHeapData(campaignId: string): Promise<HeapResponse> {
  const res = await fetch(`/api/analytics/heap?campaignId=${encodeURIComponent(campaignId)}`);
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
export function useHeapData(campaignId: string | undefined) {
  return useQuery({
    queryKey: heapKeys.campaign(campaignId!),
    queryFn: () => fetchHeapData(campaignId!),
    enabled: !!campaignId,
    staleTime: 2 * 60_000, // heap data is heavier — longer stale time
    refetchInterval: 5 * 60_000,
  });
}
