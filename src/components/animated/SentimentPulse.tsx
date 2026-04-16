'use client';

interface SentimentPulseProps {
  value: number; // 0-100
  size?: number;
  showLabel?: boolean;
  className?: string;
}

const getConfig = (v: number) => {
  if (v >= 70) return { color: '#10b981', label: 'Positive', emoji: '↑' };
  if (v >= 40) return { color: '#f59e0b', label: 'Neutral', emoji: '→' };
  return { color: '#ef4444', label: 'Negative', emoji: '↓' };
};

export function SentimentPulse({ value, size = 64, showLabel = true, className }: SentimentPulseProps) {
  const pct = Math.max(0, Math.min(100, value));
  const cfg = getConfig(pct);
  const r = size / 2;
  const strokeW = size * 0.08;
  const innerR = r - strokeW * 2;
  const circumference = 2 * Math.PI * innerR;
  const dash = (pct / 100) * circumference;

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className ?? ''}`}>
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size,
          height: size,
          animation: `sentimentPulse ${pct >= 70 ? 2 : pct >= 40 ? 3 : 1.5}s ease-in-out infinite`,
        }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${cfg.color}20 30%, transparent 70%)`,
          }}
        />

        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle cx={r} cy={r} r={innerR} fill="none" stroke="var(--bg-hover)" strokeWidth={strokeW} />
          {/* Value */}
          <circle
            cx={r} cy={r} r={innerR}
            fill="none"
            stroke={cfg.color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold tabular-nums" style={{ color: cfg.color, fontSize: size * 0.24 }}>
            {pct}
          </span>
        </div>
      </div>

      {showLabel && (
        <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
          {cfg.emoji} {cfg.label}
        </span>
      )}
    </div>
  );
}
