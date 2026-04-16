'use client';

import clsx from 'clsx';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

export function Divider({ orientation = 'horizontal', label, className }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={clsx('self-stretch w-px mx-2', className)}
        style={{ background: 'var(--border)' }}
      />
    );
  }

  if (label) {
    return (
      <div className={clsx('flex items-center gap-3 my-3', className)}>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>
    );
  }

  return (
    <div
      className={clsx('w-full h-px my-3', className)}
      style={{ background: 'var(--border)' }}
    />
  );
}
