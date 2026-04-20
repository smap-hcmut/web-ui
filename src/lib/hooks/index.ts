/**
 * Hooks Index
 *
 * Export all custom hooks from a single entry point.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────
export { useCurrentUser, useLogout, useLogin, authKeys } from './use-auth';

// ─── Campaigns & Projects ─────────────────────────────────────────────────────
export {
  useCampaigns,
  useCampaign,
  useCreateCampaign,
  useUpdateCampaign,
  useArchiveCampaign,
  useToggleCampaignFavorite,
  campaignKeys,
} from './use-campaigns';
export { useProjectsByCampaign, useCreateProject, projectKeys } from './use-projects';
export { useProjectStats, projectStatsKeys } from './use-project-stats';
export type { ProjectStat, ProjectStatsResponse } from './use-project-stats';

// ─── Datasources & Targets (ingest-srv) ───────────────────────────────────────
export { useCampaignTargets, datasourceKeys } from './use-datasources';

// ─── Analytics (Direct PG via Next.js API routes) ─────────────────────────────
export { useCampaignKPIs, kpiKeys } from './use-campaign-kpis';
export type { KPIMetric, EngagementBreakdown, KPIsResponse } from './use-campaign-kpis';

export { usePlatformStats, platformKeys } from './use-platform-stats';
export type { PlatformStat, PlatformTimeSeries, PlatformStatsResponse } from './use-platform-stats';

export { useSentimentData, sentimentKeys } from './use-sentiment-data';
export type { SentimentDonutItem, SentimentTimelineSeries, SentimentResponse } from './use-sentiment-data';

export { useTrendingKeywords, keywordKeys } from './use-trending-keywords';
export type { KeywordItem, WordCloudItem, KeywordsResponse } from './use-trending-keywords';

export { useRecentActivity, useInfinitePosts, postsKeys } from './use-recent-activity';
export type { PostItem, PostsResponse, PostsParams } from './use-recent-activity';

export { useHeapData, heapKeys } from './use-heap-data';
export type { HeapNode, HeapNodeMetrics, HeapResponse } from './use-heap-data';

// ─── Metabase (kept for ChartBuilder admin tool) ──────────────────────────────
export { useMetabaseCards, useMetabaseQuery, useMetabaseMetadata, useMetabaseDataset, metabaseKeys } from './use-metabase';
export type { MetabaseCard, MetabaseColumn, MetabaseQueryResult, MetabaseTableMeta, MetabaseFieldMeta, DatasetRequest } from './use-metabase';
