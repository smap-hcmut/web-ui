'use client';

import { useState } from 'react';
import clsx from 'clsx';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  showLegend?: boolean;
  className?: string;
}

export function DonutChart({ segments, size = 140, showLegend = true, className }: DonutChartProps) {
  const [tipIdx, setTipIdx] = useState<number | null>(null);
  const [mouse, setMouse] = useState<{ cx: number; cy: number } | null>(null);

  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const cxC = size / 2, cyC = size / 2;
  const r = (size - 20) / 2;
  const strokeW = size * 0.14;
  const circumference = 2 * Math.PI * r;

  let accum = 0;
  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const offset = -accum * circumference + circumference * 0.25;
    accum += pct;
    return { ...seg, pct, dash, offset, accumEnd: accum };
  });

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * size;
    const my = (e.clientY - rect.top) / rect.height * size;
    const dx = mx - cxC;
    const dy = my - cyC;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < r - strokeW / 2 || dist > r + strokeW / 2) {
      setTipIdx(null);
      setMouse(null);
      return;
    }

    let angle = Math.atan2(dx, -dy);
    if (angle < 0) angle += 2 * Math.PI;
    const pos = angle / (2 * Math.PI);

    for (let i = 0; i < arcs.length; i++) {
      if (pos <= arcs[i].accumEnd) {
        setTipIdx(i);
        setMouse({ cx: e.clientX, cy: e.clientY });
        break;
      }
    }
  };

  return (
    <div className={clsx('flex flex-wrap items-center justify-center gap-4 md:gap-6 min-w-0 w-full', className)}>
      <div
        className="relative min-w-0"
        style={{ width: size, height: size, maxWidth: '100%', aspectRatio: '1 / 1' }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          preserveAspectRatio="xMidYMid meet"
          width="100%" height="100%"
          onMouseMove={handleMove}
          onMouseLeave={() => { setTipIdx(null); setMouse(null); }}
          className="cursor-pointer block"
        >
          {/* Background track */}
          <circle cx={cxC} cy={cyC} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={strokeW} />
          {/* Segments */}
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cxC} cy={cyC} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={tipIdx === i ? strokeW + 3 : strokeW}
              strokeLinecap="round"
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={arc.offset}
              style={{ transition: 'stroke-width 150ms ease-out' }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total}
          </span>
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Total</span>
        </div>
      </div>

      {showLegend && (
        <div className="space-y-2 min-w-0 flex-1">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
              <span className="text-[11px] font-bold tabular-nums ml-auto shrink-0" style={{ color: 'var(--text-primary)' }}>
                {((seg.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tipIdx !== null && mouse && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-[11px]"
          style={{
            left: mouse.cx, top: mouse.cy,
            transform: 'translate(-50%, calc(-100% - 12px))',
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            whiteSpace: 'nowrap',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: arcs[tipIdx].color }} />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{arcs[tipIdx].label}</span>
          </div>
          <div className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-bold tabular-nums">{(arcs[tipIdx].pct * 100).toFixed(0)}%</span>
            {' · '}{arcs[tipIdx].value} items
          </div>
        </div>
      )}
    </div>
  );
}
