/**
 * Projects API
 *
 * Functions for interacting with the project-srv project endpoints.
 * Create: POST /project/api/v1/campaigns/{campaign_id}/projects
 * Update: PUT  /project/api/v1/projects/{id}
 */

import { apiClient } from './client';
import { API_CONFIG } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type EntityType = 'product' | 'campaign' | 'service' | 'competitor' | 'topic';

export interface Project {
  id: string;
  campaign_id: string;
  name: string;
  description: string;
  brand?: string;
  entity_type: EntityType;
  entity_name: string;
  domain_type_code?: string;
  status: ProjectStatus;
  is_favorite: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  brand?: string;
  entity_type: EntityType;
  entity_name: string;
  domain_type_code?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  brand?: string;
  entity_type?: EntityType;
  entity_name?: string;
  domain_type_code?: string;
}

// ─── Paginated Response (from Go backend) ────────────────────────────────────

interface PaginatedProjectsResponse {
  projects: Project[];
  paginator?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const projectApi = {
  /** List projects under a campaign */
  listByCampaign: async (campaignId: string): Promise<Project[]> => {
    // The API returns { projects: [...], paginator: {...} }
    // handleResponse won't unwrap it (2 keys), so we extract manually
    const resp = await apiClient.get<PaginatedProjectsResponse | Project[]>(
      API_CONFIG.ENDPOINTS.project.campaignProjects(campaignId),
    );
    // If already an array (unlikely but defensive), return as-is
    if (Array.isArray(resp)) return resp;
    // Unwrap the paginated response
    return resp.projects ?? [];
  },

  /** Get a single project */
  get: (id: string): Promise<Project> =>
    apiClient.get<Project>(API_CONFIG.ENDPOINTS.project.project(id)),

  /** Create a project under a campaign */
  create: (campaignId: string, data: CreateProjectInput): Promise<Project> =>
    apiClient.post<Project>(API_CONFIG.ENDPOINTS.project.campaignProjects(campaignId), data),

  /** Update a project */
  update: (id: string, data: UpdateProjectInput): Promise<Project> =>
    apiClient.put<Project>(API_CONFIG.ENDPOINTS.project.project(id), data),

  /** Archive a project */
  archive: (id: string): Promise<void> =>
    apiClient.delete<void>(API_CONFIG.ENDPOINTS.project.project(id)),
};
