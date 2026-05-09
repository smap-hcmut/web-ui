/**
 * Trending Keywords Hook
 *
 * React Query hook for fetching keyword rankings and word cloud data
 * from the analytics API.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getCachedAnalyticsData,
  getCachedAnalyticsUpdatedAt,
  usePersistedAnalyticsCache,
} from './analytics-cache';
import { analyticsQueryOptions } from './analytics-query-options';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KeywordItem {
  text: string;
  volume: number;
  sentiment: number;
  change: number;
}

export interface WordCloudItem {
  text: string;
  value: number;
  color: string;
  opacity: number;
}

export interface KeywordsResponse {
  keywords: KeywordItem[];
  wordCloud: WordCloudItem[];
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const keywordKeys = {
  all: ['analytics', 'keywords'] as const,
  campaign: (campaignId: string, limit?: number, sourceKind = 'all') =>
    [...keywordKeys.all, campaignId, { limit, sourceKind }] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchKeywords(campaignId: string, limit = 50, sourceKind = 'all'): Promise<KeywordsResponse> {
  const params = new URLSearchParams({
    campaignId,
    limit: String(limit),
  });
  if (sourceKind !== 'all') params.set('sourceKind', sourceKind);
  const res = await fetch(`/api/analytics/keywords?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch keywords (${res.status})`);
  }
  return res.json();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetch trending keywords for a campaign.
 *
 * Returns:
 * - keywords: ranked list with text, volume, sentiment, change%
 * - wordCloud: items with text, value, color, opacity (for word cloud visualization)
 */
export function useTrendingKeywords(campaignId: string | undefined, limit = 50, sourceKind = 'all') {
  const queryKey = campaignId
    ? keywordKeys.campaign(campaignId, limit, sourceKind)
    : [...keywordKeys.all, '__pending__', { limit, sourceKind }] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchKeywords(campaignId!, limit, sourceKind),
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
    initialData: campaignId ? getCachedAnalyticsData<KeywordsResponse>(queryKey) : undefined,
    initialDataUpdatedAt: campaignId ? getCachedAnalyticsUpdatedAt(queryKey) : undefined,
    ...analyticsQueryOptions,
  });

  usePersistedAnalyticsCache(queryKey, query.data, query.dataUpdatedAt, !!campaignId);

  return query;
}
