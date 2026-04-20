/**
 * Reports API (Competitor Analysis)
 *
 * Client for the reports service. Competitor crawler jobs, paginated post
 * review, and lazy comment fetching all live here.
 *
 * Wire contract (documented for backend implementation):
 *
 *   POST   /reports/api/v1/competitor
 *          body: {
 *            campaign_id, competitor_urls[], platforms[], sections[],
 *            max_posts_per_competitor
 *          }
 *          -> { reportId, processId }
 *
 *   GET    /reports/api/v1?campaign_id=&page=&page_size=
 *          -> { items: ReportItem[], total, page, pageSize }
 *
 *   GET    /reports/api/v1/{id}                       -> ReportItem
 *   GET    /reports/api/v1/{id}/process               -> CrawlerProcess
 *   GET    /reports/api/v1/{id}/posts?page=&page_size=&sentiment=&platform=
 *          -> { items: ReportPost[], total, page, pageSize }
 *   GET    /reports/api/v1/posts/{postId}/comments?page=&page_size=
 *          -> { items: ReportComment[], total, page, pageSize }
 *   POST   /reports/api/v1/{id}/cancel                -> { ok: true }
 *   POST   /reports/api/v1/{id}/retry                 -> { processId }
 *
 * For now all paths above are served by local Next.js mocks that shadow the
 * /api/proxy catch-all. Responses already use camelCase to keep FE simple.
 */

import { apiClient } from './client';
import { API_CONFIG } from './config';
import type {
  CrawlerProcess,
  PaginatedResponse,
  Platform,
  ReportComment,
  ReportItem,
  ReportPost,
} from '../types';

// ─── Request / Response shapes ───────────────────────────────────────────────

export interface GenerateCompetitorInput {
  campaignId: string;
  competitorUrls: string[];
  platforms: Platform[];
  sections: string[];
  maxPostsPerCompetitor: number;
}

export interface GenerateCompetitorResponse {
  reportId: string;
  processId: string;
}

export interface ListReportsParams {
  campaignId: string;
  page?: number;
  pageSize?: number;
}

export interface ListPostsParams {
  page?: number;
  pageSize?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  platform?: Platform;
}

// ─── API Module ──────────────────────────────────────────────────────────────

export const reportsApi = {
  list: (params: ListReportsParams): Promise<PaginatedResponse<ReportItem>> =>
    apiClient.get<PaginatedResponse<ReportItem>>(API_CONFIG.ENDPOINTS.reports.list, {
      campaign_id: params.campaignId,
      page: params.page,
      page_size: params.pageSize,
    }),

  get: (id: string): Promise<ReportItem> =>
    apiClient.get<ReportItem>(API_CONFIG.ENDPOINTS.reports.report(id)),

  getProcess: (id: string): Promise<CrawlerProcess> =>
    apiClient.get<CrawlerProcess>(API_CONFIG.ENDPOINTS.reports.process(id)),

  generateCompetitor: (input: GenerateCompetitorInput): Promise<GenerateCompetitorResponse> =>
    apiClient.post<GenerateCompetitorResponse>(
      API_CONFIG.ENDPOINTS.reports.competitor,
      {
        campaign_id: input.campaignId,
        competitor_urls: input.competitorUrls,
        platforms: input.platforms,
        sections: input.sections,
        max_posts_per_competitor: input.maxPostsPerCompetitor,
      },
    ),

  listPosts: (id: string, params?: ListPostsParams): Promise<PaginatedResponse<ReportPost>> =>
    apiClient.get<PaginatedResponse<ReportPost>>(
      API_CONFIG.ENDPOINTS.reports.posts(id),
      {
        page: params?.page,
        page_size: params?.pageSize,
        sentiment: params?.sentiment,
        platform: params?.platform,
      },
    ),

  listComments: (
    postId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<PaginatedResponse<ReportComment>> =>
    apiClient.get<PaginatedResponse<ReportComment>>(
      API_CONFIG.ENDPOINTS.reports.postComments(postId),
      { page: params?.page, page_size: params?.pageSize },
    ),

  cancel: (id: string): Promise<{ ok: true }> =>
    apiClient.post<{ ok: true }>(API_CONFIG.ENDPOINTS.reports.cancel(id)),

  retry: (id: string): Promise<{ processId: string }> =>
    apiClient.post<{ processId: string }>(API_CONFIG.ENDPOINTS.reports.retry(id)),
};
