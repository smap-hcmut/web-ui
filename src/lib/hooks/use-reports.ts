/**
 * Report hooks — list, detail, process polling, paginated posts, lazy comments.
 *
 * Polling rules:
 * - `useReportProcess` polls every 3s while status is pending/running.
 * - Stops polling on terminal status (done/failed/cancelled).
 * - The enclosing component should also subscribe to `useReportJobsStore`
 *   so polling survives refreshes for jobs that aren't currently on screen.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
} from '@tanstack/react-query';
import { reportsApi, type GenerateCompetitorInput, type ListPostsParams } from '@/lib/api/reports';
import { isTerminal, useReportJobsStore } from '@/lib/stores/reportJobs';
import type {
  CrawlerProcess,
  PaginatedResponse,
  ReportComment,
  ReportContent,
  ReportItem,
  ReportPost,
} from '@/lib/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (campaignId: string) => [...reportKeys.lists(), campaignId] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
  process: (id: string) => [...reportKeys.all, 'process', id] as const,
  content: (id: string) => [...reportKeys.all, 'content', id] as const,
  posts: (id: string, params?: ListPostsParams) =>
    [...reportKeys.all, 'posts', id, params ?? {}] as const,
  comments: (postId: string) => [...reportKeys.all, 'comments', postId] as const,
};

// ─── List / Detail ────────────────────────────────────────────────────────────

export function useReports(campaignId: string | null) {
  return useQuery<PaginatedResponse<ReportItem>>({
    queryKey: reportKeys.list(campaignId ?? ''),
    queryFn: () => reportsApi.list({ campaignId: campaignId! }),
    enabled: !!campaignId,
    staleTime: 15_000,
  });
}

export function useReport(reportId: string | null) {
  return useQuery<ReportItem>({
    queryKey: reportKeys.detail(reportId ?? ''),
    queryFn: () => reportsApi.get(reportId!),
    enabled: !!reportId,
    staleTime: 15_000,
  });
}

export function useReportContent(reportId: string | null, enabled = true) {
  return useQuery<ReportContent>({
    queryKey: reportKeys.content(reportId ?? ''),
    queryFn: () => reportsApi.content(reportId!),
    enabled: !!reportId && enabled,
    staleTime: 5 * 60_000,
  });
}

// ─── Process polling ──────────────────────────────────────────────────────────

export function useReportProcess(reportId: string | null) {
  const updateJob = useReportJobsStore((s) => s.updateJob);
  const removeJob = useReportJobsStore((s) => s.removeJob);
  const queryClient = useQueryClient();

  return useQuery<CrawlerProcess>({
    queryKey: reportKeys.process(reportId ?? ''),
    queryFn: async () => {
      const process = await reportsApi.getProcess(reportId!);
      if (reportId) {
        updateJob(reportId, { status: process.status, lastPolledAt: new Date().toISOString() });
        if (isTerminal(process.status)) {
          // Refresh the parent report row so status flips in list UI.
          queryClient.invalidateQueries({ queryKey: reportKeys.detail(reportId) });
          queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
          if (process.status === 'done') removeJob(reportId);
        }
      }
      return process;
    },
    enabled: !!reportId,
    refetchInterval: (query) => {
      const data = query.state.data as CrawlerProcess | undefined;
      if (!data) return 3000;
      return isTerminal(data.status) ? false : 3000;
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
}

// ─── Paginated posts ──────────────────────────────────────────────────────────

export function useReportPosts(reportId: string | null, params: ListPostsParams) {
  return useQuery<PaginatedResponse<ReportPost>>({
    queryKey: reportKeys.posts(reportId ?? '', params),
    queryFn: () => reportsApi.listPosts(reportId!, params),
    enabled: !!reportId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ─── Lazy comments (paginated — "load more") ──────────────────────────────────

const COMMENTS_PAGE_SIZE = 20;

export function usePostComments(postId: string | null, enabled: boolean) {
  return useInfiniteQuery<PaginatedResponse<ReportComment>>({
    queryKey: reportKeys.comments(postId ?? ''),
    queryFn: ({ pageParam }) =>
      reportsApi.listComments(postId!, {
        page: pageParam as number,
        pageSize: COMMENTS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    enabled: !!postId && enabled,
    staleTime: 5 * 60_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useGenerateCompetitor() {
  const queryClient = useQueryClient();
  const addJob = useReportJobsStore((s) => s.addJob);

  return useMutation({
    mutationFn: (input: GenerateCompetitorInput) => reportsApi.generateCompetitor(input),
    onSuccess: (result, input) => {
      addJob({
        reportId: result.reportId,
        processId: result.processId,
        campaignId: input.campaignId,
        status: 'pending',
        startedAt: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: reportKeys.list(input.campaignId) });
    },
  });
}

export function useCancelReport() {
  const queryClient = useQueryClient();
  const removeJob = useReportJobsStore((s) => s.removeJob);

  return useMutation({
    mutationFn: (reportId: string) => reportsApi.cancel(reportId),
    onSuccess: (_r, reportId) => {
      removeJob(reportId);
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: reportKeys.process(reportId) });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

export function useRetryReport() {
  const queryClient = useQueryClient();
  const updateJob = useReportJobsStore((s) => s.updateJob);
  const addJob = useReportJobsStore((s) => s.addJob);

  return useMutation({
    mutationFn: async ({ reportId }: { reportId: string; campaignId: string }) => {
      const result = await reportsApi.retry(reportId);
      return result;
    },
    onSuccess: ({ processId }, { reportId, campaignId }) => {
      const existing = useReportJobsStore.getState().jobs[reportId];
      if (existing) {
        updateJob(reportId, { processId, status: 'pending', startedAt: new Date().toISOString() });
      } else {
        addJob({
          reportId,
          processId,
          campaignId,
          status: 'pending',
          startedAt: new Date().toISOString(),
        });
      }
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: reportKeys.process(reportId) });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}
