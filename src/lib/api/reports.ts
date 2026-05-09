/**
 * Reports API
 *
 * Report artifacts are owned by knowledge-srv. The frontend model stays
 * camelCase, while knowledge-srv returns the platform-wide snake_case envelope.
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
  ReportStatus,
} from '../types';

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

export interface GenerateCampaignReportInput {
  campaignId: string;
  title?: string;
  sections: string[];
  prompt?: string;
  filters?: Record<string, unknown>;
  source?: 'manual' | 'assistant';
}

export interface GenerateCampaignReportResponse {
  reportId: string;
  status: ReportItem['status'];
}

export interface DownloadReportResponse {
  downloadUrl: string;
  expiresAt: string;
  fileName: string;
  fileSize: number;
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

type KnowledgeReportStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | string;

interface KnowledgeReportFilters {
  sentiments?: string[];
  aspects?: string[];
  platforms?: string[];
  date_from?: number;
  date_to?: number;
  risk_levels?: string[];
  sections?: string[];
  prompt?: string;
  source?: string;
  competitor_urls?: string[];
  max_posts_per_competitor?: number;
}

interface KnowledgeReport {
  id: string;
  campaign_id: string;
  user_id: string;
  title?: string;
  report_type: string;
  status: KnowledgeReportStatus;
  error_message?: string;
  file_format?: string;
  file_size_bytes?: number;
  total_docs_analyzed?: number;
  sections_count?: number;
  generation_time_ms?: number;
  filters?: KnowledgeReportFilters | Record<string, unknown>;
  completed_at?: string | null;
  created_at: string;
}

interface KnowledgeListReportsResponse {
  items?: KnowledgeReport[];
  total?: number;
  page?: number;
  page_size?: number;
}

interface KnowledgeGenerateResponse {
  report_id: string;
  status: KnowledgeReportStatus;
  message?: string;
}

interface KnowledgeProcessResponse {
  process_id: string;
  status: string;
  started_at: string;
  finished_at?: string;
  progress?: {
    crawled?: number;
    target?: number;
    per_competitor?: Array<{
      url: string;
      platform: string;
      crawled: number;
      target: number;
      status: string;
    }>;
  };
  error_message?: string;
}

interface KnowledgePost {
  id: string;
  report_id: string;
  competitor_url?: string;
  platform: string;
  author: string;
  author_avatar?: string;
  content: string;
  posted_at: string;
  url?: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  sentiment: string;
  comment_count?: number;
  sentiment_breakdown?: {
    positive?: number;
    neutral?: number;
    negative?: number;
  };
  top_keywords?: string[];
}

interface KnowledgeListPostsResponse {
  items?: KnowledgePost[];
  total?: number;
  page?: number;
  page_size?: number;
}

interface KnowledgeComment {
  id: string;
  post_id: string;
  author: string;
  content: string;
  created_at: string;
  likes?: number;
  sentiment?: string;
  replies?: KnowledgeComment[];
}

interface KnowledgeListCommentsResponse {
  items?: KnowledgeComment[];
  total?: number;
  page?: number;
  page_size?: number;
}

interface KnowledgeDownloadResponse {
  download_url: string;
  expires_at: string;
  file_name: string;
  file_size: number;
}

const DEFAULT_SECTIONS_BY_TYPE: Record<string, string[]> = {
  SUMMARY: ['Executive Summary', 'Sentiment Drivers', 'Platform Breakdown', 'Marketing Actions'],
  COMPARISON: ['Platform Comparison', 'Audience Signals', 'Competitive Gap'],
  TREND: ['Trend Signals', 'Conversation Momentum', 'Recommended Experiments'],
  ASPECT_DEEP_DIVE: ['Aspect Deep Dive', 'Evidence Review', 'Improvement Priorities'],
};

function asFilters(value: unknown): KnowledgeReportFilters {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as KnowledgeReportFilters;
}

function toReportStatus(status: KnowledgeReportStatus): ReportStatus {
  switch (String(status).toUpperCase()) {
    case 'COMPLETED':
      return 'ready';
    case 'FAILED':
      return 'failed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'generating';
  }
}

function toCrawlerStatus(status: string): CrawlerProcess['status'] {
  switch (status.toLowerCase()) {
    case 'done':
    case 'completed':
      return 'done';
    case 'failed':
      return 'failed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'pending':
      return 'pending';
    default:
      return 'running';
  }
}

function normalizePlatform(value: string | undefined): Platform {
  const lower = (value ?? '').toLowerCase();
  if (lower.includes('tiktok')) return 'tiktok';
  if (lower.includes('youtube') || lower.includes('youtu')) return 'youtube';
  return 'facebook';
}

function normalizeSentiment(value: string | undefined): ReportPost['sentiment'] {
  const upper = (value ?? '').toUpperCase();
  if (upper === 'POSITIVE' || upper === 'positive') return 'positive';
  if (upper === 'NEGATIVE' || upper === 'negative') return 'negative';
  return 'neutral';
}

function reportTypeFromSections(sections: string[], fallback: string): string {
  const text = sections.join(' ').toLowerCase();
  if (/trend|xu hướng|viral|momentum|spike/.test(text)) return 'TREND';
  if (/compare|comparison|competitor|competitive|đối thủ|cạnh tranh|benchmark/.test(text)) return 'COMPARISON';
  if (/aspect|driver|keyword|deep|khía cạnh|issue/.test(text)) return 'ASPECT_DEEP_DIVE';
  return fallback;
}

function mapReport(raw: KnowledgeReport): ReportItem {
  const filters = asFilters(raw.filters);
  const sections = Array.isArray(filters.sections) && filters.sections.length > 0
    ? filters.sections
    : DEFAULT_SECTIONS_BY_TYPE[raw.report_type] ?? DEFAULT_SECTIONS_BY_TYPE.SUMMARY;
  const competitorUrls = Array.isArray(filters.competitor_urls) ? filters.competitor_urls : [];
  const platforms = Array.isArray(filters.platforms)
    ? filters.platforms.map(normalizePlatform)
    : undefined;
  const status = toReportStatus(raw.status);
  const generatedAt = raw.completed_at || raw.created_at;
  const format = (raw.file_format ?? 'md').toUpperCase() === 'MD' ? 'MD' : 'PDF';

  return {
    id: raw.id,
    title: raw.title || `Campaign intelligence report`,
    type: competitorUrls.length > 0 ? 'competitor' : 'campaign',
    scope: competitorUrls.length > 0 ? 'Benchmark context' : 'Campaign knowledge base',
    generatedAt,
    pages: Math.max(1, raw.sections_count || sections.length || 1),
    format,
    status,
    sections,
    campaignId: raw.campaign_id,
    competitorUrls,
    platforms,
    maxPostsPerCompetitor: filters.max_posts_per_competitor,
    totals: {
      posts: raw.total_docs_analyzed ?? 0,
      comments: 0,
    },
    errorMessage: raw.error_message,
    source: filters.source === 'assistant' ? 'assistant' : 'manual',
    prompt: filters.prompt,
    process: status === 'generating' || status === 'failed' || status === 'cancelled'
      ? {
          processId: raw.id,
          status: status === 'generating' ? 'running' : status,
          startedAt: raw.created_at,
          finishedAt: raw.completed_at ?? undefined,
          progress: {
            crawled: 0,
            target: raw.total_docs_analyzed && raw.total_docs_analyzed > 0 ? raw.total_docs_analyzed : 50,
            perCompetitor: [],
          },
          errorMessage: raw.error_message,
        }
      : undefined,
  };
}

function mapProcess(raw: KnowledgeProcessResponse): CrawlerProcess {
  return {
    processId: raw.process_id,
    status: toCrawlerStatus(raw.status),
    startedAt: raw.started_at,
    finishedAt: raw.finished_at,
    progress: {
      crawled: raw.progress?.crawled ?? 0,
      target: raw.progress?.target ?? 0,
      perCompetitor: (raw.progress?.per_competitor ?? []).map((item) => ({
        url: item.url,
        platform: normalizePlatform(item.platform),
        crawled: item.crawled,
        target: item.target,
        status: toCrawlerStatus(item.status),
      })),
    },
    errorMessage: raw.error_message,
  };
}

function mapPost(raw: KnowledgePost): ReportPost {
  const engagement = raw.engagement ?? {};
  const breakdown = raw.sentiment_breakdown;
  return {
    id: raw.id,
    reportId: raw.report_id,
    competitorUrl: raw.competitor_url ?? '',
    platform: normalizePlatform(raw.platform),
    author: raw.author || 'Unknown',
    authorAvatar: raw.author_avatar,
    content: raw.content,
    postedAt: raw.posted_at,
    url: raw.url ?? '',
    engagement: {
      likes: engagement.likes ?? 0,
      comments: engagement.comments ?? 0,
      shares: engagement.shares ?? 0,
      views: engagement.views ?? 0,
    },
    sentiment: normalizeSentiment(raw.sentiment),
    commentCount: raw.comment_count ?? engagement.comments ?? 0,
    sentimentBreakdown: breakdown
      ? {
          positive: breakdown.positive ?? 0,
          neutral: breakdown.neutral ?? 0,
          negative: breakdown.negative ?? 0,
        }
      : undefined,
    topKeywords: raw.top_keywords ?? [],
  };
}

function mapComment(raw: KnowledgeComment): ReportComment {
  return {
    id: raw.id,
    postId: raw.post_id,
    author: raw.author,
    content: raw.content,
    time: raw.created_at,
    likes: raw.likes ?? 0,
    sentiment: normalizeSentiment(raw.sentiment),
    replies: raw.replies?.map(mapComment),
  };
}

function buildGenerateBody(input: GenerateCampaignReportInput, reportType = 'SUMMARY') {
  const sections = input.sections.length > 0 ? input.sections : DEFAULT_SECTIONS_BY_TYPE.SUMMARY;
  return {
    campaign_id: input.campaignId,
    report_type: reportTypeFromSections(sections, reportType),
    title: input.title,
    sections,
    prompt: input.prompt,
    source: input.source,
    filters: {
      ...(input.filters ?? {}),
      sections,
      prompt: input.prompt,
      source: input.source,
    },
  };
}

export const reportsApi = {
  list: async (params: ListReportsParams): Promise<PaginatedResponse<ReportItem>> => {
    const resp = await apiClient.get<KnowledgeListReportsResponse>(API_CONFIG.ENDPOINTS.reports.list, {
      campaign_id: params.campaignId,
      page: params.page,
      page_size: params.pageSize,
    });
    return {
      items: (resp.items ?? []).map(mapReport),
      total: resp.total ?? resp.items?.length ?? 0,
      page: resp.page ?? params.page ?? 1,
      pageSize: resp.page_size ?? params.pageSize ?? 20,
    };
  },

  get: async (id: string): Promise<ReportItem> => {
    const resp = await apiClient.get<KnowledgeReport>(API_CONFIG.ENDPOINTS.reports.report(id));
    return mapReport(resp);
  },

  getProcess: async (id: string): Promise<CrawlerProcess> => {
    const resp = await apiClient.get<KnowledgeProcessResponse>(API_CONFIG.ENDPOINTS.reports.process(id));
    return mapProcess(resp);
  },

  generateCompetitor: async (input: GenerateCompetitorInput): Promise<GenerateCompetitorResponse> => {
    const sections = input.sections.length > 0
      ? input.sections
      : DEFAULT_SECTIONS_BY_TYPE.COMPARISON;
    const resp = await apiClient.post<KnowledgeGenerateResponse>(
      API_CONFIG.ENDPOINTS.reports.generate,
      {
        campaign_id: input.campaignId,
        report_type: 'COMPARISON',
        title: `Benchmark intelligence report · ${new Date().toLocaleDateString('vi-VN')}`,
        sections,
        source: 'manual',
        competitor_urls: input.competitorUrls,
        max_posts_per_competitor: input.maxPostsPerCompetitor,
        filters: {
          sections,
          source: 'manual',
          platforms: input.platforms,
          competitor_urls: input.competitorUrls,
          max_posts_per_competitor: input.maxPostsPerCompetitor,
        },
      },
    );
    return { reportId: resp.report_id, processId: resp.report_id };
  },

  generateCampaign: async (input: GenerateCampaignReportInput): Promise<GenerateCampaignReportResponse> => {
    const resp = await apiClient.post<KnowledgeGenerateResponse>(
      API_CONFIG.ENDPOINTS.reports.generate,
      buildGenerateBody(input),
    );
    return {
      reportId: resp.report_id,
      status: toReportStatus(resp.status),
    };
  },

  listPosts: async (id: string, params?: ListPostsParams): Promise<PaginatedResponse<ReportPost>> => {
    const resp = await apiClient.get<KnowledgeListPostsResponse>(
      API_CONFIG.ENDPOINTS.reports.posts(id),
      {
        page: params?.page,
        page_size: params?.pageSize,
        sentiment: params?.sentiment,
        platform: params?.platform,
      },
    );
    return {
      items: (resp.items ?? []).map(mapPost),
      total: resp.total ?? resp.items?.length ?? 0,
      page: resp.page ?? params?.page ?? 1,
      pageSize: resp.page_size ?? params?.pageSize ?? 20,
    };
  },

  listComments: async (
    postId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<PaginatedResponse<ReportComment>> => {
    const resp = await apiClient.get<KnowledgeListCommentsResponse>(
      API_CONFIG.ENDPOINTS.reports.postComments(postId),
      { page: params?.page, page_size: params?.pageSize },
    );
    return {
      items: (resp.items ?? []).map(mapComment),
      total: resp.total ?? resp.items?.length ?? 0,
      page: resp.page ?? params?.page ?? 1,
      pageSize: resp.page_size ?? params?.pageSize ?? 20,
    };
  },

  download: async (id: string): Promise<DownloadReportResponse> => {
    const resp = await apiClient.get<KnowledgeDownloadResponse>(API_CONFIG.ENDPOINTS.reports.download(id));
    return {
      downloadUrl: resp.download_url,
      expiresAt: resp.expires_at,
      fileName: resp.file_name,
      fileSize: resp.file_size,
    };
  },

  cancel: (id: string): Promise<{ ok: true }> =>
    apiClient.post<{ ok: true }>(API_CONFIG.ENDPOINTS.reports.cancel(id)),

  retry: async (id: string): Promise<{ processId: string }> => {
    const resp = await apiClient.post<{ process_id?: string; report_id?: string }>(
      API_CONFIG.ENDPOINTS.reports.retry(id),
    );
    return { processId: resp.process_id ?? resp.report_id ?? id };
  },
};
