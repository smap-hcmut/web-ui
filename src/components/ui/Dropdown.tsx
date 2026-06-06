'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function Dropdown({ options, value, onChange, placeholder = 'Select...', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 w-full text-[12px] px-3 py-2 rounded-xl transition-all duration-200"
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        {selected?.icon && <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{selected.icon}</span>}
        <span className="flex-1 text-left truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          className={clsx('w-3.5 h-3.5 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 py-1 rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex items-center gap-2 w-full text-[12px] px-3 py-2 transition-colors"
              style={{
                color: opt.value === value ? 'var(--accent)' : 'var(--text-primary)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {opt.icon && <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{opt.icon}</span>}
              <span className="flex-1 text-left">{opt.label}</span>
              {opt.value === value && <Check className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
