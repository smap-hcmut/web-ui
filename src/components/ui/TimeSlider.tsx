'use client';

import clsx from 'clsx';

interface TimeSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  marks?: { value: number; label: string }[];
  className?: string;
}

export function TimeSlider({ min, max, value, onChange, step = 1, marks, className }: TimeSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx('w-full', className)}>
      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full" style={{ background: 'var(--bg-hover)' }}>
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ width: `${pct}%`, background: 'var(--accent)' }}
          />
        </div>
        {/* Thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute w-4 h-4 rounded-full shadow-md pointer-events-none transition-all duration-100"
          style={{
            left: `calc(${pct}% - 8px)`,
            background: 'var(--accent)',
            border: '2px solid var(--bg-surface-solid)',
            boxShadow: 'var(--shadow-md)',
          }}
        />
      </div>

      {marks && (
        <div className="flex items-center justify-between mt-1 px-1">
          {marks.map(m => (
            <span
              key={m.value}
              className="text-[9px] font-medium"
              style={{ color: m.value === value ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
