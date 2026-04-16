'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsiblePanel({ title, children, defaultOpen = true, className }: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={clsx('rounded-2xl overflow-hidden', className)}
      style={{ border: '1px solid var(--border)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-4 py-3 transition-colors"
        style={{ background: 'var(--bg-hover)' }}
      >
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <ChevronDown
          className={clsx('w-4 h-4 transition-transform duration-300', open && 'rotate-180')}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>
      <div
        className="transition-all duration-300 overflow-hidden"
        style={{
          maxHeight: open ? 500 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
