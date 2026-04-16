/**
 * Project Hooks
 *
 * React Query hooks for project CRUD under a campaign.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  projectApi,
  type CreateProjectInput,
} from '../api/projects';
import { campaignKeys } from './use-campaigns';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const projectKeys = {
  all: ['projects'] as const,
  byCampaign: (campaignId: string) => [...projectKeys.all, 'campaign', campaignId] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

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
