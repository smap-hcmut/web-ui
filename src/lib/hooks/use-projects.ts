/**
 * Project Hooks
 *
 * React Query hooks for project CRUD under a campaign.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  projectApi,
  type Project,
  type ProjectStatus,
  type ProjectDomain,
  type CreateProjectInput,
} from '../api/projects';
import { datasourceApi } from '../api/datasources';
import { campaignKeys } from './use-campaigns';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const projectKeys = {
  all: ['projects'] as const,
  domains: () => [...projectKeys.all, 'domains'] as const,
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

export function useProjectDomains() {
  return useQuery<ProjectDomain[]>({
    queryKey: projectKeys.domains(),
    queryFn: () => projectApi.listDomains(),
    staleTime: 5 * 60_000,
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
    onSuccess: (project) => {
      updateProjectCache(queryClient, campaignId, project);
    },
  });
}

export function useResumeProject(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.resume(id),
    onSuccess: (project) => {
      updateProjectCache(queryClient, campaignId, project);
    },
  });
}

export function useActivateProject(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.activate(id),
    onSuccess: (project) => {
      updateProjectCache(queryClient, campaignId, project);
    },
  });
}

export function useArchiveProject(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.archive(id),
    onSuccess: (project) => {
      updateProjectCache(queryClient, campaignId, project);
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

export function useUnarchiveProject(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.unarchive(id),
    onSuccess: (project) => {
      updateProjectCache(queryClient, campaignId, project);
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

function updateProjectCache(
  queryClient: ReturnType<typeof useQueryClient>,
  campaignId: string,
  project: Project,
) {
  queryClient.setQueryData<Project[]>(projectKeys.byCampaign(campaignId), (old) => {
    if (!old) return old;
    return old.map((item) => (item.id === project.id ? project : item));
  });
  queryClient.setQueryData<Project>(projectKeys.detail(project.id), project);
}

export function projectStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'PAUSED':
      return 'Paused';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return 'Pending';
  }
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
