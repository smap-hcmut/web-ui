/**
 * Campaigns API
 *
 * Functions for interacting with the project-srv campaign endpoints.
 * Base path: /project/api/v1/campaigns
 */

import { apiClient } from './client';
import { API_CONFIG } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CampaignStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  is_favorite: boolean;
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Paginator {
  page: number;
  limit: number;
  total: number;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  paginator: Paginator;
}

export interface CampaignListParams {
  status?: CampaignStatus;
  name?: string;
  favorite_only?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const campaignApi = {
  list: (params?: CampaignListParams): Promise<CampaignListResponse> =>
    apiClient.get<CampaignListResponse>(
      API_CONFIG.ENDPOINTS.project.campaigns,
      params as Record<string, string | number | boolean | undefined>,
    ),

  get: (id: string): Promise<Campaign> =>
    apiClient.get<Campaign>(API_CONFIG.ENDPOINTS.project.campaign(id)),

  create: (data: CreateCampaignInput): Promise<Campaign> =>
    apiClient.post<Campaign>(API_CONFIG.ENDPOINTS.project.campaigns, data),

  update: (id: string, data: UpdateCampaignInput): Promise<Campaign> =>
    apiClient.put<Campaign>(API_CONFIG.ENDPOINTS.project.campaign(id), data),

  /** Soft-delete (archive) a campaign */
  archive: (id: string): Promise<void> =>
    apiClient.delete<void>(API_CONFIG.ENDPOINTS.project.campaign(id)),

  favorite: (id: string): Promise<void> =>
    apiClient.post<void>(API_CONFIG.ENDPOINTS.project.campaignFavorite(id)),

  unfavorite: (id: string): Promise<void> =>
    apiClient.delete<void>(API_CONFIG.ENDPOINTS.project.campaignFavorite(id)),
};
