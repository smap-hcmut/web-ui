/**
 * Datasources & Targets API
 *
 * Functions for interacting with the ingest-srv datasource + target endpoints.
 * List datasources: GET /ingest/api/v1/datasources?project_id=xxx
 * List targets:     GET /ingest/api/v1/datasources/{id}/targets
 */

import { apiClient } from './client';
import { API_CONFIG } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SourceType = 'TIKTOK' | 'FACEBOOK' | 'YOUTUBE';
export type SourceCategory = 'CRAWL' | 'PASSIVE';
export type CrawlMode = 'SLEEP' | 'NORMAL' | 'CRISIS';
export type DataSourceStatus = 'PENDING' | 'READY' | 'ACTIVE' | 'PAUSED' | 'FAILED' | 'COMPLETED' | 'ARCHIVED';
export type TargetType = 'KEYWORD' | 'PROFILE' | 'POST_URL';
export type DryrunStatus = 'NOT_REQUIRED' | 'PENDING' | 'RUNNING' | 'SUCCESS' | 'WARNING' | 'FAILED';

export interface DataSource {
  id: string;
  name: string;
  source_type: SourceType;
  source_category?: SourceCategory;
  crawl_mode: CrawlMode;
  crawl_interval_minutes?: number;
  status: DataSourceStatus;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface CrawlTarget {
  id: string;
  data_source_id: string;
  target_type: TargetType;
  values: string[];
  label: string;
  platform_meta?: Record<string, unknown>;
  is_active: boolean;
  crawl_interval_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DryrunResult {
  id: string;
  source_id: string;
  project_id: string;
  target_id: string;
  job_id: string;
  status: DryrunStatus;
  sample_count: number;
  total_found: number | null;
  sample_data: unknown | null;
  warnings: string[] | null;
  error_message: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/** Flattened target with datasource info for UI display */
export interface TargetWithSource extends CrawlTarget {
  source_type: SourceType;
  project_id?: string;
  project_name?: string;
  datasource_name: string;
  datasource_status?: DataSourceStatus;
}

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateDataSourceInput {
  project_id: string;
  name: string;
  description?: string;
  source_type: SourceType;
  source_category?: SourceCategory;
  crawl_mode: CrawlMode;
  crawl_interval_minutes: number;
}

export interface CreateKeywordTargetInput {
  values: string[];
  label?: string;
  platform_meta?: Record<string, unknown>;
  crawl_interval_minutes: number;
  priority?: number;
}

export interface CreateProfileTargetInput {
  values: string[];
  label?: string;
  platform_meta?: Record<string, unknown>;
  crawl_interval_minutes: number;
  priority?: number;
}

export interface TriggerDryrunInput {
  target_id?: string;
  sample_limit?: number;
  force?: boolean;
}

// ─── Paginated Responses (from Go backend) ────────────────────────────────────

interface PaginatedDataSourcesResponse {
  data_sources: DataSource[];
  paginator?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface TargetsResponse {
  targets: CrawlTarget[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const datasourceApi = {
  /** List datasources for a project */
  listByProject: async (projectId: string): Promise<DataSource[]> => {
    const resp = await apiClient.get<PaginatedDataSourcesResponse | DataSource[]>(
      API_CONFIG.ENDPOINTS.ingest.datasources,
      { project_id: projectId },
    );
    if (Array.isArray(resp)) return resp;
    return resp.data_sources ?? [];
  },

  /** List targets for a datasource */
  listTargets: async (datasourceId: string): Promise<CrawlTarget[]> => {
    const resp = await apiClient.get<TargetsResponse | CrawlTarget[]>(
      API_CONFIG.ENDPOINTS.ingest.datasourceTargets(datasourceId),
    );
    if (Array.isArray(resp)) return resp;
    return resp.targets ?? [];
  },

  /**
   * Get all targets across all projects in a campaign.
   * Campaign → projects → datasources → targets (flattened)
   */
  listAllTargetsForCampaign: async (projectIds: string[]): Promise<TargetWithSource[]> => {
    if (projectIds.length === 0) return [];

    // 1. Fetch datasources for all projects in parallel
    const dsArrays = await Promise.all(
      projectIds.map((pid) => datasourceApi.listByProject(pid)),
    );
    const allDatasources = dsArrays.flat();

    if (allDatasources.length === 0) return [];

    // 2. Fetch targets for all datasources in parallel
    const targetArrays = await Promise.all(
      allDatasources.map((ds) => datasourceApi.listTargets(ds.id)),
    );

    // 3. Flatten and attach source info
    const result: TargetWithSource[] = [];
    allDatasources.forEach((ds, i) => {
      const targets = targetArrays[i];
      for (const t of targets) {
        result.push({
          ...t,
          source_type: ds.source_type,
          project_id: ds.project_id,
          datasource_name: ds.name,
          datasource_status: ds.status,
        });
      }
    });

    return result;
  },

  /** Create a new datasource for a project */
  create: (data: CreateDataSourceInput): Promise<DataSource> =>
    apiClient.post<DataSource>(API_CONFIG.ENDPOINTS.ingest.datasources, data),

  activate: (id: string): Promise<DataSource> =>
    apiClient.post<DataSource>(API_CONFIG.ENDPOINTS.ingest.datasourceActivate(id)),

  pause: (id: string): Promise<DataSource> =>
    apiClient.post<DataSource>(API_CONFIG.ENDPOINTS.ingest.datasourcePause(id)),

  resume: (id: string): Promise<DataSource> =>
    apiClient.post<DataSource>(API_CONFIG.ENDPOINTS.ingest.datasourceResume(id)),

  /** Add keyword targets to a datasource */
  createKeywordTarget: (datasourceId: string, data: CreateKeywordTargetInput): Promise<CrawlTarget> =>
    apiClient.post<CrawlTarget>(API_CONFIG.ENDPOINTS.ingest.datasourceTargetKeywords(datasourceId), data),

  /** Add profile/page targets to a datasource */
  createProfileTarget: (datasourceId: string, data: CreateProfileTargetInput): Promise<CrawlTarget> =>
    apiClient.post<CrawlTarget>(API_CONFIG.ENDPOINTS.ingest.datasourceTargetProfiles(datasourceId), data),

  /** Activate a single crawl target */
  activateTarget: (datasourceId: string, targetId: string): Promise<CrawlTarget> =>
    apiClient.post<CrawlTarget>(API_CONFIG.ENDPOINTS.ingest.datasourceActivateTarget(datasourceId, targetId)),

  /** Deactivate a single crawl target */
  deactivateTarget: (datasourceId: string, targetId: string): Promise<CrawlTarget> =>
    apiClient.post<CrawlTarget>(API_CONFIG.ENDPOINTS.ingest.datasourceDeactivateTarget(datasourceId, targetId)),

  /** Flush a target: disable it and exclude its historical analytics rows */
  deleteTarget: (datasourceId: string, targetId: string): Promise<void> =>
    apiClient.delete<void>(API_CONFIG.ENDPOINTS.ingest.datasourceTarget(datasourceId, targetId)),

  /** Trigger a dryrun for a datasource (optionally scoped to a specific target) */
  triggerDryrun: (datasourceId: string, data?: TriggerDryrunInput): Promise<DryrunResult> =>
    apiClient.post<DryrunResult>(API_CONFIG.ENDPOINTS.ingest.datasourceTriggerDryrun(datasourceId), data),

  /**
   * Get the latest dryrun result for a datasource.
   * Optionally filter by target_id.
   */
  getDryrunLatest: (datasourceId: string, targetId?: string): Promise<DryrunResult> =>
    apiClient.get<DryrunResult>(
      API_CONFIG.ENDPOINTS.ingest.datasourceDryrunLatest(datasourceId),
      targetId ? { target_id: targetId } : undefined,
    ),
};
