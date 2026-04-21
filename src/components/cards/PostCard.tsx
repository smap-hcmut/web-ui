'use client';

import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import clsx from 'clsx';

interface PostCardProps {
  author: string;
  content: string;
  platform: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: number;
  time: string;
  className?: string;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const sentimentVariant = { positive: 'success', negative: 'danger', neutral: 'warning' } as const;

export function PostCard({ author, content, platform, sentiment, engagement, time, className }: PostCardProps) {
  return (
    <div
      className={clsx('rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px]', className)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            {author.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{author}</p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{platform} · {time}</p>
          </div>
        </div>
        <div className="shrink-0">
          <Badge variant={sentimentVariant[sentiment]}>{sentiment}</Badge>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed mb-3 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
        {content}
      </p>

      <div className="flex items-center gap-3 md:gap-4 flex-wrap" style={{ color: 'var(--text-muted)' }}>
        <span className="inline-flex items-center gap-1 text-[11px] tabular-nums whitespace-nowrap">
          <Heart className="w-3 h-3 shrink-0" /> {formatNum(engagement)}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] tabular-nums whitespace-nowrap">
          <MessageCircle className="w-3 h-3 shrink-0" /> {formatNum(Math.floor(engagement * 0.12))}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] tabular-nums whitespace-nowrap">
          <Share2 className="w-3 h-3 shrink-0" /> {formatNum(Math.floor(engagement * 0.05))}
        </span>
      </div>
    </div>
  );
}
