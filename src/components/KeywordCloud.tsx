import { Hash } from "lucide-react";
import { PlatformIcon } from "./icons/PlatformIcon";
import type { TrendItem } from "@/lib/mock-data";
import clsx from "clsx";

interface KeywordCloudProps {
  topics: TrendItem[];
}

const sizeMap = [
  "text-lg font-bold",
  "text-base font-semibold",
  "text-[14px] font-semibold",
  "text-[13px] font-medium",
  "text-[12px] font-medium",
  "text-[12px]",
  "text-[11px]",
  "text-[11px]",
];

export function KeywordCloud({ topics }: KeywordCloudProps) {
  const maxVolume = Math.max(...topics.map((t) => t.volume));

  return (
    <div
      className="glass p-6 h-full opacity-0 animate-slide-up"
      style={{ animationDelay: "720ms" }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-white/25" />
            <h3 className="text-[13px] font-semibold">Trending Keywords</h3>
          </div>
          <span className="text-[10px] text-white/20">Last 24h</span>
        </div>

        {/* Cloud layout */}
        <div className="flex flex-wrap gap-2 items-center">
          {topics.map((topic, i) => {
            const opacity = 0.4 + (topic.volume / maxVolume) * 0.6;
            const isPositive = topic.change >= 0;

            return (
              <div
                key={topic.keyword}
                className={clsx(
                  "group relative px-3 py-1.5 rounded-xl cursor-pointer",
                  "bg-white/[0.02] border border-white/[0.04]",
                  "hover:bg-white/[0.05] hover:border-white/[0.1]",
                  "transition-all duration-300 hover:scale-105",
                  sizeMap[Math.min(i, sizeMap.length - 1)]
                )}
                style={{ opacity }}
              >
                <span className="text-white/80">{topic.keyword}</span>
                <span
                  className={clsx(
                    "ml-1.5 text-[9px] font-medium tabular-nums",
                    isPositive ? "text-emerald-400/60" : "text-red-400/60"
                  )}
                >
                  {isPositive ? "↑" : "↓"}
                  {Math.abs(topic.change)}%
                </span>

                {/* Platform dots on hover */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {topic.platforms.map((p) => (
                    <span key={p} className="text-white/40">
                      <PlatformIcon platform={p} size={8} />
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
