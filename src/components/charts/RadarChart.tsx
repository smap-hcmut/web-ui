'use client';

import { useState } from 'react';

export interface RadarAxis {
  key: string;
  label: string;
  max?: number;
}

export interface RadarSeries {
  label: string;
  color: string;
  values: Record<string, number>;
}

interface RadarChartProps {
  axes: RadarAxis[];
  series: RadarSeries[];
  size?: number;
  showLegend?: boolean;
  className?: string;
}

export function RadarChart({ axes, series, size = 260, showLegend = true, className }: RadarChartProps) {
  const [tip, setTip] = useState<{
    cx: number; cy: number;
    seriesLabel: string; axis: string; value: number; color: string;
  } | null>(null);

  if (!axes.length || !series.length) return null;

  const cx = size / 2, cy = size / 2;
  const r = size * 0.36;
  const rings = 4;
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const pointAt = (angle: number, radius: number) => ({
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  });

  const gridRings = Array.from({ length: rings }, (_, i) => {
    const rr = (r / rings) * (i + 1);
    const pts = Array.from({ length: n }, (_, j) => pointAt(startAngle + j * angleStep, rr));
    return pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  });

  const axisLines = axes.map((_, i) => {
    const p = pointAt(startAngle + i * angleStep, r);
    return { x1: cx, y1: cy, x2: p.x, y2: p.y };
  });

  const seriesData = series.map(s => {
    const pts = axes.map((axis, i) => {
      const max = axis.max ?? 100;
      const val = s.values[axis.key] ?? 0;
      const pct = Math.min(val / max, 1);
      const pos = pointAt(startAngle + i * angleStep, r * pct);
      return { ...pos, val: Math.round(val), axisLabel: axis.label };
    });
    return { ...s, pts };
  });

  const labels = axes.map((axis, i) => {
    const p = pointAt(startAngle + i * angleStep, r + 18);
    return { ...axis, x: p.x, y: p.y };
  });

  return (
    <div className={className}>
      <svg
        width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        onMouseLeave={() => setTip(null)}
      >
        {/* Grid rings */}
        {gridRings.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="var(--border-subtle)" strokeWidth={1} />
        ))}

        {/* Axis lines */}
        {axisLines.map((l, i) => (
          <line key={i} {...l} stroke="var(--border-subtle)" strokeWidth={1} />
        ))}

        {/* Series polygons + dots */}
        {seriesData.map((s, si) => (
          <g key={si}>
            <polygon
              points={s.pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
              fill={s.color}
              fillOpacity={0.12}
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              className="transition-all duration-700"
            />
            {/* Visible dots */}
            {s.pts.map((pt, pi) => (
              <circle key={pi} cx={pt.x} cy={pt.y} r={3} fill={s.color} />
            ))}
            {/* Larger invisible hover targets */}
            {s.pts.map((pt, pi) => (
              <circle
                key={`h-${pi}`}
                cx={pt.x} cy={pt.y} r={10}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={(e) => setTip({
                  cx: e.clientX, cy: e.clientY,
                  seriesLabel: s.label, axis: pt.axisLabel,
                  value: pt.val, color: s.color,
                })}
                onMouseMove={(e) => setTip(t => t ? { ...t, cx: e.clientX, cy: e.clientY } : null)}
              />
            ))}
          </g>
        ))}

        {/* Labels */}
        {labels.map((l, i) => (
          <text key={i} x={l.x} y={l.y + 4} textAnchor="middle" fill="var(--text-muted)" fontSize={11} fontFamily="system-ui">
            {l.label}
          </text>
        ))}
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
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: tip.color }} />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{tip.seriesLabel}</span>
          </div>
          <div className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {tip.axis}: <span className="font-bold tabular-nums">{tip.value}</span>
          </div>
        </div>
      )}

      {showLegend && series.length > 1 && (
        <div className="flex items-center gap-5 mt-2 justify-center">
          {series.map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
