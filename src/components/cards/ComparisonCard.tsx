'use client';

import clsx from 'clsx';

interface ComparisonItem {
  label: string;
  color: string;
  metrics: Record<string, number>;
}

interface ComparisonCardProps {
  items: [ComparisonItem, ComparisonItem];
  metricKeys: { key: string; label: string }[];
  className?: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function ComparisonCard({ items, metricKeys, className }: ComparisonCardProps) {
  const [a, b] = items;

  return (
    <div
      className={clsx('rounded-2xl p-5', className)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Headers */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: a.color }} />
          <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{a.label}</span>
        </div>
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>VS</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{b.label}</span>
          <div className="w-3 h-3 rounded-full" style={{ background: b.color }} />
        </div>
      </div>

      {/* Metric bars */}
      <div className="space-y-3">
        {metricKeys.map(({ key, label }) => {
          const va = a.metrics[key] ?? 0;
          const vb = b.metrics[key] ?? 0;
          const total = va + vb || 1;
          const pctA = (va / total) * 100;

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold tabular-nums" style={{ color: a.color }}>{fmt(va)}</span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: b.color }}>{fmt(vb)}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-hover)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctA}%`, background: a.color }} />
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${100 - pctA}%`, background: b.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
