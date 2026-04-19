import { PlatformIcon } from "./icons/PlatformIcon";
import { MiniChart } from "./MiniChart";
import type { PlatformData, Platform } from "@/lib/types";
import clsx from "clsx";

const platformStyles: Record<
  Platform,
  { text: string; bg: string; glow: string; cardClass: string }
> = {
  tiktok: {
    text: "text-platform-tiktok",
    bg: "bg-platform-tiktok/10",
    glow: "#fe2c55",
    cardClass: "platform-card-tiktok",
  },
  facebook: {
    text: "text-platform-facebook",
    bg: "bg-platform-facebook/10",
    glow: "#1877f2",
    cardClass: "platform-card-facebook",
  },
  youtube: {
    text: "text-platform-youtube",
    bg: "bg-platform-youtube/10",
    glow: "#ff0000",
    cardClass: "platform-card-youtube",
  },
};

interface PlatformCardProps {
  data: PlatformData;
  index?: number;
}

export function PlatformCard({ data, index = 0 }: PlatformCardProps) {
  const styles = platformStyles[data.platform];

  return (
    <div
      className={clsx(
        "card group opacity-0 animate-slide-up",
        styles.cardClass
      )}
      style={{ animationDelay: `${(index + 4) * 80}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={clsx("p-2 rounded-lg", styles.bg)}>
            <span className={styles.text}>
              <PlatformIcon platform={data.platform} size={18} />
            </span>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-content">
              {data.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              <span className="text-[10px] text-content-tertiary">
                Monitoring
              </span>
            </div>
          </div>
        </div>
        <span
          className={clsx(
            "text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
            data.mentionsChange >= 0
              ? "text-status-success bg-status-success/10"
              : "text-status-danger bg-status-danger/10"
          )}
        >
          {data.mentionsChange >= 0 ? "+" : ""}
          {data.mentionsChange}%
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div>
          <p className="text-[10px] text-content-tertiary uppercase tracking-wider mb-1">
            Mentions
          </p>
          <p className="text-base font-bold text-content tabular-nums">
            {data.mentions.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-content-tertiary uppercase tracking-wider mb-1">
            Engage
          </p>
          <p className="text-base font-bold text-content tabular-nums">
            {data.engagement}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-content-tertiary uppercase tracking-wider mb-1">
            Sentiment
          </p>
          <p className="text-base font-bold text-content tabular-nums">
            {data.sentiment}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="pt-4 border-t border-surface-border">
        <MiniChart data={data.trend} color={styles.glow} height={44} />
      </div>
    </div>
  );
}
