import { Zap } from "lucide-react";
import { PlatformIcon } from "./icons/PlatformIcon";
import type { ActivityItem, Platform } from "@/lib/mock-data";
import clsx from "clsx";

const sentimentDot: Record<string, string> = {
  positive: "bg-emerald-400",
  negative: "bg-red-400",
  neutral: "bg-amber-400",
};

const platformBg: Record<Platform, string> = {
  tiktok: "bg-platform-tiktok/10",
  facebook: "bg-platform-facebook/10",
  youtube: "bg-platform-youtube/10",
};

const platformText: Record<Platform, string> = {
  tiktok: "text-platform-tiktok",
  facebook: "text-platform-facebook",
  youtube: "text-platform-youtube",
};

interface ActivitySectionProps {
  activities: ActivityItem[];
}

export function ActivitySection({ activities }: ActivitySectionProps) {
  return (
    <div
      className="glass p-6 h-full opacity-0 animate-slide-up"
      style={{ animationDelay: "800ms" }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-white/25" />
            <h3 className="text-[13px] font-semibold">Live Activity</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[10px] text-white/20">Streaming</span>
          </div>
        </div>

        <div className="space-y-1">
          {activities.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-2.5 -mx-1 rounded-xl hover:bg-white/[0.02] transition-colors group"
            >
              {/* Platform badge */}
              <div
                className={clsx(
                  "p-1.5 rounded-lg flex-shrink-0 mt-0.5",
                  platformBg[item.platform]
                )}
              >
                <span className={platformText[item.platform]}>
                  <PlatformIcon platform={item.platform} size={12} />
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-medium text-white/80">
                    {item.author}
                  </span>
                  <span className="text-[10px] text-white/15">
                    {item.time}
                  </span>
                  <span
                    className={clsx(
                      "w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0",
                      sentimentDot[item.sentiment]
                    )}
                  />
                </div>
                <p className="text-[11px] text-white/30 leading-relaxed line-clamp-1 group-hover:text-white/45 transition-colors">
                  {item.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
