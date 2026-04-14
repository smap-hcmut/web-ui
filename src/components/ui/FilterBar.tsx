'use client';

import clsx from 'clsx';

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-2 p-2 rounded-2xl',
        className,
      )}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {children}
    </div>
  );
}
