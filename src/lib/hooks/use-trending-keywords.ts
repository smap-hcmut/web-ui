/**
 * Trending Keywords Hook
 *
 * React Query hook for fetching keyword rankings and word cloud data
 * from the analytics API.
 */

import { useQuery } from '@tanstack/react-query';

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
  campaign: (campaignId: string, limit?: number) =>
    [...keywordKeys.all, campaignId, { limit }] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchKeywords(campaignId: string, limit = 50): Promise<KeywordsResponse> {
  const params = new URLSearchParams({
    campaignId,
    limit: String(limit),
  });
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
export function useTrendingKeywords(campaignId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: keywordKeys.campaign(campaignId!, limit),
    queryFn: () => fetchKeywords(campaignId!, limit),
    enabled: !!campaignId,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
