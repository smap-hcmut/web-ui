/**
 * Platform Stats Hook
 *
 * React Query hook for fetching per-platform breakdown (mentions, engagement,
 * sentiment, reach) and 12-month time-series data from the analytics API.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getCachedAnalyticsData,
  getCachedAnalyticsUpdatedAt,
  usePersistedAnalyticsCache,
} from './analytics-cache';
import { analyticsQueryOptions } from './analytics-query-options';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformStat {
  platform: string;
  name: string;
  mentions: number;
  mentionsChange: number;
  engagement: string;
  engagementRaw: number;
  sentiment: number;
  reach: number;
  status: 'active' | 'inactive';
  color: string;
}

export interface PlatformTimeSeries {
  label: string;
  data: number[];
  color: string;
}

export interface PlatformStatsResponse {
  stats: PlatformStat[];
  timeSeries: PlatformTimeSeries[];
  months: string[];
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const platformKeys = {
  all: ['analytics', 'platforms'] as const,
  campaign: (campaignId: string, sourceKind = 'all') => [...platformKeys.all, campaignId, { sourceKind }] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchPlatformStats(campaignId: string, sourceKind = 'all'): Promise<PlatformStatsResponse> {
  const params = new URLSearchParams({ campaignId });
  if (sourceKind !== 'all') params.set('sourceKind', sourceKind);
  const res = await fetch(`/api/analytics/platforms?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch platform stats (${res.status})`);
  }
  return res.json();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetch per-platform breakdown and time-series for a campaign.
 *
 * Returns:
 * - stats: per-platform row (mentions, engagement, sentiment, reach, color)
 * - timeSeries: 12-month mentions per platform (for line/bar chart)
 * - months: month labels (YYYY-MM)
 */
export function usePlatformStats(campaignId: string | undefined, sourceKind = 'all') {
  const queryKey = campaignId
    ? platformKeys.campaign(campaignId, sourceKind)
    : [...platformKeys.all, '__pending__', { sourceKind }] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchPlatformStats(campaignId!, sourceKind),
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
    initialData: campaignId ? getCachedAnalyticsData<PlatformStatsResponse>(queryKey) : undefined,
    initialDataUpdatedAt: campaignId ? getCachedAnalyticsUpdatedAt(queryKey) : undefined,
    ...analyticsQueryOptions,
  });

  usePersistedAnalyticsCache(queryKey, query.data, query.dataUpdatedAt, !!campaignId);

  return query;
}
