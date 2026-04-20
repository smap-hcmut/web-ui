'use client';

import { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePostComments } from '@/lib/hooks';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ReportComment } from '@/lib/types';
import type { PostComment } from '@/lib/types';

interface Props {
  postId: string;
  expanded: boolean;
}

function sentimentColor(s: PostComment['sentiment']) {
  if (s === 'positive') return 'var(--success)';
  if (s === 'negative') return 'var(--danger)';
  return 'var(--text-muted)';
}

function CommentRow({ c, depth = 0 }: { c: PostComment | ReportComment; depth?: number }) {
  return (
    <div style={{ paddingLeft: depth * 16 }} className="py-2">
      <div className="flex items-start gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
          style={{ background: sentimentColor(c.sentiment) }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.author}</span>
            <span style={{ color: 'var(--text-faint)' }}>· {c.likes} likes</span>
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.content}</p>
          {c.replies && c.replies.length > 0 && (
            <div className="mt-1">
              {c.replies.map((r) => (
                <CommentRow key={r.id} c={r} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportCommentThreadImpl({ postId, expanded }: Props) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePostComments(postId, expanded);

  if (!expanded) return null;

  if (isLoading) {
    return (
      <div className="mt-3 pl-4 space-y-2" style={{ borderLeft: '2px solid var(--border-subtle)' }}>
        <Skeleton variant="rect" height={24} />
        <Skeleton variant="rect" height={24} />
        <Skeleton variant="rect" height={24} />
      </div>
    );
  }

  const comments = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  if (comments.length === 0) {
    return (
      <div
        className="mt-3 pl-4 text-[11px]"
        style={{ borderLeft: '2px solid var(--border-subtle)', color: 'var(--text-faint)' }}
      >
        No comments yet.
      </div>
    );
  }

  return (
    <div className="mt-3 pl-4" style={{ borderLeft: '2px solid var(--border-subtle)' }}>
      {comments.map((c) => (
        <CommentRow key={c.id} c={c} />
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-2 flex items-center gap-1 text-[11px] font-medium disabled:opacity-50"
          style={{ color: 'var(--accent)' }}
        >
          {isFetchingNextPage ? (
            <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          Xem thêm ({total - comments.length} còn lại)
        </button>
      )}
    </div>
  );
}

export const ReportCommentThread = memo(ReportCommentThreadImpl);
