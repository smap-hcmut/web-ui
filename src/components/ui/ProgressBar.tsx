'use client';

import clsx from 'clsx';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeH = { sm: 'h-1', md: 'h-2', lg: 'h-3' };

export function ProgressBar({ value, color, showLabel, size = 'md', className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Progress</span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{pct}%</span>
        </div>
      )}
      <div className={clsx('w-full rounded-full overflow-hidden', sizeH[size])} style={{ background: 'var(--bg-hover)' }}>
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out')}
          style={{
            width: `${pct}%`,
            background: color || 'var(--accent)',
          }}
        />
      </div>
    </div>
  );
}
