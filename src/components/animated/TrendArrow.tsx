'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendArrowProps {
  value: number; // percentage change
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 'w-3 h-3', text: 'text-[10px]', pad: 'px-1.5 py-0.5' },
  md: { icon: 'w-4 h-4', text: 'text-[12px]', pad: 'px-2 py-1' },
  lg: { icon: 'w-5 h-5', text: 'text-[14px]', pad: 'px-2.5 py-1.5' },
};

export function TrendArrow({ value, size = 'md', showValue = true, className }: TrendArrowProps) {
  const isUp = value > 0;
  const isFlat = value === 0;
  const s = sizeMap[size];

  const color = isUp ? 'var(--success)' : isFlat ? 'var(--text-muted)' : 'var(--danger)';
  const bg = isUp ? 'var(--success-bg)' : isFlat ? 'var(--bg-hover)' : 'var(--danger-bg)';
  const Icon = isUp ? TrendingUp : isFlat ? Minus : TrendingDown;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg font-bold ${s.pad} ${s.text} ${className ?? ''}`}
      style={{ color, background: bg }}
    >
      <span
        className={s.icon}
        style={{
          display: 'inline-flex',
          animation: isFlat ? 'none' : `trendBounce ${isUp ? 1.5 : 1}s ease-in-out infinite`,
        }}
      >
        <Icon className="w-full h-full" />
      </span>
      {showValue && (
        <span className="tabular-nums">
          {isUp ? '+' : ''}{value}%
        </span>
      )}
    </span>
  );
}
