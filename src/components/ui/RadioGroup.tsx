'use client';

import clsx from 'clsx';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (v: string) => void;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function RadioGroup({ options, value, onChange, direction = 'horizontal', className }: RadioGroupProps) {
  return (
    <div className={clsx('flex gap-3', direction === 'vertical' ? 'flex-col' : 'items-center', className)}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <label
            key={opt.value}
            className="inline-flex items-center gap-2 cursor-pointer select-none"
            onClick={() => onChange(opt.value)}
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
              style={{
                border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--input-border)',
              }}
            >
              {active && (
                <span
                  className="w-2 h-2 rounded-full transition-transform duration-200"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </span>
            <span className="text-[12px]" style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {opt.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
