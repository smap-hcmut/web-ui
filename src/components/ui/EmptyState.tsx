'use client';

import { Inbox } from 'lucide-react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-hover)' }}
      >
        <span className="[&>svg]:w-5 [&>svg]:h-5" style={{ color: 'var(--text-muted)' }}>
          {icon || <Inbox />}
        </span>
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {description && (
        <p className="text-[12px] max-w-[260px]" style={{ color: 'var(--text-muted)' }}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
