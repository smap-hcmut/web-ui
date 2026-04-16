import { TrendingUp } from "lucide-react";
import { PlatformIcon } from "./icons/PlatformIcon";
import type { TrendItem } from "@/lib/mock-data";
import clsx from "clsx";

interface TrendingTopicsProps {
  topics: TrendItem[];
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  const maxVolume = Math.max(...topics.map((t) => t.volume));

  return (
    <div
      className="card opacity-0 animate-slide-up"
      style={{ animationDelay: "640ms" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-content-secondary" />
          <h3 className="text-[14px] font-semibold text-content">
            Trending Topics
          </h3>
        </div>
        <span className="text-[11px] text-content-tertiary">Last 24h</span>
      </div>

      <div className="space-y-2.5">
        {topics.map((topic) => (
          <div
            key={topic.rank}
            className="group flex items-center gap-3 py-1 rounded-lg transition-colors hover:bg-base-100/50 px-1 -mx-1"
          >
            <span className="text-[11px] text-content-tertiary w-4 text-right tabular-nums font-mono">
              {topic.rank}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-content truncate">
                  {topic.keyword}
                </span>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <span className="text-[11px] text-content-tertiary tabular-nums">
                    {(topic.volume / 1000).toFixed(1)}K
                  </span>
                  <span
                    className={clsx(
                      "text-[11px] font-medium tabular-nums",
                      topic.change >= 0
                        ? "text-status-success"
                        : "text-status-danger"
                    )}
                  >
                    {topic.change >= 0 ? "+" : ""}
                    {topic.change}%
                  </span>
                </div>
              </div>

              {/* Volume bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-[3px] bg-base-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-content-tertiary/40 rounded-full transition-all duration-700"
                    style={{
                      width: `${(topic.volume / maxVolume) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {topic.platforms.map((p) => (
                    <span
                      key={p}
                      className="opacity-30 group-hover:opacity-80 transition-opacity duration-200"
                    >
                      <PlatformIcon platform={p} size={10} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
