/**
 * Report jobs store — persists in-flight crawler jobs so polling survives F5.
 *
 * Only jobs that are still running (status != 'done' / 'failed' / 'cancelled')
 * matter here. Once terminal, entries are removed.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CrawlerStatus } from '@/lib/types';

export interface ReportJob {
  reportId: string;
  processId: string;
  campaignId: string;
  status: CrawlerStatus;
  startedAt: string;
  lastPolledAt?: string;
}

interface ReportJobsState {
  jobs: Record<string, ReportJob>;
  addJob: (job: ReportJob) => void;
  updateJob: (reportId: string, patch: Partial<ReportJob>) => void;
  removeJob: (reportId: string) => void;
  jobsForCampaign: (campaignId: string) => ReportJob[];
}

export const useReportJobsStore = create<ReportJobsState>()(
  persist(
    (set, get) => ({
      jobs: {},

      addJob: (job) =>
        set((s) => ({ jobs: { ...s.jobs, [job.reportId]: job } })),

      updateJob: (reportId, patch) =>
        set((s) => {
          const cur = s.jobs[reportId];
          if (!cur) return s;
          return { jobs: { ...s.jobs, [reportId]: { ...cur, ...patch } } };
        }),

      removeJob: (reportId) =>
        set((s) => {
          if (!s.jobs[reportId]) return s;
          const next = { ...s.jobs };
          delete next[reportId];
          return { jobs: next };
        }),

      jobsForCampaign: (campaignId) =>
        Object.values(get().jobs).filter((j) => j.campaignId === campaignId),
    }),
    {
      name: 'smap:report-jobs',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export function isTerminal(status: CrawlerStatus): boolean {
  return status === 'done' || status === 'failed' || status === 'cancelled';
}
