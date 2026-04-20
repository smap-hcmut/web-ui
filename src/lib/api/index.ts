/**
 * API Index
 *
 * Export API utilities from a single entry point.
 */

export { apiClient, type ApiError, type ApiResponse } from './client';
export { API_CONFIG, buildApiUrl, type ServiceName } from './config';
export {
  campaignApi,
  type Campaign,
  type CampaignStatus,
  type CampaignListParams,
  type CampaignListResponse,
  type CreateCampaignInput,
  type UpdateCampaignInput,
  type Paginator,
} from './campaigns';
export {
  projectApi,
  type Project,
  type ProjectStatus,
  type EntityType,
  type CreateProjectInput,
  type UpdateProjectInput,
} from './projects';
export {
  datasourceApi,
  type DataSource,
  type CrawlTarget,
  type TargetWithSource,
  type SourceType,
  type TargetType,
} from './datasources';
export {
  knowledgeApi,
  type ChatRequest,
  type ChatResponse,
  type Citation,
  type SuggestionItem,
} from './knowledge';
