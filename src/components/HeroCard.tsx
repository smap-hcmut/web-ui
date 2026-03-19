import { Activity } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { PlatformIcon } from "./icons/PlatformIcon";
import { MiniChart } from "./MiniChart";

interface HeroCardProps {
  total: number;
  change: number;
  trend: number[];
  platforms: { platform: "tiktok" | "facebook" | "youtube"; count: number }[];
}

export function HeroCard({ total, change, trend, platforms }: HeroCardProps) {
  return (
    <div className="glass h-full p-7 flex flex-col">
      {/* Inner subtle glow */}
      <div
        className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Label */}
        <div className="flex items-center gap-2 mb-auto">
          <div className="p-1.5 rounded-lg bg-white/[0.04]">
            <Activity className="w-3.5 h-3.5 text-white/40" />
          </div>
          <span className="text-[11px] text-white/30 uppercase tracking-[0.15em] font-medium">
            Total Mentions
          </span>
        </div>

        {/* Big number */}
        <div className="my-6">
          <div className="text-5xl font-bold tracking-tight leading-none">
            <AnimatedNumber
              value={total}
              className="tabular-nums"
            />
          </div>

          {/* Change */}
          <div className="flex items-center gap-2.5 mt-3">
            <span className="text-[12px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg">
              +{change}%
            </span>
            <span className="text-[12px] text-white/20">vs last week</span>
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="flex items-center gap-5 mb-5">
          {platforms.map(({ platform, count }) => (
            <div key={platform} className="flex items-center gap-1.5">
              <span className="text-white/30">
                <PlatformIcon platform={platform} size={13} />
              </span>
              <span className="text-[12px] text-white/40 tabular-nums">
                {count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-auto">
          <MiniChart data={trend} color="rgba(255,255,255,0.5)" height={56} />
        </div>
      </div>
    </div>
  );
}
