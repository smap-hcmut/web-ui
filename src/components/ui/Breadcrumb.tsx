'use client';

import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={clsx('flex items-center gap-1', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--text-faint)' }} />}
            <button
              onClick={item.onClick}
              className="text-[12px] font-medium transition-colors hover:underline"
              style={{ color: isLast ? 'var(--text-primary)' : 'var(--text-muted)' }}
              disabled={isLast}
            >
              {item.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
