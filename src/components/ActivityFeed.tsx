import { PlatformIcon } from "./icons/PlatformIcon";
import { MessageSquare } from "lucide-react";
import type { ActivityItem } from "@/lib/types";
import clsx from "clsx";

const sentimentDot: Record<string, string> = {
  positive: "bg-status-success",
  negative: "bg-status-danger",
  neutral: "bg-status-warning",
};

const sentimentLabel: Record<string, { text: string; color: string }> = {
  positive: { text: "Positive", color: "text-status-success" },
  negative: { text: "Negative", color: "text-status-danger" },
  neutral: { text: "Neutral", color: "text-status-warning" },
};

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div
      className="card opacity-0 animate-slide-up"
      style={{ animationDelay: "720ms" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-content-secondary" />
          <h3 className="text-[14px] font-semibold text-content">
            Recent Activity
          </h3>
        </div>
        <span className="text-[11px] text-content-tertiary">Live feed</span>
      </div>

      <div className="space-y-0">
        {activities.map((item, i) => (
          <div key={item.id} className="flex gap-3 group">
            {/* Timeline */}
            <div className="flex flex-col items-center pt-1.5">
              <div
                className={clsx(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  sentimentDot[item.sentiment]
                )}
              />
              {i < activities.length - 1 && (
                <div className="w-px flex-1 bg-surface-border mt-1.5" />
              )}
            </div>

            {/* Content */}
            <div
              className={clsx(
                "flex-1 min-w-0 pb-4",
                i === activities.length - 1 && "pb-0"
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-content-secondary">
                  <PlatformIcon platform={item.platform} size={12} />
                </span>
                <span className="text-[13px] font-medium text-content">
                  {item.author}
                </span>
                <span className="text-[11px] text-content-tertiary">
                  {item.time}
                </span>
                <span
                  className={clsx(
                    "text-[10px] ml-auto",
                    sentimentLabel[item.sentiment].color
                  )}
                >
                  {sentimentLabel[item.sentiment].text}
                </span>
              </div>
              <p className="text-[12px] text-content-secondary leading-relaxed line-clamp-1">
                {item.content}
              </p>
              <span className="text-[11px] text-content-tertiary tabular-nums">
                {item.engagement.toLocaleString()} engagements
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
