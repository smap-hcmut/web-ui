'use client';

import { X } from 'lucide-react';
import clsx from 'clsx';

interface TagProps {
  label: string;
  icon?: React.ReactNode;
  color?: string;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ label, icon, color, removable, onRemove, className }: TagProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-[11px] font-medium rounded-lg px-2 py-1 transition-colors',
        className,
      )}
      style={{
        background: color ? `${color}15` : 'var(--bg-hover)',
        color: color || 'var(--text-secondary)',
        border: `1px solid ${color ? `${color}25` : 'var(--border)'}`,
      }}
    >
      {icon && <span className="shrink-0 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
      {label}
      {removable && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRemove?.(); } }}
          className="ml-0.5 p-0.5 rounded hover:opacity-70 transition-opacity cursor-pointer"
          style={{ color: color || 'var(--text-muted)' }}
        >
          <X className="w-2.5 h-2.5" />
        </span>
      )}
    </span>
  );
}
