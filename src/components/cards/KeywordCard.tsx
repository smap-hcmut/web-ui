'use client';

import { TrendingUp } from 'lucide-react';
import { Tag } from '../ui/Tag';
import clsx from 'clsx';

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#fe2c55', facebook: '#1877f2', youtube: '#ff0000',
};

interface KeywordCardProps {
  rank: number;
  keyword: string;
  volume: number;
  change: number;
  platforms: string[];
  className?: string;
}

function formatVol(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function KeywordCard({ rank, keyword, volume, change, platforms, className }: KeywordCardProps) {
  return (
    <div
      className={clsx('flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 hover:translate-y-[-1px]', className)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
        style={{
          background: rank <= 3 ? 'var(--accent-subtle)' : 'var(--bg-hover)',
          color: rank <= 3 ? 'var(--accent)' : 'var(--text-muted)',
        }}
      >
        {rank}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{keyword}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {platforms.map(p => (
            <Tag key={p} label={p.toUpperCase()} color={PLATFORM_COLORS[p]} />
          ))}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatVol(volume)}</p>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: 'var(--success)' }}>
          <TrendingUp className="w-3 h-3" />+{change}%
        </span>
      </div>
    </div>
  );
}
