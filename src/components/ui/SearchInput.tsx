'use client';

import { Search, X } from 'lucide-react';
import clsx from 'clsx';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onClear?: () => void;
  className?: string;
}

export function SearchInput({ placeholder = 'Search...', value, onChange, onClear, className }: SearchInputProps) {
  return (
    <div className={clsx('relative', className)}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[12px] pl-8 pr-8 py-2 rounded-xl outline-none transition-all duration-200"
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          color: 'var(--text-primary)',
        }}
        onFocus={(e) => { e.currentTarget.style.boxShadow = 'var(--ring)'; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
      />
      {value && (
        <button
          onClick={() => { onChange(''); onClear?.(); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
