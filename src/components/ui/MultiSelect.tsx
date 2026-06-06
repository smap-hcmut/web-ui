'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Tag } from './Tag';
import clsx from 'clsx';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, values, onChange, placeholder = 'Select...', className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open]);

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  };

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 w-full min-h-[36px] text-[12px] px-3 py-1.5 rounded-xl transition-all duration-200"
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex-1 flex flex-wrap gap-1 text-left">
          {values.length === 0 && (
            <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
          )}
          {values.map(v => {
            const opt = options.find(o => o.value === v);
            return (
              <Tag
                key={v}
                label={opt?.label ?? v}
                removable
                onRemove={() => toggle(v)}
              />
            );
          })}
        </div>
        <ChevronDown
          className={clsx('w-3.5 h-3.5 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 py-1 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto"
          style={{
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {options.map(opt => {
            const checked = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="flex items-center gap-2 w-full text-[12px] px-3 py-2 transition-colors"
                style={{ color: 'var(--text-primary)', background: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    background: checked ? 'var(--accent)' : 'transparent',
                    border: checked ? 'none' : '1.5px solid var(--input-border)',
                  }}
                >
                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="flex-1 text-left">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
