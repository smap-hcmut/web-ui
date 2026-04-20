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
export type CrawlMode = 'SLEEP' | 'NORMAL' | 'CRISIS';
export type DataSourceStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ERROR';
export type TargetType = 'KEYWORD' | 'PROFILE' | 'POST_URL';
export type DryrunStatus = 'NOT_REQUIRED' | 'PENDING' | 'RUNNING' | 'SUCCESS' | 'WARNING' | 'FAILED';

export interface DataSource {
  id: string;
  name: string;
  source_type: SourceType;
  crawl_mode: CrawlMode;
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
  is_active: boolean;
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
  datasource_name: string;
}

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateDataSourceInput {
  project_id: string;
  name: string;
  description?: string;
  source_type: SourceType;
  crawl_mode: CrawlMode;
  crawl_interval_minutes: number;
}

export interface CreateKeywordTargetInput {
  values: string[];
  label?: string;
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
          datasource_name: ds.name,
        });
      }
    });

    return result;
  },

  /** Create a new datasource for a project */
  create: (data: CreateDataSourceInput): Promise<DataSource> =>
    apiClient.post<DataSource>(API_CONFIG.ENDPOINTS.ingest.datasources, data),

  /** Add keyword targets to a datasource */
  createKeywordTarget: (datasourceId: string, data: CreateKeywordTargetInput): Promise<CrawlTarget> =>
    apiClient.post<CrawlTarget>(API_CONFIG.ENDPOINTS.ingest.datasourceTargetKeywords(datasourceId), data),

  /** Activate a single crawl target */
  activateTarget: (datasourceId: string, targetId: string): Promise<CrawlTarget> =>
    apiClient.post<CrawlTarget>(API_CONFIG.ENDPOINTS.ingest.datasourceActivateTarget(datasourceId, targetId)),

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
