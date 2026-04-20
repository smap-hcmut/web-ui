'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  ExternalLink,
  Target,
  BarChart3,
  RotateCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ReportPostList } from '@/components/reports/ReportPostList';
import { BulkSelectionToolbar } from '@/components/reports/BulkSelectionToolbar';
import { GeneratingReportCard } from '@/components/reports/GeneratingReportCard';
import { useReport, useReportPosts } from '@/lib/hooks';
import { useNotificationStore } from '@/lib/stores';

interface Props {
  reportId: string;
}

const MAX_SELECTED_IN_URL = 100;

function parseSelected(raw: string | null): Set<string> {
  if (!raw) return new Set();
  return new Set(raw.split(',').filter(Boolean).slice(0, MAX_SELECTED_IN_URL));
}

export function ReportDetailClient({ reportId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campId = searchParams.get('camp_id');

  const { data: report, isLoading } = useReport(reportId);
  // Route fetches a big page once and virtualises. BE page_size cap should
  // stay in sync — mock allows up to 5000.
  const { data: postsData, isLoading: postsLoading } = useReportPosts(reportId, {
    page: 1,
    pageSize: 5000,
  });

  const [selected, setSelected] = useState<Set<string>>(() =>
    parseSelected(searchParams.get('selected')),
  );
  const [overflowWarned, setOverflowWarned] = useState(false);
  const push = useNotificationStore((s) => s.push);

  // Sync selected -> URL (cap 100 IDs in URL, otherwise drop param).
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selected.size === 0) {
      params.delete('selected');
    } else if (selected.size <= MAX_SELECTED_IN_URL) {
      params.set('selected', Array.from(selected).join(','));
    } else {
      params.delete('selected');
      if (!overflowWarned) {
        push({
          severity: 'warning',
          title: 'Selection too large to share',
          content: `Only the first ${MAX_SELECTED_IN_URL} selections fit in the URL. Shared links will not include the rest.`,
        });
        setOverflowWarned(true);
      }
    }
    const next = params.toString();
    const cur = searchParams.toString();
    if (next !== cur) {
      router.replace(`?${next}`, { scroll: false });
    }
    // Only depend on selected — we don't want to re-run on url change caused by us.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const posts = postsData?.items ?? [];

  const selectAllOnPage = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = posts.every((p) => next.has(p.id));
      if (allOn) {
        for (const p of posts) next.delete(p.id);
      } else {
        for (const p of posts) next.add(p.id);
      }
      return next;
    });
  }, [posts]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const share = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      push({
        severity: 'success',
        title: 'Link copied',
        content: 'Shareable URL is in your clipboard.',
      });
    } catch {
      push({
        severity: 'warning',
        title: 'Copy failed',
        content: 'Could not access clipboard — copy from the address bar.',
      });
    }
  };

  const goBack = () => {
    if (campId) router.push(`/smap?camp_id=${campId}`);
    else router.back();
  };

  const viewportHeight = useViewportHeight();

  const headerBadge = useMemo(() => {
    if (!report) return null;
    if (report.status === 'ready') return <Badge variant="success" size="sm">Ready</Badge>;
    if (report.status === 'generating') return <Badge variant="info" size="sm" dot>Generating</Badge>;
    if (report.status === 'failed') return <Badge variant="danger" size="sm" dot>Failed</Badge>;
    if (report.status === 'cancelled') return <Badge variant="neutral" size="sm">Cancelled</Badge>;
    return null;
  }, [report]);

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 pt-24 pb-20 space-y-4">
        <Skeleton variant="rect" height={60} />
        <Skeleton variant="card" height={140} />
        <Skeleton variant="card" height={140} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 pt-24 pb-20">
        <EmptyState
          icon={<BarChart3 />}
          title="Report not found"
          description="The report may have been deleted, or the link is invalid."
          action={
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white"
              style={{ background: 'var(--accent)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to reports
            </button>
          }
        />
      </div>
    );
  }

  const isGenerating =
    report.status === 'generating' ||
    report.status === 'failed' ||
    report.status === 'cancelled';

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-24 pb-20">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <button
          onClick={goBack}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: report.type === 'competitor' ? 'var(--warning-bg)' : 'var(--accent-subtle)',
          }}
        >
          {report.type === 'competitor' ? (
            <Target className="w-5 h-5" style={{ color: 'var(--warning)' }} />
          ) : (
            <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[17px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {report.title}
            </h1>
            {headerBadge}
            <Badge variant={report.type === 'competitor' ? 'warning' : 'accent'} size="sm">
              {report.type}
            </Badge>
          </div>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Scope: {report.scope} · {new Date(report.generatedAt).toLocaleString('vi-VN')}
            {report.totals && ` · ${report.totals.posts} posts · ${report.totals.comments} comments`}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={share}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium transition-colors"
            style={{ color: 'var(--accent)', background: 'var(--accent-subtle)' }}
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          {report.type === 'competitor' && report.competitorUrls && report.competitorUrls.length === 1 && (
            <a
              href={report.competitorUrls[0]}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium transition-colors"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Source
            </a>
          )}
        </div>
      </div>

      {/* Generating/failed card at top */}
      {isGenerating && (
        <div className="mb-4">
          <GeneratingReportCard report={report} />
        </div>
      )}

      {/* Ready: show bulk toolbar + virtualised post list */}
      {report.status === 'ready' && (
        <>
          <div className="mb-3">
            <BulkSelectionToolbar
              selectedCount={selected.size}
              totalOnPage={posts.length}
              onSelectAllOnPage={selectAllOnPage}
              onClear={clear}
            />
          </div>

          <div
            className="rounded-2xl p-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <ReportPostList
              posts={posts}
              isLoading={postsLoading}
              selectedIds={selected}
              onToggleSelect={toggle}
              height={Math.max(400, viewportHeight - 280)}
            />
          </div>
        </>
      )}

      {(report.status === 'cancelled' || report.status === 'failed') && (
        <EmptyState
          icon={<RotateCw />}
          title={report.status === 'cancelled' ? 'Report was cancelled' : 'Report failed'}
          description="Use the Retry button on the card above to try again."
        />
      )}
    </div>
  );
}

function useViewportHeight() {
  const [h, setH] = useState(900);
  useEffect(() => {
    const onResize = () => setH(window.innerHeight);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return h;
}
