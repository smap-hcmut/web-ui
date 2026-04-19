"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Settings,
  Radio,
} from "lucide-react";
import { PlatformIcon } from "./icons/PlatformIcon";
import type { Platform } from "@/lib/types";
import clsx from "clsx";

type NavItem =
  | { href: string; label: string; icon: React.ComponentType<{ className?: string }>; platform?: never }
  | { href: string; label: string; platform: Platform; icon?: never }
  | { type: "separator" };

const navigation: NavItem[] = [
  { href: "/", label: "MAP", icon: LayoutDashboard },
  { href: "/tiktok", label: "TikTok", platform: "tiktok" },
  { href: "/facebook", label: "Facebook", platform: "facebook" },
  { href: "/youtube", label: "YouTube", platform: "youtube" },
  { type: "separator" },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const platformTextColor: Record<Platform, string> = {
  tiktok: "text-platform-tiktok",
  facebook: "text-platform-facebook",
  youtube: "text-platform-youtube",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-base-50 border-r border-surface-border flex flex-col z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface">
          <Radio className="w-[18px] h-[18px] text-content" />
        </div>
        <div>
          <span className="font-semibold text-[15px] text-content tracking-tight">
            SMAP
          </span>
          <p className="text-[10px] text-content-tertiary leading-none mt-0.5">
            Social Listening
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-widest px-3 mb-2">
          Monitor
        </p>
        <div className="space-y-0.5">
          {navigation.map((item, i) => {
            if ("type" in item) {
              return (
                <div key={i} className="py-3 px-3">
                  <div className="h-px bg-surface-border" />
                  <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-widest mt-3">
                    Analytics
                  </p>
                </div>
              );
            }

            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-surface text-content"
                    : "text-content-secondary hover:text-content hover:bg-surface/50"
                )}
              >
                {item.platform ? (
                  <span
                    className={clsx(
                      "transition-colors",
                      isActive
                        ? platformTextColor[item.platform]
                        : "text-content-secondary group-hover:text-content"
                    )}
                  >
                    <PlatformIcon platform={item.platform} size={16} />
                  </span>
                ) : (
                  item.icon && <item.icon className="w-4 h-4" />
                )}
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-surface-border">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-content-secondary hover:text-content hover:bg-surface/50 transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
