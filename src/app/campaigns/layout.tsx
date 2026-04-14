'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { Radio, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-grid relative">
        {/* Ambient orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="orb w-[600px] h-[600px] -top-[200px] -right-[100px]"
            style={{ background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 65%)' }}
          />
          <div
            className="orb w-[400px] h-[400px] bottom-[10%] -left-[100px]"
            style={{ background: 'radial-gradient(circle, rgba(24,119,242,0.04) 0%, transparent 65%)' }}
          />
        </div>

        {/* Top bar */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 backdrop-blur-2xl"
          style={{
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-4">
            <Link href="/campaigns" className="flex items-center gap-2">
              <Radio className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-[13px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                SMAP
              </span>
            </Link>
            <div className="w-px h-5" style={{ background: 'var(--border)' }} />
            <WorkspaceSwitcher />
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className="p-2 rounded-lg transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
            >
              <Settings className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="p-2 rounded-lg transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        <main className="relative z-10 pt-14">{children}</main>
      </div>
    </ThemeProvider>
  );
}
