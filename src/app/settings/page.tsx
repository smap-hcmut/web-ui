'use client';

import { User, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useCurrentUser, useLogout } from '@/lib/hooks/use-auth';

/* ── Section wrapper ── */
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {desc && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Main Settings Page ── */
export default function SettingsPage() {
  const { user, isLoading } = useCurrentUser();
  const logout = useLogout();

  const displayName = user?.full_name || user?.email || 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-[1600px] mx-auto px-6 pt-10 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Your account information
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            <button
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 text-left w-full"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              <User className="w-4 h-4 shrink-0" />
              <div>
                <p className="text-[12px] font-medium">Profile</p>
                <p className="text-[10px] hidden lg:block" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                  Your account details
                </p>
              </div>
            </button>
          </nav>

          {/* Sign out */}
          <div className="hidden lg:block mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium w-full transition-colors disabled:opacity-50"
              style={{ color: 'var(--danger)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut className="w-4 h-4" />
              {logout.isPending ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-2xl p-6 lg:p-8 content-reveal"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="space-y-6">
              <Section title="Your Profile" desc="Account information from your OAuth provider">
                {isLoading ? (
                  <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                    <div className="w-16 h-16 rounded-2xl animate-pulse" style={{ background: 'var(--bg-inset)' }} />
                    <div className="space-y-2">
                      <div className="w-32 h-4 rounded animate-pulse" style={{ background: 'var(--bg-inset)' }} />
                      <div className="w-48 h-3 rounded animate-pulse" style={{ background: 'var(--bg-inset)' }} />
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-bold"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {displayName}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {user?.email || '—'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="success" size="sm" dot>Signed in</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </Section>

              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                Profile information is managed by your OAuth provider. To update your name or email, please update your Google (or your Provider) account.
              </p>

              {/* Mobile sign out */}
              <div className="lg:hidden pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-colors disabled:opacity-50"
                  style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}
                >
                  <LogOut className="w-4 h-4" />
                  {logout.isPending ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
