/**
 * Hooks Index
 *
 * Export all custom hooks from a single entry point.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────
export { useCurrentUser, useLogin } from './use-auth';

// ─── Campaigns & Projects ─────────────────────────────────────────────────────
export {
  useCampaigns,
  useCampaign,
} from './use-campaigns';
export {
  useProjectsByCampaign,
  useProjectDomains,
  useCreateProject,
  usePauseProject,
  useResumeProject,
  useActivateProject,
  useArchiveProject,
  useUnarchiveProject,
  useDryrunProject,
  projectKeys,
} from './use-projects';
export { useProjectStats, projectStatsKeys } from './use-project-stats';
export type { ProjectStat, ProjectStatsResponse } from './use-project-stats';

// ─── Datasources & Targets (ingest-srv) ───────────────────────────────────────

// ─── Analytics (Direct PG via Next.js API routes) ─────────────────────────────
export type { AnalyticsScopeParams } from './analytics-scope';

export { useCampaignKPIs, kpiKeys } from './use-campaign-kpis';
export type { KPIMetric, EngagementBreakdown, KPIsResponse } from './use-campaign-kpis';

export { usePlatformStats } from './use-platform-stats';

export { useSentimentData } from './use-sentiment-data';

export { useTrendingKeywords } from './use-trending-keywords';

export { useRecentActivity } from './use-recent-activity';

export { useHeapData } from './use-heap-data';

// ─── Reports ──────────────────────────────────────────────────────────────────
export {
  useReports,
  useReport,
  useReportContent,
  useReportProcess,
  useReportPosts,
  usePostComments,
  useGenerateCompetitor,
  useCancelReport,
  useRetryReport,
} from './use-reports';
