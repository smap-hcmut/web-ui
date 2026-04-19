/**
 * Campaign KPIs Hook
 *
 * React Query hook for fetching KPI metrics (mentions, sentiment, engagement, reach)
 * with change%, sparklines, and engagement breakdown from the analytics API.
 */

import { useQuery } from '@tanstack/react-query';

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
  return useQuery({
    queryKey: kpiKeys.campaign(campaignId!),
    queryFn: () => fetchKPIs(campaignId!),
    enabled: !!campaignId,
    staleTime: 60_000, // 1 minute — analytics data doesn't change rapidly
    refetchInterval: 5 * 60_000, // auto-refresh every 5 minutes
  });
}
