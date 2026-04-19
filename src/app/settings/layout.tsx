'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { Radio, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-grid relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="orb w-[500px] h-[500px] -top-[150px] -right-[100px]"
            style={{ background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 65%)' }}
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
              <span className="text-[13px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>SMAP</span>
            </Link>
            <div className="w-px h-5" style={{ background: 'var(--border)' }} />
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Settings</span>
          </div>
          <Link
            href="/campaigns"
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Campaigns
          </Link>
        </nav>

        <main className="relative z-10 pt-14">{children}</main>
      </div>
    </ThemeProvider>
  );
}
