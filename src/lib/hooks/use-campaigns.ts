/**
 * Campaign Hooks
 *
 * React Query hooks for campaign CRUD and favorites.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  campaignApi,
  type Campaign,
  type CampaignListResponse,
  type CampaignListParams,
} from '../api/campaigns';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (params?: CampaignListParams) => [...campaignKeys.lists(), params] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
};

// ─── Query Hooks ──────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of campaigns.
 * Filtering by status and name is done server-side.
 */
export function useCampaigns(params?: CampaignListParams) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignApi.list(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch a single campaign by ID.
 */
export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

export function useStopCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    // "Stop-all" in the UI is expected to pause execution and stop crawl jobs,
    // not remove campaign metadata. Keep behavior aligned with backend pause.
    mutationFn: (id: string) => campaignApi.pause(id),
    onSuccess: (_, id) => {
      updateCampaignStatus(queryClient, id, 'PAUSED');
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.details() });
    },
  });
}

function updateCampaignStatus(queryClient: ReturnType<typeof useQueryClient>, id: string, status: Campaign['status']) {
  queryClient.setQueriesData<CampaignListResponse>({ queryKey: campaignKeys.lists() }, (old) => {
    if (!old) return old;
    return {
      ...old,
      campaigns: old.campaigns.map((campaign) =>
        campaign.id === id ? { ...campaign, status } : campaign,
      ),
    };
  });

  queryClient.setQueryData<Campaign>(campaignKeys.detail(id), (old) =>
    old ? { ...old, status } : old,
  );
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignApi.pause(id),
    onSuccess: (_, id) => {
      updateCampaignStatus(queryClient, id, 'PAUSED');
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignApi.resume(id),
    onSuccess: (_, id) => {
      updateCampaignStatus(queryClient, id, 'ACTIVE');
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}
