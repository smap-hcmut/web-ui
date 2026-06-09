'use client';

import { memo, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { PlatformIcon } from '@/components/icons/PlatformIcon';
import { ReportCommentThread } from './ReportCommentThread';
import type { ReportPost } from '@/lib/types';

interface Props {
  post: ReportPost;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function sentimentColor(s: ReportPost['sentiment']) {
  if (s === 'positive') return 'var(--success)';
  if (s === 'negative') return 'var(--danger)';
  return 'var(--text-muted)';
}

function ReportPostRowImpl({ post, selected, expanded, onToggleSelect, onToggleExpand }: Props) {
  const [showFull, setShowFull] = useState(false);
  const sourceUrl = post.url?.trim();

  return (
    <div
      className="rounded-xl p-4 transition-colors"
      style={{
        background: selected ? 'var(--accent-subtle)' : 'var(--bg-surface)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-subtle)'}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">
          <Checkbox checked={selected} onChange={() => onToggleSelect(post.id)} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <PlatformIcon platform={post.platform} size={14} />
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {post.author}
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: sentimentColor(post.sentiment) }}
              title={post.sentiment}
            />
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
              {new Date(post.postedAt).toLocaleString('vi-VN')}
            </span>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-[10px] flex items-center gap-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <ExternalLink className="w-3 h-3" /> source
              </a>
            ) : (
              <span
                className="ml-auto text-[10px] flex items-center gap-1 cursor-not-allowed"
                style={{ color: 'var(--text-faint)' }}
                title="Original link unavailable from the indexed source"
              >
                <ExternalLink className="w-3 h-3" /> source unavailable
              </span>
            )}
          </div>

          {/* Content */}
          <p
            className={`text-[12px] mt-1.5 ${showFull ? '' : 'line-clamp-3'}`}
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setShowFull((v) => !v)}
          >
            {post.content}
          </p>

          {/* Engagement */}
          <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span>👍 {formatNumber(post.engagement.likes)}</span>
            <span>💬 {formatNumber(post.engagement.comments)}</span>
            <span>🔁 {formatNumber(post.engagement.shares)}</span>
            <span>👁 {formatNumber(post.engagement.views)}</span>
            {post.topKeywords && post.topKeywords.length > 0 && (
              <span className="flex gap-1 ml-auto">
                {post.topKeywords.slice(0, 3).map((k) => (
                  <span
                    key={k}
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                  >
                    {k}
                  </span>
                ))}
              </span>
            )}
          </div>

          {/* Sentiment breakdown (optional) */}
          {post.sentimentBreakdown && (
            <div className="flex items-center gap-0.5 mt-2 h-1 rounded-full overflow-hidden">
              <span style={{ flex: post.sentimentBreakdown.positive, background: 'var(--success)' }} />
              <span style={{ flex: post.sentimentBreakdown.neutral, background: 'var(--text-faint)' }} />
              <span style={{ flex: post.sentimentBreakdown.negative, background: 'var(--danger)' }} />
            </div>
          )}

          {/* Comments toggle */}
          <button
            onClick={() => onToggleExpand(post.id)}
            className="mt-2 flex items-center gap-1 text-[11px] font-medium"
            style={{ color: 'var(--accent)' }}
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Hide comments' : `Show comments (${post.commentCount})`}
          </button>

          <ReportCommentThread postId={post.id} expanded={expanded} />
        </div>
      </div>
    </div>
  );
}

export const ReportPostRow = memo(ReportPostRowImpl, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    prev.selected === next.selected &&
    prev.expanded === next.expanded &&
    prev.onToggleSelect === next.onToggleSelect &&
    prev.onToggleExpand === next.onToggleExpand
  );
});
