'use client';

import { useEffect, useState } from 'react';
import { Target, X, RotateCw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PlatformIcon } from '@/components/icons/PlatformIcon';
import { useCancelReport, useReportProcess, useRetryReport } from '@/lib/hooks';
import type { ReportItem } from '@/lib/types';

interface Props {
  report: ReportItem;
}

function formatElapsed(startIso: string) {
  const ms = Date.now() - Date.parse(startIso);
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

export function GeneratingReportCard({ report }: Props) {
  const { data: process } = useReportProcess(report.id);
  const cancel = useCancelReport();
  const retry = useRetryReport();
  const [tick, setTick] = useState(0);

  // Re-render once per second for the elapsed clock
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  // tick is intentionally read to force re-render
  void tick;

  const live = process ?? report.process;
  if (!live) return null;

  const pct = live.progress.target > 0 ? (live.progress.crawled / live.progress.target) * 100 : 0;
  const isFailed = live.status === 'failed';
  const isCancelled = live.status === 'cancelled';
  const isTerminal = isFailed || isCancelled || live.status === 'done';

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--warning-bg)' }}
          >
            <Target className="w-5 h-5" style={{ color: 'var(--warning)' }} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {report.title}
              </p>
              {isFailed ? (
                <Badge variant="danger" size="sm" dot>Failed</Badge>
              ) : isCancelled ? (
                <Badge variant="neutral" size="sm">Cancelled</Badge>
              ) : (
                <Badge variant="info" size="sm" dot>Generating</Badge>
              )}
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Scope: {report.scope}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isTerminal && (
            <button
              onClick={() => cancel.mutate(report.id)}
              disabled={cancel.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
          {(isFailed || isCancelled) && (
            <button
              onClick={() =>
                retry.mutate({ reportId: report.id, campaignId: report.campaignId ?? '' })
              }
              disabled={retry.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      </div>

      {isFailed && live.errorMessage && (
        <div
          className="mt-3 flex items-start gap-2 p-3 rounded-xl text-[12px]"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{live.errorMessage}</span>
        </div>
      )}

      {/* Progress */}
      {!isCancelled && !isFailed && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {live.progress.crawled} / {live.progress.target} posts
            </span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {Math.floor(pct)}%
            </span>
          </div>
          <ProgressBar value={pct} size="sm" />
        </div>
      )}

      {/* Per-competitor list */}
      <div className="mt-3 space-y-1.5">
        {live.progress.perCompetitor.map((c) => (
          <div
            key={c.url}
            className="flex items-center justify-between text-[11px] gap-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <PlatformIcon platform={c.platform} size={14} className="shrink-0" />
              <span className="truncate">{c.url}</span>
            </div>
            <span className="shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {c.status === 'done' ? '✓' : c.status === 'failed' ? '✕' : c.status === 'cancelled' ? '–' : ''}{' '}
              {c.crawled}/{c.target}
            </span>
          </div>
        ))}
      </div>

      {/* Timing */}
      <div className="mt-3 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-faint)' }}>
        <span>Started {formatElapsed(live.startedAt)} ago</span>
        {live.finishedAt && <span>Finished</span>}
      </div>
    </div>
  );
}
