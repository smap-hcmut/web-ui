"use client";

import { Search, Bell } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 border-b border-surface-border flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-[15px] font-semibold text-content">MAP</h1>
        <p className="text-[11px] text-content-tertiary leading-none mt-0.5">
          Real-time social listening across platforms
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-tertiary" />
          <input
            type="text"
            placeholder="Search mentions, keywords..."
            className="w-56 h-8 pl-8 pr-3 rounded-lg bg-surface border border-surface-border text-[13px] text-content placeholder:text-content-tertiary focus:outline-none focus:border-content-tertiary/40 transition-colors"
          />
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-success/10 border border-status-success/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-status-success" />
          </span>
          <span className="text-[11px] font-semibold text-status-success tracking-wide">
            LIVE
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 rounded-lg text-content-secondary hover:text-content hover:bg-surface transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-platform-tiktok rounded-full" />
        </button>
      </div>
    </header>
  );
}
