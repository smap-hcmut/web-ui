'use client';

interface LineSeries {
  label: string;
  data: number[];
  color: string;
}

interface LineChartProps {
  series: LineSeries[];
  xLabels?: string[];
  height?: number;
  showLegend?: boolean;
  compact?: boolean;
  className?: string;
}

export function LineChart({ series, xLabels, height = 240, showLegend = true, compact = false, className }: LineChartProps) {
  if (!series.length || !series[0].data.length) return null;

  const allValues = series.flatMap(s => s.data);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const pLen = series[0].data.length;

  const vw = 600;
  const padL = compact ? 4 : 52, padR = compact ? 4 : 20, padT = compact ? 4 : 16, padB = compact ? 4 : (xLabels ? 32 : 16);
  const chartW = vw - padL - padR;
  const chartH = height - padT - padB;
  const stepX = pLen > 1 ? chartW / (pLen - 1) : 0;
  const yTicks = 4;
  const yStep = range / yTicks;
  const xLabelStep = xLabels ? Math.max(1, Math.ceil(xLabels.length / 6)) : 1;
  const zeroY = min < 0 && max > 0 ? padT + chartH - (chartH * (0 - min)) / range : null;

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${vw} ${height}`} className="w-full" style={{ height }}>
        {/* Y grid + labels */}
        {!compact && Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = min + yStep * i;
          const y = padT + chartH - (chartH * (val - min)) / range;
          return (
            <g key={i}>
              <line x1={padL} x2={vw - padR} y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize={11} fontFamily="system-ui">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {zeroY !== null && (
          <line x1={padL} x2={vw - padR} y1={zeroY} y2={zeroY} stroke="var(--text-muted)" strokeWidth={1.2} opacity={0.45} />
        )}

        {/* X labels */}
        {!compact && xLabels?.map((label, i) => {
          if (i !== 0 && i !== xLabels.length - 1 && i % xLabelStep !== 0) return null;
          const denom = Math.max(xLabels.length - 1, 1);
          const x = padL + (i / denom) * chartW;
          return (
            <text key={i} x={x} y={height - 6} textAnchor="middle" fill="var(--text-muted)" fontSize={11} fontFamily="system-ui">
              {label}
            </text>
          );
        })}

        {/* Series */}
        {series.map((s, si) => {
          const points = s.data.map((v, i) => ({
            x: padL + i * stepX,
            y: padT + chartH - ((v - min) / range) * chartH,
          }));
          const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          const areaD = `${d} L${points[points.length - 1].x},${padT + chartH} L${points[0].x},${padT + chartH} Z`;

          return (
            <g key={si}>
              <defs>
                <linearGradient id={`lc-grad-${si}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <path d={areaD} fill={`url(#lc-grad-${si})`} />
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {/* Data points */}
              {points.map((p, pi) => (
                <circle key={pi} cx={p.x} cy={p.y} r={3} fill="var(--bg-surface-solid)" stroke={s.color} strokeWidth={2} opacity={0} className="hover:opacity-100 transition-opacity">
                  <title>{`${s.label}: ${s.data[pi]}`}</title>
                </circle>
              ))}
              {/* Endpoint dot */}
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill={s.color} />
            </g>
          );
        })}
      </svg>

      {showLegend && series.length > 1 && (
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
