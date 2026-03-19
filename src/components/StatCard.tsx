"use client";

import { Heart, Users, TrendingUp } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { MiniChart } from "./MiniChart";
import clsx from "clsx";

function formatCompact(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toLocaleString();
}

const iconMap = {
  heart: Heart,
  users: Users,
  trending: TrendingUp,
};

interface StatCardProps {
  label: string;
  value: number;
  change: number;
  trend: number[];
  icon: keyof typeof iconMap;
  index?: number;
}

export function StatCard({
  label,
  value,
  change,
  trend,
  icon,
  index = 0,
}: StatCardProps) {
  const Icon = iconMap[icon];
  const isPositive = change >= 0;

  return (
    <div
      className="glass p-5 h-full flex flex-col justify-between opacity-0 animate-slide-up"
      style={{ animationDelay: `${(index + 2) * 80}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-1.5 rounded-lg bg-white/[0.04]">
          <Icon className="w-3.5 h-3.5 text-white/30" />
        </div>
        <span
          className={clsx(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums",
            isPositive
              ? "text-emerald-400 bg-emerald-400/10"
              : "text-red-400 bg-red-400/10"
          )}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
      </div>

      <div>
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          <AnimatedNumber value={value} format={formatCompact} />
        </div>
        <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] mt-1">
          {label}
        </p>
      </div>

      <div className="mt-3">
        <MiniChart
          data={trend}
          color={isPositive ? "#34d399" : "#ef4444"}
          height={28}
        />
      </div>
    </div>
  );
}
