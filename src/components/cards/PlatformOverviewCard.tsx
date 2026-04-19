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

  return (
    <div
      className={clsx('rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px]', className)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
            style={{ background: color }}
          >
            <PlatformIcon platform={platform} size={16} />
          </div>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</span>
        </div>
        <Badge variant={status === 'active' ? 'success' : 'neutral'} dot>{status}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Mentions</p>
          <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {mentions.toLocaleString()}
          </p>
          <span className={clsx('inline-flex items-center gap-0.5 text-[10px] font-semibold')} style={{ color: isUp ? 'var(--success)' : 'var(--danger)' }}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? '+' : ''}{mentionsChange}%
          </span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Engagement</p>
          <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{engagement}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Sentiment</p>
          <p className="text-lg font-bold tabular-nums" style={{ color: sentiment >= 70 ? 'var(--success)' : sentiment >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
            {sentiment}%
          </p>
        </div>
      </div>
    </div>
  );
}
