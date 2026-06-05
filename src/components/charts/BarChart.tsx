'use client';

import { useState } from 'react';

interface BarCategory {
  label: string;
  values: { key: string; value: number; color: string; formatted?: string }[];
}

interface BarChartProps {
  categories: BarCategory[];
  height?: number;
  stacked?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function BarChart({ categories, height = 240, stacked, showLegend = true, className }: BarChartProps) {
  const [tip, setTip] = useState<{
    cx: number; cy: number;
    label: string; key: string; display: string; color: string;
  } | null>(null);

  if (!categories.length) return null;

  const allValues = stacked
    ? categories.map(c => c.values.reduce((s, v) => s + v.value, 0))
    : categories.flatMap(c => c.values.map(v => v.value));
  const maxVal = Math.max(...allValues, 1);

  const vw = 600;
  const padL = 52, padR = 20, padT = 16, padB = 32;
  const chartW = vw - padL - padR;
  const chartH = height - padT - padB;
  const groupW = chartW / categories.length;
  const barGap = groupW * 0.2;

  const legendItems = categories[0]?.values.map(v => ({ key: v.key, color: v.color })) ?? [];

  const fmt = (v: { value: number; formatted?: string }) =>
    v.formatted ?? (v.value >= 1000 ? `${(v.value / 1000).toFixed(1)}K` : v.value.toFixed(1));

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${vw} ${height}`}
        className="w-full"
        style={{ height }}
        onMouseLeave={() => setTip(null)}
      >
        {/* Y grid */}
        {Array.from({ length: 5 }, (_, i) => {
          const val = (maxVal / 4) * i;
          const y = padT + chartH - (chartH * val) / maxVal;
          return (
            <g key={i}>
              <line x1={padL} x2={vw - padR} y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize={11} fontFamily="system-ui">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {categories.map((cat, ci) => {
          const gx = padL + ci * groupW + barGap / 2;
          const barCount = cat.values.length;
          const bw = stacked ? groupW - barGap : (groupW - barGap) / barCount;

          return (
            <g key={ci}>
              {stacked
                ? (() => {
                    let accY = 0;
                    return cat.values.map((v, vi) => {
                      const h = (v.value / maxVal) * chartH;
                      const y = padT + chartH - accY - h;
                      accY += h;
                      return (
                        <rect
                          key={vi} x={gx} y={y} width={bw} height={h} rx={3}
                          fill={v.color}
                          opacity={tip ? (tip.label === cat.label && tip.key === v.key ? 1 : 0.55) : 0.85}
                          className="cursor-pointer transition-opacity duration-150"
                          onMouseEnter={(e) => setTip({ cx: e.clientX, cy: e.clientY, label: cat.label, key: v.key, display: fmt(v), color: v.color })}
                          onMouseMove={(e) => setTip(t => t ? { ...t, cx: e.clientX, cy: e.clientY } : null)}
                        />
                      );
                    });
                  })()
                : cat.values.map((v, vi) => {
                    const h = (v.value / maxVal) * chartH;
                    const x = gx + vi * bw;
                    const y = padT + chartH - h;
                    return (
                      <rect
                        key={vi} x={x} y={y} width={bw * 0.85} height={h} rx={3}
                        fill={v.color}
                        opacity={tip ? (tip.label === cat.label && tip.key === v.key ? 1 : 0.55) : 0.85}
                        className="cursor-pointer transition-opacity duration-150"
                        onMouseEnter={(e) => setTip({ cx: e.clientX, cy: e.clientY, label: cat.label, key: v.key, display: fmt(v), color: v.color })}
                        onMouseMove={(e) => setTip(t => t ? { ...t, cx: e.clientX, cy: e.clientY } : null)}
                      />
                    );
                  })}
              <text x={gx + (groupW - barGap) / 2} y={height - 8} textAnchor="middle" fill="var(--text-muted)" fontSize={11} fontFamily="system-ui">
                {cat.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-[11px]"
          style={{
            left: tip.cx, top: tip.cy,
            transform: 'translate(-50%, calc(-100% - 12px))',
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            whiteSpace: 'nowrap',
          }}
        >
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{tip.label}</div>
          <div className="flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: tip.color }} />
            {tip.key}: <span className="font-bold tabular-nums">{tip.display}</span>
          </div>
        </div>
      )}

      {showLegend && legendItems.length > 1 && (
        <div className="flex items-center gap-5 mt-3 justify-center">
          {legendItems.map(l => (
            <div key={l.key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: l.color }} />
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{l.key}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
