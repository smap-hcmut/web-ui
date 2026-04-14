"use client";

import { Radio, Search, Palette, LayoutGrid, Settings, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import Link from "next/link";
import { useTheme, THEMES } from "./ThemeProvider";
import { useNav, type TabId } from "./NavProvider";

const tabs: TabId[] = ["MAP", "Insights", "Stalker", "Reports"];

const brandMenuItems = [
  { icon: LayoutGrid, label: 'Campaigns', href: '/campaigns' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { divider: true } as const,
  { icon: LogOut, label: 'Logout', href: '/auth/login' },
] as const;

export function TopNav() {
  const { activeTab, setActiveTab } = useNav();
  const [showPalette, setShowPalette] = useState(false);
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Close palette on outside click
  useEffect(() => {
    if (!showPalette) return;
    function handleClick(e: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setShowPalette(false);
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [showPalette]);

  // Close brand menu on outside click
  useEffect(() => {
    if (!showBrandMenu) return;
    function handleClick(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) {
        setShowBrandMenu(false);
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [showBrandMenu]);

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded-2xl backdrop-blur-2xl transition-colors duration-300"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Brand with dropdown */}
        <div className="relative" ref={brandRef}>
          <button
            onClick={() => setShowBrandMenu((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200"
            style={{
              color: 'var(--text-primary)',
              background: showBrandMenu ? 'var(--bg-hover)' : 'transparent',
            }}
          >
            <Radio className="w-4 h-4" style={{ color: showBrandMenu ? 'var(--accent)' : 'var(--text-secondary)' }} />
            <span className="text-[13px] font-semibold tracking-tight">SMAP</span>
            <ChevronDown
              className="w-3 h-3 transition-transform duration-200"
              style={{
                color: 'var(--text-muted)',
                transform: showBrandMenu ? 'rotate(180deg)' : 'rotate(0)',
              }}
            />
          </button>

          {showBrandMenu && (
            <div
              className="absolute top-full left-0 mt-2 w-48 rounded-xl py-1.5 backdrop-blur-2xl animate-[fadeIn_150ms_ease]"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {brandMenuItems.map((item, i) => {
                if ('divider' in item) {
                  return (
                    <div
                      key={`d-${i}`}
                      className="h-px mx-2.5 my-1.5"
                      style={{ background: 'var(--border)' }}
                    />
                  );
                }
                const Icon = item.icon;
                const isLogout = item.label === 'Logout';
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setShowBrandMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 mx-1.5 rounded-lg text-[12px] font-medium transition-colors duration-150"
                    style={{ color: isLogout ? 'var(--danger)' : 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      if (!isLogout) e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      if (!isLogout) e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        {/* Tabs */}
        <div className="flex items-center gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-300",
              )}
              style={{
                background: activeTab === tab ? 'var(--bg-hover)' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        {/* Search */}
        <button
          className="p-2 rounded-xl transition-all"
          style={{ color: 'var(--text-muted)' }}
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Theme picker */}
        <div className="relative" ref={paletteRef}>
          <button
            onClick={() => setShowPalette(p => !p)}
            className="p-2 rounded-xl transition-all"
            style={{ color: showPalette ? 'var(--text-primary)' : 'var(--text-muted)' }}
            title="Change theme"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          {showPalette && (
            <div
              className="absolute top-full right-0 mt-2 p-2 rounded-xl backdrop-blur-2xl flex gap-1.5"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setShowPalette(false); }}
                  className="group flex flex-col items-center gap-1"
                  title={t.label}
                >
                  <div
                    className="w-7 h-7 rounded-lg overflow-hidden flex transition-transform duration-200 group-hover:scale-110"
                    style={{
                      border: theme === t.id ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                    }}
                  >
                    <div className="w-1/2 h-full" style={{ background: t.swatch }} />
                    <div className="w-1/2 h-full" style={{ background: t.swatch2 }} />
                  </div>
                  <span
                    className="text-[8px] font-medium"
                    style={{ color: theme === t.id ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live */}
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold text-emerald-500 tracking-widest">
            LIVE
          </span>
        </div>
      </div>
    </nav>
  );
}
