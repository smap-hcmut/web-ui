/**
 * Campaign KPIs Hook
 *
 * React Query hook for fetching KPI metrics (mentions, sentiment, engagement, reach)
 * with change%, sparklines, and engagement breakdown from the analytics API.
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

export interface KPIMetric {
  label: string;
  value: number;
  formatted: string;
  change: number;
  sparkline: number[];
  icon: string;
  suffix?: string;
}

export interface EngagementBreakdown {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface KPIsResponse {
  metrics: KPIMetric[];
  engagement: EngagementBreakdown;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const kpiKeys = {
  all: ['analytics', 'kpis'] as const,
  campaign: (campaignId: string, scope?: AnalyticsScopeParams | string) =>
    [...kpiKeys.all, campaignId, analyticsScopeKey(scope)] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchKPIs(campaignId: string, scope?: AnalyticsScopeParams | string): Promise<KPIsResponse> {
  const params = new URLSearchParams({ campaignId });
  appendAnalyticsScope(params, scope);
  const res = await fetch(`/api/analytics/kpis?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch KPIs (${res.status})`);
  }
  return res.json();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetch KPI metrics for a campaign.
 *
 * Returns 4 metric cards (Total Mentions, Sentiment Score, Engagement, Audience Reach)
 * each with value, formatted string, change%, and 12-point sparkline.
 * Also returns engagement breakdown (views, likes, comments, shares).
 */
export function useCampaignKPIs(campaignId: string | undefined, scope?: AnalyticsScopeParams | string) {
  const scopeKey = analyticsScopeKey(scope);
  const queryKey = campaignId
    ? kpiKeys.campaign(campaignId, scope)
    : [...kpiKeys.all, '__pending__', scopeKey] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchKPIs(campaignId!, scope),
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
    initialData: campaignId ? getCachedAnalyticsData<KPIsResponse>(queryKey) : undefined,
    initialDataUpdatedAt: campaignId ? getCachedAnalyticsUpdatedAt(queryKey) : undefined,
    ...analyticsQueryOptions,
  });

  usePersistedAnalyticsCache(queryKey, query.data, query.dataUpdatedAt, !!campaignId);

  return query;
}
