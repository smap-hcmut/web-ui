'use client';

import clsx from 'clsx';

interface RankItem {
  label: string;
  value: number;
  color?: string;
}

interface RankListProps {
  items: RankItem[];
  maxItems?: number;
  startRank?: number;
  className?: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function RankList({ items, maxItems = 10, startRank = 1, className }: RankListProps) {
  const display = items.slice(0, maxItems);
  const maxVal = Math.max(...display.map(i => i.value), 1);

  return (
    <div className={clsx('space-y-2', className)}>
      {display.map((item, i) => {
        const rank = startRank + i;
        return (
        <div key={i} className="flex items-center gap-3">
          <span
            className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0"
            style={{
              background: rank <= 3 ? 'var(--accent-subtle)' : 'var(--bg-hover)',
              color: rank <= 3 ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {rank}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
              <span className="text-[11px] font-bold tabular-nums ml-2 shrink-0" style={{ color: 'var(--text-secondary)' }}>
                {fmt(item.value)}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(item.value / maxVal) * 100}%`,
                  background: item.color || 'var(--accent)',
                }}
              />
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
