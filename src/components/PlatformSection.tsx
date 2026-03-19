import { PlatformIcon } from "./icons/PlatformIcon";
import { MiniChart } from "./MiniChart";
import type { PlatformData, Platform } from "@/lib/mock-data";
import clsx from "clsx";

const styles: Record<
  Platform,
  {
    glass: string;
    text: string;
    bg: string;
    glow: string;
    gradient: string;
  }
> = {
  tiktok: {
    glass: "glass-tiktok",
    text: "text-platform-tiktok",
    bg: "bg-platform-tiktok/10",
    glow: "#fe2c55",
    gradient:
      "radial-gradient(circle at 100% 0%, rgba(254,44,85,0.06) 0%, transparent 50%)",
  },
  facebook: {
    glass: "glass-facebook",
    text: "text-platform-facebook",
    bg: "bg-platform-facebook/10",
    glow: "#1877f2",
    gradient:
      "radial-gradient(circle at 100% 0%, rgba(24,119,242,0.06) 0%, transparent 50%)",
  },
  youtube: {
    glass: "glass-youtube",
    text: "text-platform-youtube",
    bg: "bg-platform-youtube/10",
    glow: "#ff0000",
    gradient:
      "radial-gradient(circle at 100% 0%, rgba(255,0,0,0.05) 0%, transparent 50%)",
  },
};

interface PlatformSectionProps {
  data: PlatformData;
  index?: number;
}

export function PlatformSection({ data, index = 0 }: PlatformSectionProps) {
  const s = styles[data.platform];

  return (
    <div
      className={clsx(
        "glass p-6 opacity-0 animate-slide-up",
        s.glass
      )}
      style={{ animationDelay: `${(index + 5) * 80}ms` }}
    >
      {/* Platform gradient accent */}
      <div
        className="absolute inset-0 rounded-[20px] pointer-events-none"
        style={{ background: s.gradient }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className={clsx("p-2 rounded-xl", s.bg)}>
              <span className={s.text}>
                <PlatformIcon platform={data.platform} size={16} />
              </span>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold">{data.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span className="text-[9px] text-white/25 uppercase tracking-widest">
                  Monitoring
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <MetricItem
            label="Mentions"
            value={data.mentions.toLocaleString()}
            change={data.mentionsChange}
          />
          <MetricItem
            label="Engage"
            value={data.engagement}
            change={data.engagementChange}
          />
          <MetricItem
            label="Sentiment"
            value={`${data.sentiment}%`}
            change={0}
          />
        </div>

        {/* Chart */}
        <div className="pt-4 border-t border-white/[0.04]">
          <MiniChart data={data.trend} color={s.glow} height={40} />
        </div>
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: number;
}) {
  return (
    <div>
      <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <p className="text-[15px] font-bold tabular-nums">{value}</p>
      {change !== 0 && (
        <p
          className={clsx(
            "text-[10px] tabular-nums mt-0.5",
            change >= 0 ? "text-emerald-400/60" : "text-red-400/60"
          )}
        >
          {change >= 0 ? "+" : ""}
          {change}%
        </p>
      )}
    </div>
  );
}
