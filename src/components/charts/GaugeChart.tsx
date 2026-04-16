'use client';

interface GaugeChartProps {
  value: number; // 0-100
  label?: string;
  size?: number;
  thresholds?: { value: number; color: string }[];
  className?: string;
}

const DEFAULT_THRESHOLDS = [
  { value: 40, color: '#ef4444' },
  { value: 70, color: '#f59e0b' },
  { value: 100, color: '#10b981' },
];

export function GaugeChart({ value, label, size = 160, thresholds = DEFAULT_THRESHOLDS, className }: GaugeChartProps) {
  const cx = size / 2, cy = size * 0.58;
  const r = size * 0.38;
  const strokeW = size * 0.1;

  // Arc from 180deg to 0deg (half circle)
  const startAngle = Math.PI;
  const sweepAngle = Math.PI;
  const circumference = Math.PI * r;

  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * circumference;

  // Active color based on thresholds
  const activeColor = thresholds.reduce((c, t) => (pct <= t.value ? c || t.color : c), '' as string) || thresholds[thresholds.length - 1].color;

  // Needle angle: maps 0-100 to PI-0 (left to right)
  const needleAngle = startAngle - (pct / 100) * sweepAngle;
  const needleLen = r - strokeW * 0.3;
  const nx = cx + Math.cos(needleAngle) * needleLen;
  const ny = cy + Math.sin(needleAngle) * needleLen;

  // Arc path helper
  const arcPath = (radius: number, startA: number, endA: number) => {
    const sx = cx + Math.cos(startA) * radius;
    const sy = cy + Math.sin(startA) * radius;
    const ex = cx + Math.cos(endA) * radius;
    const ey = cy + Math.sin(endA) * radius;
    return `M ${sx} ${sy} A ${radius} ${radius} 0 0 1 ${ex} ${ey}`;
  };

  return (
    <div className={className}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Track */}
        <path
          d={arcPath(r, Math.PI, 0)}
          fill="none"
          stroke="var(--bg-hover)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={arcPath(r, Math.PI, 0)}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-all duration-1000 ease-out"
        />

        {/* Needle */}
        <line
          x1={cx} y1={cy} x2={nx} y2={ny}
          stroke="var(--text-primary)"
          strokeWidth={2}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <circle cx={cx} cy={cy} r={4} fill="var(--text-primary)" />

        {/* Value text */}
        <text x={cx} y={cy - 14} textAnchor="middle" fill="var(--text-primary)" fontSize={size * 0.18} fontWeight="700" fontFamily="system-ui">
          {pct}
        </text>

        {/* Label */}
        {label && (
          <text x={cx} y={cy + size * 0.08} textAnchor="middle" fill="var(--text-muted)" fontSize={10} fontFamily="system-ui">
            {label}
          </text>
        )}

        {/* Min / Max */}
        <text x={cx - r - 2} y={cy + 14} textAnchor="middle" fill="var(--text-faint)" fontSize={9} fontFamily="system-ui">0</text>
        <text x={cx + r + 2} y={cy + 14} textAnchor="middle" fill="var(--text-faint)" fontSize={9} fontFamily="system-ui">100</text>
      </svg>
    </div>
  );
}
