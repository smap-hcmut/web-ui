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
import { analyticsQueryOptions } from './analytics-query-options';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPIMetric {
  label: string;
  value: number;
  formatted: string;
  change: number;
  sparkline: number[];
  icon: string;
  suffix?: string;
}

interface EngagementBreakdown {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

interface KPIsResponse {
  metrics: KPIMetric[];
  engagement: EngagementBreakdown;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

const kpiKeys = {
  all: ['analytics', 'kpis'] as const,
  campaign: (campaignId: string) => [...kpiKeys.all, campaignId] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchKPIs(campaignId: string): Promise<KPIsResponse> {
  const res = await fetch(`/api/analytics/kpis?campaignId=${encodeURIComponent(campaignId)}`);
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
export function useCampaignKPIs(campaignId: string | undefined) {
  const queryKey = campaignId ? kpiKeys.campaign(campaignId) : [...kpiKeys.all, '__pending__'] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchKPIs(campaignId!),
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
    initialData: campaignId ? getCachedAnalyticsData<KPIsResponse>(queryKey) : undefined,
    initialDataUpdatedAt: campaignId ? getCachedAnalyticsUpdatedAt(queryKey) : undefined,
    ...analyticsQueryOptions,
  });

  usePersistedAnalyticsCache(queryKey, query.data, query.dataUpdatedAt, !!campaignId);

  return query;
}
