'use client';

import { Tag } from './Tag';
import clsx from 'clsx';

interface ActiveFilter {
  key: string;
  label: string;
  color?: string;
}

interface ChipFilterProps {
  activeFilters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function ChipFilter({ activeFilters, onRemove, onClearAll, className }: ChipFilterProps) {
  if (activeFilters.length === 0) return null;

  return (
    <div className={clsx('flex flex-wrap items-center gap-1.5', className)}>
      {activeFilters.map(f => (
        <Tag key={f.key} label={f.label} color={f.color} removable onRemove={() => onRemove(f.key)} />
      ))}
      {onClearAll && activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-[10px] font-medium px-2 py-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
