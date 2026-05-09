/**
 * Sentiment Data Hook
 *
 * React Query hook for fetching sentiment analysis data:
 * donut chart, timeline, pulse score from the analytics API.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getCachedAnalyticsData,
  getCachedAnalyticsUpdatedAt,
  usePersistedAnalyticsCache,
} from './analytics-cache';
import { analyticsQueryOptions } from './analytics-query-options';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SentimentDonutItem {
  label: string;
  value: number;
  color: string;
}

export interface SentimentTimelineSeries {
  label: string;
  color: string;
  data: number[];
}

export interface SentimentResponse {
  donut: SentimentDonutItem[];
  timeline: SentimentTimelineSeries[];
  months: string[];
  pulse: number;
  total: number;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const sentimentKeys = {
  all: ['analytics', 'sentiment'] as const,
  campaign: (campaignId: string, sourceKind = 'all') => [...sentimentKeys.all, campaignId, { sourceKind }] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchSentiment(campaignId: string, sourceKind = 'all'): Promise<SentimentResponse> {
  const params = new URLSearchParams({ campaignId });
  if (sourceKind !== 'all') params.set('sourceKind', sourceKind);
  const res = await fetch(`/api/analytics/sentiment?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch sentiment data (${res.status})`);
  }
  return res.json();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetch sentiment analysis data for a campaign.
 *
 * Returns:
 * - donut: positive/neutral/negative counts (for donut chart)
 * - timeline: monthly avg sentiment per platform (for line chart)
 * - months: month labels
 * - pulse: overall sentiment score (0-100)
 * - total: total posts analyzed
 */
export function useSentimentData(campaignId: string | undefined, sourceKind = 'all') {
  const queryKey = campaignId
    ? sentimentKeys.campaign(campaignId, sourceKind)
    : [...sentimentKeys.all, '__pending__', { sourceKind }] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchSentiment(campaignId!, sourceKind),
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
    initialData: campaignId ? getCachedAnalyticsData<SentimentResponse>(queryKey) : undefined,
    initialDataUpdatedAt: campaignId ? getCachedAnalyticsUpdatedAt(queryKey) : undefined,
    ...analyticsQueryOptions,
  });

  usePersistedAnalyticsCache(queryKey, query.data, query.dataUpdatedAt, !!campaignId);

  return query;
}
