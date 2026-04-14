'use client';

import { Radio } from 'lucide-react';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-grid relative flex items-center justify-center p-4">
        {/* Ambient gradient orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="orb w-[600px] h-[600px] -top-[200px] -right-[100px]"
            style={{
              background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 65%)',
            }}
          />
          <div
            className="orb w-[500px] h-[500px] -bottom-[200px] -left-[100px]"
            style={{
              background: 'radial-gradient(circle, rgba(24,119,242,0.04) 0%, transparent 65%)',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Branding */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-subtle)' }}
            >
              <Radio className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1
                className="text-[18px] font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                SMAP
              </h1>
              <p
                className="text-[11px] -mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Social Media Analysis Platform
              </p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}
