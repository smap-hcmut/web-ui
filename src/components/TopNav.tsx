"use client";

import { Radio, Search } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

const tabs = ["Dashboard", "Platforms", "Insights"];

export function TopNav() {
  const [active, setActive] = useState("Dashboard");

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] shadow-2xl shadow-black/20">
        {/* Brand */}
        <div className="flex items-center gap-2 px-3 py-1.5">
          <Radio className="w-4 h-4 text-white/70" />
          <span className="text-[13px] font-semibold tracking-tight text-white/90">
            SocialRadar
          </span>
        </div>

        <div className="w-px h-5 bg-white/[0.08] mx-1" />

        {/* Tabs */}
        <div className="flex items-center gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-300",
                active === tab
                  ? "bg-white/[0.08] text-white"
                  : "text-white/35 hover:text-white/60 hover:bg-white/[0.03]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/[0.08] mx-1" />

        {/* Search */}
        <button className="p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all">
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Live */}
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold text-emerald-400/80 tracking-widest">
            LIVE
          </span>
        </div>
      </div>
    </nav>
  );
}
