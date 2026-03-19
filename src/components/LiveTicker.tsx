import { PlatformIcon } from "./icons/PlatformIcon";
import type { ActivityItem } from "@/lib/mock-data";
import clsx from "clsx";

const sentimentColor: Record<string, string> = {
  positive: "text-emerald-400/40",
  negative: "text-red-400/40",
  neutral: "text-amber-400/40",
};

interface LiveTickerProps {
  activities: ActivityItem[];
}

export function LiveTicker({ activities }: LiveTickerProps) {
  // Duplicate for seamless loop
  const items = [...activities, ...activities];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.04] bg-[#06060a]/80 backdrop-blur-xl">
      <div className="ticker-mask overflow-hidden py-3">
        <div className="flex animate-ticker whitespace-nowrap gap-10">
          {items.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className="inline-flex items-center gap-2 flex-shrink-0"
            >
              <span className="text-white/20">
                <PlatformIcon platform={item.platform} size={11} />
              </span>
              <span className="text-[11px] font-medium text-white/30">
                {item.author}
              </span>
              <span className="text-[11px] text-white/15">
                {item.content.slice(0, 55)}...
              </span>
              <span
                className={clsx(
                  "text-[9px] font-medium",
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
