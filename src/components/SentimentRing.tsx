"use client";

import { useEffect, useState } from "react";

interface SentimentRingProps {
  score: number;
  breakdown: { positive: number; neutral: number; negative: number };
}

export function SentimentRing({ score, breakdown }: SentimentRingProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const size = 160;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5">
      {/* Ring */}
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient
              id="sentiment-grad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>

          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="7"
          />

          {/* Progress ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#sentiment-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            style={{
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: "drop-shadow(0 0 8px rgba(52, 211, 153, 0.25))",
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums tracking-tight">
            {score}%
          </span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
            Sentiment
          </span>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="w-full max-w-[200px] space-y-2">
        <BreakdownBar
          label="Positive"
          value={breakdown.positive}
          color="bg-emerald-400"
        />
        <BreakdownBar
          label="Neutral"
          value={breakdown.neutral}
          color="bg-amber-400"
        />
        <BreakdownBar
          label="Negative"
          value={breakdown.negative}
          color="bg-red-400"
        />
      </div>
    </div>
  );
}

function BreakdownBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/30 w-14 text-right">{label}</span>
      <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} opacity-70 transition-all duration-1000`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] text-white/40 tabular-nums w-7">
        {value}%
      </span>
    </div>
  );
}
