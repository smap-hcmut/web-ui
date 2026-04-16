import {
  Activity,
  Heart,
  SmilePlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { MiniChart } from "./MiniChart";
import clsx from "clsx";

const iconMap: Record<string, LucideIcon> = {
  activity: Activity,
  smile: SmilePlus,
  heart: Heart,
  users: Users,
};

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  trend: number[];
  icon: string;
  index?: number;
}

export function MetricCard({
  label,
  value,
  change,
  trend,
  icon,
  index = 0,
}: MetricCardProps) {
  const Icon = iconMap[icon] || Activity;
  const isPositive = change >= 0;

  return (
    <div
      className="card opacity-0 animate-slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-base-100">
          <Icon className="w-4 h-4 text-content-secondary" />
        </div>
        <span
          className={clsx(
            "text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
            isPositive
              ? "text-status-success bg-status-success/10"
              : "text-status-danger bg-status-danger/10"
          )}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold text-content tabular-nums tracking-tight">
          {value}
        </p>
        <p className="text-[12px] text-content-secondary mt-0.5">{label}</p>
      </div>

      <MiniChart
        data={trend}
        color={isPositive ? "#34d399" : "#ef4444"}
        height={32}
      />
    </div>
  );
}
