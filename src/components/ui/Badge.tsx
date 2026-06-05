'use client';

import clsx from 'clsx';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral' | 'info' | 'accent';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string; dot: string }> = {
  success:  { bg: 'var(--success-bg)', color: 'var(--success)', dot: 'var(--success)' },
  danger:   { bg: 'var(--danger-bg)',  color: 'var(--danger)',  dot: 'var(--danger)' },
  warning:  { bg: 'var(--warning-bg)', color: 'var(--warning)', dot: 'var(--warning)' },
  info:     { bg: 'var(--info-bg)',    color: 'var(--info)',    dot: 'var(--info)' },
  neutral:  { bg: 'var(--bg-hover)',   color: 'var(--text-muted)', dot: 'var(--text-muted)' },
  accent:   { bg: 'var(--accent-subtle)', color: 'var(--accent)', dot: 'var(--accent)' },
};

export function Badge({ children, variant = 'neutral', size = 'sm', dot, className }: BadgeProps) {
  const s = variantStyles[variant];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1',
        className,
      )}
      style={{ background: s.bg, color: s.color }}
    >
      {dot && (
        <span
          className="relative flex h-1.5 w-1.5 shrink-0"
        >
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: s.dot }}
          />
          <span
            className="relative inline-flex rounded-full h-1.5 w-1.5"
            style={{ background: s.dot }}
          />
        </span>
      )}
      {children}
    </span>
  );
}
