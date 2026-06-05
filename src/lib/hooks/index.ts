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
export { useProjectsByCampaign, useCreateProject } from './use-projects';
export { useProjectStats } from './use-project-stats';
export type { ProjectStat } from './use-project-stats';

// ─── Datasources & Targets (ingest-srv) ───────────────────────────────────────

// ─── Analytics (Direct PG via Next.js API routes) ─────────────────────────────
export { useCampaignKPIs } from './use-campaign-kpis';

export { usePlatformStats } from './use-platform-stats';

export { useSentimentData } from './use-sentiment-data';

export { useTrendingKeywords } from './use-trending-keywords';

export { useRecentActivity } from './use-recent-activity';

export { useHeapData } from './use-heap-data';

// ─── Reports ──────────────────────────────────────────────────────────────────
export {
  useReports,
  useReport,
  useReportProcess,
  useReportPosts,
  usePostComments,
  useGenerateCompetitor,
  useCancelReport,
  useRetryReport,
} from './use-reports';
