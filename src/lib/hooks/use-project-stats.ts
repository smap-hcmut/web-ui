/**
 * Project Stats Hook
 *
 * React Query hook for fetching per-project analytics
 * (mention count, avg sentiment, platforms) from the Metabase-backed API.
 */

import { useQuery } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectStat {
  project_id: string;
  mentions: number;
  avg_sentiment: number;
  platforms: string[];
}

export interface ProjectStatsResponse {
  stats: ProjectStat[];
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const projectStatsKeys = {
  all: ['analytics', 'project-stats'] as const,
  campaign: (campaignId: string) => [...projectStatsKeys.all, campaignId] as const,
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchProjectStats(campaignId: string): Promise<ProjectStatsResponse> {
  const res = await fetch(`/api/analytics/project-stats?campaignId=${encodeURIComponent(campaignId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch project stats (${res.status})`);
  }
  return res.json();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetch per-project analytics for all projects in a campaign.
 *
 * Returns an array of { project_id, mentions, avg_sentiment, platforms }
 * used by ProjectCardsRow to populate flip cards with real data.
 */
export function useProjectStats(campaignId: string | undefined) {
  return useQuery({
    queryKey: projectStatsKeys.campaign(campaignId!),
    queryFn: () => fetchProjectStats(campaignId!),
    enabled: !!campaignId,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
