'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useReportPosts } from '@/lib/hooks';
import { ReportPostList } from './ReportPostList';
import { BulkSelectionToolbar } from './BulkSelectionToolbar';
import type { ReportItem } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  report: ReportItem;
}

const PAGE_SIZE = 20;
const MAX_SELECTED = 100;

export function ReviewPostsModal({ open, onClose, report }: Props) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(() => new Set());
  const [listHeight, setListHeight] = useState(480);
  const toggleExpand = useCallback((id: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const update = () => setListHeight(Math.max(320, window.innerHeight * 0.55));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { data, isLoading } = useReportPosts(report.id, { page, pageSize: PAGE_SIZE });
  const posts = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_SELECTED) return prev;
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllOnPage = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const pageIds = posts.map((p) => p.id);
      const allOn = pageIds.every((id) => next.has(id));
      if (allOn) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) {
          if (next.size >= MAX_SELECTED) break;
          next.add(id);
        }
      }
      return next;
    });
  }, [posts]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectedOnPage = useMemo(
    () => posts.filter((p) => selected.has(p.id)).length,
    [posts, selected],
  );

  return (
    <Modal open={open} onClose={onClose} title={report.title} size="lg">
      <div className="flex flex-col gap-3" style={{ height: '70vh' }}>
        <BulkSelectionToolbar
          selectedCount={selected.size}
          totalOnPage={selectedOnPage || posts.length}
          onSelectAllOnPage={selectAllOnPage}
          onClear={clear}
        />

        <div className="flex-1 min-h-0 overflow-hidden">
          <ReportPostList
            posts={posts}
            isLoading={isLoading}
            selectedIds={selected}
            onToggleSelect={toggleSelect}
            expandedIds={expandedComments}
            onToggleExpand={toggleExpand}
            height={listHeight}
          />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Page {page} / {totalPages} · {total} posts
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg disabled:opacity-40"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { if (page !== 1) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const n = Math.max(1, Math.min(totalPages, Number(e.target.value) || 1));
                setPage(n);
              }}
              className="w-14 px-2 py-1 rounded-lg text-[12px] text-center tabular-nums"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg disabled:opacity-40"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { if (page < totalPages) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
