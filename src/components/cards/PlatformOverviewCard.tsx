'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { PlatformIcon } from '../icons/PlatformIcon';
import { Badge } from '../ui/Badge';
import type { Platform } from '@/lib/types';
import clsx from 'clsx';

interface PlatformOverviewCardProps {
  name: string;
  platform: Platform;
  mentions: number;
  mentionsChange: number;
  engagement: string;
  sentiment: number;
  status: 'active' | 'inactive';
  color: string;
  className?: string;
}

export function PlatformOverviewCard({
  name, platform, mentions, mentionsChange, engagement, sentiment, status, color, className,
}: PlatformOverviewCardProps) {
  const isUp = mentionsChange >= 0;
  const sentimentColor = sentiment >= 10 ? 'var(--success)' : sentiment <= -10 ? 'var(--danger)' : 'var(--warning)';
  const sentimentText = `${sentiment > 0 ? '+' : ''}${sentiment}`;

  return (
    <div
      className={clsx('rounded-2xl p-4 md:p-5 transition-all duration-300 hover:translate-y-[-2px] min-w-0', className)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: color }}
          >
            <PlatformIcon platform={platform} size={16} />
          </div>
          <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{name}</span>
        </div>
        <div className="shrink-0">
          <Badge variant={status === 'active' ? 'success' : 'neutral'} dot>{status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider mb-1 truncate" style={{ color: 'var(--text-muted)' }}>Mentions</p>
          <p className="text-base md:text-lg font-bold tabular-nums truncate" style={{ color: 'var(--text-primary)' }}>
            {mentions.toLocaleString()}
          </p>
          <span className={clsx('inline-flex items-center gap-0.5 text-[10px] font-semibold')} style={{ color: isUp ? 'var(--success)' : 'var(--danger)' }}>
            {isUp ? <TrendingUp className="w-3 h-3 shrink-0" /> : <TrendingDown className="w-3 h-3 shrink-0" />}
            {isUp ? '+' : ''}{mentionsChange}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider mb-1 truncate" style={{ color: 'var(--text-muted)' }}>Engagement</p>
          <p className="text-base md:text-lg font-bold tabular-nums truncate" style={{ color: 'var(--text-primary)' }}>{engagement}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider mb-1 truncate" style={{ color: 'var(--text-muted)' }}>Net Sent.</p>
          <p className="text-base md:text-lg font-bold tabular-nums truncate" style={{ color: sentimentColor }}>
            {sentimentText}
          </p>
        </div>
      </div>
    </div>
  );
}
