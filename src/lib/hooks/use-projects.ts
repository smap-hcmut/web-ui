/**
 * Project Hooks
 *
 * React Query hooks for project CRUD under a campaign.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  projectApi,
  type Project,
  type CreateProjectInput,
} from '../api/projects';
import { campaignKeys } from './use-campaigns';

// ─── Query Keys ───────────────────────────────────────────────────────────────

const projectKeys = {
  all: ['projects'] as const,
  byCampaign: (campaignId: string) => [...projectKeys.all, 'campaign', campaignId] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

// ─── Query Hooks ──────────────────────────────────────────────────────────────

/**
 * Fetch all projects for a given campaign.
 */
export function useProjectsByCampaign(campaignId: string | null | undefined) {
  return useQuery<Project[]>({
    queryKey: projectKeys.byCampaign(campaignId!),
    queryFn: () => projectApi.listByCampaign(campaignId!),
    enabled: !!campaignId,
    staleTime: 30_000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

export function useCreateProject(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectInput) => projectApi.create(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.byCampaign(campaignId) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}
