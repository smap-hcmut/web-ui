'use client';

import { Check, Minus } from 'lucide-react';
import clsx from 'clsx';

interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  indeterminate?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onChange, label, indeterminate, disabled, className }: CheckboxProps) {
  const active = checked || indeterminate;

  return (
    <label
      className={clsx(
        'inline-flex items-center gap-2 cursor-pointer select-none',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      <button
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all duration-200"
        style={{
          background: active ? 'var(--accent)' : 'transparent',
          border: active ? 'none' : '1.5px solid var(--input-border)',
        }}
      >
        {checked && !indeterminate && <Check className="w-2.5 h-2.5 text-white" />}
        {indeterminate && <Minus className="w-2.5 h-2.5 text-white" />}
      </button>
      {label && (
        <span className="text-[12px]" style={{ color: 'var(--text-primary)' }}>{label}</span>
      )}
    </label>
  );
}
