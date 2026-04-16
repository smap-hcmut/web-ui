'use client';

import clsx from 'clsx';

export interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (v: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onChange, className }: TabBarProps) {
  return (
    <div
      className={clsx('flex items-center gap-0.5 p-1 rounded-xl', className)}
      style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}
    >
      {tabs.map(tab => {
        const active = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200"
            style={{
              background: active ? 'var(--bg-surface-solid)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab.icon && <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: active ? 'var(--accent-subtle)' : 'var(--bg-hover)',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
