'use client';

import clsx from 'clsx';

interface ToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ToggleGroupProps {
  options: ToggleOption[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multiple?: boolean;
  className?: string;
}

export function ToggleGroup({ options, value, onChange, multiple, className }: ToggleGroupProps) {
  const selected = multiple ? (value as string[]) : [value as string];

  const toggle = (v: string) => {
    if (multiple) {
      const arr = value as string[];
      onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
    } else {
      onChange(v);
    }
  };

  return (
    <div
      className={clsx('inline-flex items-center gap-0.5 p-0.5 rounded-xl', className)}
      style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
    >
      {options.map(opt => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--text-muted)',
            }}
          >
            {opt.icon && <span className="[&>svg]:w-3 [&>svg]:h-3">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
