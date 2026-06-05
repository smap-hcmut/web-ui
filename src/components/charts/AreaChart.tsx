'use client';

import { useState, useRef } from 'react';

interface AreaSeries {
  label: string;
  data: number[];
  color: string;
}

interface AreaChartProps {
  series: AreaSeries[];
  xLabels?: string[];
  height?: number;
  className?: string;
}

export function AreaChart({ series, xLabels, height = 220, className }: AreaChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!series.length || !series[0].data.length) return null;

  const allValues = series.flatMap(s => s.data);
  const min = 0;
  const max = Math.max(...allValues) * 1.05;
  const range = max - min || 1;
  const pLen = series[0].data.length;

  const vw = 600;
  const padL = 40, padR = 12, padT = 12, padB = xLabels ? 32 : 12;
  const chartW = vw - padL - padR;
  const chartH = height - padT - padB;
  const stepX = pLen > 1 ? chartW / (pLen - 1) : 0;
  const xLabelStep = xLabels ? Math.max(1, Math.ceil(xLabels.length / 6)) : 1;

  const toY = (v: number) => padT + chartH - ((v - min) / range) * chartH;

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const svgX = (mx / rect.width) * vw;
    if (stepX === 0) {
      setHoverIdx(0);
      return;
    }
    const idx = Math.round((svgX - padL) / stepX);
    if (idx >= 0 && idx < pLen) {
      setHoverIdx(idx);
    } else {
      setHoverIdx(null);
    }
  };

  // Compute tooltip position as percentage of chart container
  const tooltipLeft = hoverIdx !== null ? ((padL + hoverIdx * stepX) / vw) * 100 : 0;
  const tooltipTop = hoverIdx !== null
    ? ((Math.min(...series.map(s => toY(s.data[hoverIdx]))) ) / height) * 100
    : 0;

  return (
    <div className={className} ref={containerRef} style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${vw} ${height}`}
        className="w-full" style={{ height, maxHeight: height }}
        onMouseMove={handleMove}
        onMouseLeave={() => { setHoverIdx(null); }}
      >
        {/* Y grid */}
        {Array.from({ length: 4 }, (_, i) => {
          const val = min + (range / 3) * i;
          const y = toY(val);
          return <line key={i} x1={padL} x2={vw - padR} y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />;
        })}

        {/* X labels */}
        {xLabels?.map((label, i) => {
          if (i !== 0 && i !== xLabels.length - 1 && i % xLabelStep !== 0) return null;
          const denom = Math.max(xLabels.length - 1, 1);
          return (
            <text key={i} x={padL + (i / denom) * chartW} y={height - 6} textAnchor="middle" fill="var(--text-muted)" fontSize={11} fontFamily="system-ui">
              {label}
            </text>
          );
        })}

        {/* Areas + Lines */}
        {series.map((s, si) => {
          const pts = s.data.map((v, i) => ({ x: padL + i * stepX, y: toY(v) }));
          const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          const area = `${line} L${pts[pts.length - 1].x},${padT + chartH} L${pts[0].x},${padT + chartH} Z`;

          return (
            <g key={si}>
              <defs>
                <linearGradient id={`ac-g-${si}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#ac-g-${si})`} />
              <path d={line} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {hoverIdx === null && (
                <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={4} fill={s.color} />
              )}
            </g>
          );
        })}

        {/* Crosshair */}
        {hoverIdx !== null && (
          <g>
            <line
              x1={padL + hoverIdx * stepX} y1={padT}
              x2={padL + hoverIdx * stepX} y2={padT + chartH}
              stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="4 4" opacity={0.4}
            />
            {series.map((s, si) => {
              const x = padL + hoverIdx * stepX;
              const y = toY(s.data[hoverIdx]);
              return (
                <circle
                  key={si} cx={x} cy={y} r={5}
                  fill={s.color} stroke="var(--bg-surface-solid)" strokeWidth={2}
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* Crosshair tooltip — positioned relative to chart, anchored to data point */}
      {hoverIdx !== null && (
        <div
          className="absolute z-50 pointer-events-none px-3 py-2.5 rounded-lg text-[11px]"
          style={{
            left: `${tooltipLeft}%`,
            top: `${tooltipTop}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            whiteSpace: 'nowrap',
          }}
        >
          <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {xLabels?.[hoverIdx] ?? `#${hoverIdx + 1}`}
          </div>
          {series.map((s, si) => (
            <div key={si} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              <span className="font-bold tabular-nums ml-auto pl-3" style={{ color: 'var(--text-primary)' }}>
                {Math.round(s.data[hoverIdx]).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {series.length > 1 && (
        <div className="flex items-center gap-5 mt-3 justify-center">
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
