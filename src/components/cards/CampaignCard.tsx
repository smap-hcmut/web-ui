'use client';

import { Layers } from 'lucide-react';
import { Badge } from '../ui/Badge';
import clsx from 'clsx';

interface CampaignCardProps {
  name: string;
  description?: string;
  mentions: number;
  engagement: number;
  sentiment: number;
  childCount: number;
  className?: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function CampaignCard({ name, description, mentions, engagement, sentiment, childCount, className }: CampaignCardProps) {
  return (
    <div
      className={clsx('rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px]', className)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-subtle)' }}
          >
            <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
            {description && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{description}</p>}
          </div>
        </div>
        <Badge variant={sentiment >= 70 ? 'success' : sentiment >= 40 ? 'warning' : 'danger'}>
          {sentiment}%
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-hover)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Mentions</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmt(mentions)}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-hover)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Engage</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmt(engagement)}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'var(--bg-hover)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Items</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{childCount}</p>
        </div>
      </div>
    </div>
  );
}
