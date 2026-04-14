'use client';

export interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  height?: number;
  className?: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function FunnelChart({ stages, height = 260, className }: FunnelChartProps) {
  if (!stages.length) return null;

  const maxVal = stages[0].value || 1;
  const vw = 400;
  const stageH = height / stages.length;
  const minBarW = vw * 0.2;
  const maxBarW = vw * 0.85;

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${vw} ${height}`} className="w-full" style={{ height }}>
        {stages.map((stage, i) => {
          const pct = stage.value / maxVal;
          const barW = minBarW + (maxBarW - minBarW) * pct;
          const x = (vw - barW) / 2;
          const y = i * stageH;
          const barH = stageH * 0.7;
          const convPct = i > 0 ? ((stage.value / stages[i - 1].value) * 100).toFixed(0) : '100';

          // Trapezoid: current width -> next width
          const nextPct = stages[i + 1] ? stages[i + 1].value / maxVal : pct * 0.7;
          const nextBarW = minBarW + (maxBarW - minBarW) * nextPct;
          const nx = (vw - nextBarW) / 2;

          return (
            <g key={i}>
              {/* Trapezoid shape */}
              <path
                d={`
                  M ${x} ${y + 2}
                  L ${x + barW} ${y + 2}
                  L ${nx + nextBarW} ${y + stageH - 2}
                  L ${nx} ${y + stageH - 2}
                  Z
                `}
                fill={stage.color}
                opacity={0.8}
                rx={4}
                className="transition-all duration-500"
              />

              {/* Label */}
              <text
                x={vw / 2}
                y={y + stageH * 0.4}
                textAnchor="middle"
                fill="#fff"
                fontSize={13}
                fontWeight="600"
                fontFamily="system-ui"
              >
                {stage.label}
              </text>

              {/* Value */}
              <text
                x={vw / 2}
                y={y + stageH * 0.68}
                textAnchor="middle"
                fill="rgba(255,255,255,0.75)"
                fontSize={11}
                fontFamily="system-ui"
              >
                {fmt(stage.value)} {i > 0 ? `(${convPct}%)` : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
