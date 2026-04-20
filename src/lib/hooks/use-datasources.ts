/**
 * Datasource & Target Hooks
 *
 * React Query hooks for fetching datasources and crawl targets
 * from ingest-srv. The main hook aggregates targets across all
 * projects in a campaign for the Settings → Targets tab.
 */

import { useQuery } from '@tanstack/react-query';
import {
  datasourceApi,
  type TargetWithSource,
} from '../api/datasources';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const datasourceKeys = {
  all: ['datasources'] as const,
  byProject: (projectId: string) => [...datasourceKeys.all, 'project', projectId] as const,
  targets: (datasourceId: string) => [...datasourceKeys.all, 'targets', datasourceId] as const,
  campaignTargets: (projectIds: string[]) => [...datasourceKeys.all, 'campaign-targets', ...projectIds] as const,
};

// ─── Query Hooks ──────────────────────────────────────────────────────────────

/**
 * Fetch all targets across all projects in a campaign.
 * Pass the project IDs array (from useProjectsByCampaign).
 */
export function useCampaignTargets(projectIds: string[] | undefined) {
  const ids = projectIds ?? [];
  return useQuery<TargetWithSource[]>({
    queryKey: datasourceKeys.campaignTargets(ids),
    queryFn: () => datasourceApi.listAllTargetsForCampaign(ids),
    enabled: ids.length > 0,
    staleTime: 30_000,
  });
}
