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
  crisis_config?: CrisisConfig;
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

export interface ProjectDomain {
  domain_code: string;
  display_name: string;
}

export interface CrisisKeywordGroupInput {
  name: string;
  keywords: string[];
  weight: number;
}

export interface CrisisConfigInput {
  status?: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
  keywords_trigger?: {
    enabled: boolean;
    logic: 'AND' | 'OR';
    groups: CrisisKeywordGroupInput[];
  };
  volume_trigger?: {
    enabled: boolean;
    metric: 'MENTIONS' | 'ENGAGEMENT' | 'REACH';
    rules: Array<{
      level: 'WARNING' | 'CRITICAL';
      threshold_percent_growth: number;
      comparison_window_hours: number;
      baseline: 'PREVIOUS_PERIOD' | 'AVERAGE_7D' | 'AVERAGE_30D';
    }>;
  };
  sentiment_trigger?: {
    enabled: boolean;
    min_sample_size: number;
    rules: Array<{
      type: 'NEGATIVE_SPIKE' | 'ASPECT_NEGATIVE';
      threshold_percent?: number;
      critical_aspects?: string[];
      negative_threshold_percent?: number;
    }>;
  };
  influencer_trigger?: {
    enabled: boolean;
    logic: 'AND' | 'OR';
    rules: Array<{
      type: 'HIGH_REACH' | 'VIRAL_NEGATIVE';
      min_followers?: number;
      required_sentiment?: 'NEGATIVE' | 'NEUTRAL';
      min_shares?: number;
      min_comments?: number;
    }>;
  };
  response_policy?: CrisisResponsePolicy;
}

export type CrisisConfig = {
  project_id?: string;
  status: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
  keywords_trigger: NonNullable<CrisisConfigInput['keywords_trigger']>;
  volume_trigger: NonNullable<CrisisConfigInput['volume_trigger']>;
  sentiment_trigger: NonNullable<CrisisConfigInput['sentiment_trigger']>;
  influencer_trigger: NonNullable<CrisisConfigInput['influencer_trigger']>;
  response_policy?: CrisisResponsePolicy;
  created_at?: string;
  updated_at?: string;
};

export interface CrisisResponsePolicy {
  adaptive_crawl: {
    enabled: boolean;
    trigger_level: 'WATCH' | 'WARNING' | 'CRITICAL';
    cooldown_minutes: number;
  };
  notification: {
    enabled: boolean;
    trigger_level: 'WARNING' | 'CRITICAL';
    repeat_cooldown_minutes: number;
    ops_alert_on_critical: boolean;
  };
}

export type OntologyTargetKind = 'ASPECT' | 'ISSUE' | 'TOPIC';
export type OntologyMatchMode = 'ANY' | 'ALL' | 'REGEX';

export interface OntologySignalRule {
  id?: string;
  label: string;
  description?: string;
  target_kind: OntologyTargetKind;
  target_key: string;
  match_mode: OntologyMatchMode;
  phrases: string[];
  patterns: string[];
  negative_phrases?: string[];
  enabled: boolean;
  weight: number;
  sample_text?: string;
}

export interface ProjectOntologyRulesInput {
  enabled: boolean;
  rules: OntologySignalRule[];
}

export interface ProjectOntologyRules extends ProjectOntologyRulesInput {
  project_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OntologyRuleTestResult {
  rule_id: string;
  label: string;
  target_kind: OntologyTargetKind;
  target_key: string;
  matched: boolean;
  evidence: string[];
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

  /** List analysis domains available for project routing */
  listDomains: (): Promise<ProjectDomain[]> =>
    apiClient.get<ProjectDomain[]>(API_CONFIG.ENDPOINTS.project.domains),

  /** Update a project */
  update: (id: string, data: UpdateProjectInput): Promise<Project> =>
    apiClient.put<Project>(API_CONFIG.ENDPOINTS.project.project(id), data),

  /** Activate a project (triggers ingest-srv datasource activation) */
  activate: (id: string): Promise<Project> =>
    apiClient.post<Project>(API_CONFIG.ENDPOINTS.project.projectActivate(id)),

  /** Resume a paused project */
  resume: (id: string): Promise<Project> =>
    apiClient.post<Project>(API_CONFIG.ENDPOINTS.project.projectResume(id)),

  /** Pause an active project */
  pause: (id: string): Promise<Project> =>
    apiClient.post<Project>(API_CONFIG.ENDPOINTS.project.projectPause(id)),

  /** Create or update project-level crisis detection config */
  upsertCrisisConfig: (id: string, data: CrisisConfigInput): Promise<unknown> =>
    apiClient.put<unknown>(API_CONFIG.ENDPOINTS.project.projectCrisisConfig(id), data),

  /** Get project-level crisis detection config */
  getCrisisConfig: (id: string): Promise<CrisisConfig> =>
    apiClient.get<CrisisConfig>(API_CONFIG.ENDPOINTS.project.projectCrisisConfig(id)),

  /** Create or update marketing ontology/signal matching rules */
  upsertOntologyRules: (id: string, data: ProjectOntologyRulesInput): Promise<ProjectOntologyRules> =>
    apiClient.put<ProjectOntologyRules>(API_CONFIG.ENDPOINTS.project.projectOntologyRules(id), data),

  /** Get marketing ontology/signal matching rules */
  getOntologyRules: (id: string): Promise<ProjectOntologyRules> =>
    apiClient.get<ProjectOntologyRules>(API_CONFIG.ENDPOINTS.project.projectOntologyRules(id)),

  /** Test a draft ruleset against sample text before saving */
  testOntologyRules: (id: string, data: ProjectOntologyRulesInput & { text: string }): Promise<OntologyRuleTestResult[]> =>
    apiClient.post<{ matches: OntologyRuleTestResult[] }>(API_CONFIG.ENDPOINTS.project.projectOntologyRulesTest(id), data)
      .then((resp) => resp.matches ?? []),

  /** Archive a project */
  archive: (id: string): Promise<Project> =>
    apiClient.post<Project>(API_CONFIG.ENDPOINTS.project.projectArchive(id)),

  /** Restore an archived project to PAUSED so it can be reviewed before resume */
  unarchive: (id: string): Promise<Project> =>
    apiClient.post<Project>(API_CONFIG.ENDPOINTS.project.projectUnarchive(id)),
};
