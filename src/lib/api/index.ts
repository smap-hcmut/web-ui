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
