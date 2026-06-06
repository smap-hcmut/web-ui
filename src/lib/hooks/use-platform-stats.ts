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
import {
  analyticsScopeKey,
  appendAnalyticsScope,
  type AnalyticsScopeParams,
} from './analytics-scope';
import { analyticsQueryOptions } from './analytics-query-options';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformStat {
  platform: string;
  name: string;
  mentions: number;
  mentionsChange: number;
  mentionsChangeReliable?: boolean;
  mentionsCurrentPeriod?: number;
  mentionsPreviousPeriod?: number;
  engagement: string;
  engagementRaw: number;
  sentiment: number;
  reach: number;
  status: 'active' | 'inactive';
  color: string;
}

interface PlatformTimeSeries {
  label: string;
  data: number[];
  color: string;
}

interface PlatformStatsResponse {
  stats: PlatformStat[];
  timeSeries: PlatformTimeSeries[];
  months: string[];
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

const platformKeys = {
  all: ['analytics', 'platforms'] as const,
  campaign: (campaignId: string, scope?: AnalyticsScopeParams | string) =>
    [...platformKeys.all, campaignId, analyticsScopeKey(scope)] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchPlatformStats(campaignId: string, scope?: AnalyticsScopeParams | string): Promise<PlatformStatsResponse> {
  const params = new URLSearchParams({ campaignId });
  appendAnalyticsScope(params, scope);
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
export function usePlatformStats(campaignId: string | undefined, scope?: AnalyticsScopeParams | string) {
  const scopeKey = analyticsScopeKey(scope);
  const queryKey = campaignId
    ? platformKeys.campaign(campaignId, scope)
    : [...platformKeys.all, '__pending__', scopeKey] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchPlatformStats(campaignId!, scope),
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
    initialData: campaignId ? getCachedAnalyticsData<PlatformStatsResponse>(queryKey) : undefined,
    initialDataUpdatedAt: campaignId ? getCachedAnalyticsUpdatedAt(queryKey) : undefined,
    ...analyticsQueryOptions,
  });

  usePersistedAnalyticsCache(queryKey, query.data, query.dataUpdatedAt, !!campaignId);

  return query;
}
