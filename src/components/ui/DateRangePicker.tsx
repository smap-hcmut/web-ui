'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import clsx from 'clsx';

export interface DateRange {
  label: string;
  value: string;
}

const DEFAULT_PRESETS: DateRange[] = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
];

interface DateRangePickerProps {
  value: string;
  onChange: (v: string) => void;
  presets?: DateRange[];
  className?: string;
}

export function DateRangePicker({ value, onChange, presets = DEFAULT_PRESETS, className }: DateRangePickerProps) {
  return (
    <div className={clsx('flex items-center gap-0.5 p-0.5 rounded-xl', className)} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}>
      <div className="px-2 shrink-0" style={{ color: 'var(--text-muted)' }}>
        <Calendar className="w-3.5 h-3.5" />
      </div>
      {presets.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all duration-200"
          style={{
            background: value === p.value ? 'var(--accent)' : 'transparent',
            color: value === p.value ? '#fff' : 'var(--text-muted)',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
