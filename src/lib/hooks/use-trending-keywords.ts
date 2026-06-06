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
import {
  analyticsScopeKey,
  appendAnalyticsScope,
  type AnalyticsScopeParams,
} from './analytics-scope';
import { analyticsQueryOptions } from './analytics-query-options';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeywordItem {
  text: string;
  volume: number;
  sentiment: number;
  change: number;
}

interface WordCloudItem {
  text: string;
  value: number;
  color: string;
  opacity: number;
}

interface KeywordsResponse {
  keywords: KeywordItem[];
  wordCloud: WordCloudItem[];
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

const keywordKeys = {
  all: ['analytics', 'keywords'] as const,
  campaign: (campaignId: string, limit?: number, scope?: AnalyticsScopeParams | string) =>
    [...keywordKeys.all, campaignId, { limit, ...analyticsScopeKey(scope) }] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchKeywords(
  campaignId: string,
  limit = 50,
  scope?: AnalyticsScopeParams | string,
): Promise<KeywordsResponse> {
  const params = new URLSearchParams({
    campaignId,
    limit: String(limit),
  });
  appendAnalyticsScope(params, scope);
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
export function useTrendingKeywords(
  campaignId: string | undefined,
  limit = 50,
  scope?: AnalyticsScopeParams | string,
) {
  const scopeKey = analyticsScopeKey(scope);
  const queryKey = campaignId
    ? keywordKeys.campaign(campaignId, limit, scope)
    : [...keywordKeys.all, '__pending__', { limit, ...scopeKey }] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchKeywords(campaignId!, limit, scope),
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
    initialData: campaignId ? getCachedAnalyticsData<KeywordsResponse>(queryKey) : undefined,
    initialDataUpdatedAt: campaignId ? getCachedAnalyticsUpdatedAt(queryKey) : undefined,
    ...analyticsQueryOptions,
  });

  usePersistedAnalyticsCache(queryKey, query.data, query.dataUpdatedAt, !!campaignId);

  return query;
}
