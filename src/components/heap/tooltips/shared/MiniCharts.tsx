'use client';

/**
 * Tiny inline charts for tooltips — sentiment donut + engagement bar.
 * Pure SVG, no dependencies.
 */

/* ── Sentiment Donut ── */

interface DonutProps {
  value: number; // 0-100
  size?: number;
}

const DONUT_COLORS = [
  { min: 70, track: '#dcfce7', fill: '#059669' },
  { min: 40, track: '#fef3c7', fill: '#d97706' },
  { min: 0,  track: '#fde2e2', fill: '#dc2626' },
];

export function SentimentDonut({ value, size = 36 }: DonutProps) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (value / 100) * circumference;
  const colors = DONUT_COLORS.find(c => value >= c.min) ?? DONUT_COLORS[2];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={colors.track} strokeWidth={3}
        />
        {/* Value arc */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={colors.fill} strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <span
        className="absolute text-[8px] font-bold tabular-nums"
        style={{ color: colors.fill }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Engagement Spark Bars ── */

interface SparkBarsProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function SparkBars({ data, width = 56, height = 24, color = '#8b5cf6' }: SparkBarsProps) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const barW = Math.max(2, (width - (data.length - 1) * 1.5) / data.length);
  const gap = 1.5;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * height);
        const x = i * (barW + gap);
        const y = height - h;
        const opacity = 0.35 + (v / max) * 0.65;
        return (
          <rect
            key={i}
            x={x} y={y}
            width={barW} height={h}
            rx={1}
            fill={color}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}

/* ── Mini Area Chart ── */

interface MiniAreaProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function MiniArea({ data, width = 64, height = 20, color = '#0891b2' }: MiniAreaProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / range) * (height - 2) - 1,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`area-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#area-grad-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      {/* Endpoint dot */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2} fill={color} />
    </svg>
  );
}
