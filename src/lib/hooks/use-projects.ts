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
  type UpdateProjectInput,
} from '../api/projects';
import { datasourceApi } from '../api/datasources';
import { campaignKeys } from './use-campaigns';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const projectKeys = {
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

export function usePauseProject(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.byCampaign(campaignId) });
    },
  });
}

export function useResumeProject(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.byCampaign(campaignId) });
    },
  });
}

export function useActivateProject(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.byCampaign(campaignId) });
    },
  });
}

/**
 * Trigger dryrun for all datasources belonging to a project.
 * Fetches datasources first, then fires dryrun on each in parallel.
 */
export function useDryrunProject() {
  return useMutation({
    mutationFn: async (projectId: string) => {
      const datasources = await datasourceApi.listByProject(projectId);
      if (datasources.length === 0) {
        throw new Error('No datasources found for this project');
      }
      await Promise.all(datasources.map((ds) => datasourceApi.triggerDryrun(ds.id)));
    },
  });
}
