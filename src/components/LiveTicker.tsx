import { PlatformIcon } from "./icons/PlatformIcon";
import type { ActivityItem } from "@/lib/types";
import clsx from "clsx";

const sentimentColor: Record<string, string> = {
  positive: "text-emerald-500",
  negative: "text-red-500",
  neutral: "text-amber-500",
};

interface LiveTickerProps {
  activities: ActivityItem[];
  rightOffset?: string;
}

export function LiveTicker({ activities, rightOffset }: LiveTickerProps) {
  // Duplicate for seamless loop
  const items = [...activities, ...activities];

  return (
    <div
      className="fixed bottom-0 left-0 z-40 backdrop-blur-xl transition-[right] duration-300 ease-out"
      style={{
        background: 'var(--ticker-bg)',
        borderTop: '1px solid var(--border)',
        right: rightOffset ?? 0,
      }}
    >
      <div className="ticker-mask overflow-hidden py-3">
        <div className="flex animate-ticker whitespace-nowrap gap-10">
          {items.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className="inline-flex items-center gap-2 flex-shrink-0"
            >
              <span style={{ color: 'var(--text-muted)' }}>
                <PlatformIcon platform={item.platform} size={11} />
              </span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                {item.author}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {item.content.slice(0, 55)}...
              </span>
              <span
                className={clsx(
                  "text-[9px] font-semibold",
                  sentimentColor[item.sentiment]
                )}
              >
                {item.sentiment}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
