'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  FolderOpen,
  Hash,
  Target,
  Users,
  CreditCard,
  Plus,
  X,
  Trash2,
  Edit3,
  Download,
  ExternalLink,
  Save,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { campaigns } from '@/lib/mock-campaigns';
import type { Platform } from '@/lib/mock-data';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'keywords', label: 'Keywords', icon: Hash },
  { id: 'targets', label: 'Targets', icon: Target },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
] as const;

type TabId = (typeof TABS)[number]['id'];

const inputClass = 'w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200';
const inputStyle = {
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  color: 'var(--text-primary)',
};
const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.boxShadow = 'var(--ring)';
  e.currentTarget.style.borderColor = 'var(--accent)';
};
const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = 'var(--input-border)';
};

const platformLabel: Record<Platform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
};

/* ── Mock data for tabs ── */
const mockTargets = [
  { id: 't1', type: 'page' as const, platform: 'facebook' as Platform, url: 'facebook.com/VinFastGlobal', status: 'active' as const },
  { id: 't2', type: 'page' as const, platform: 'tiktok' as Platform, url: 'tiktok.com/@vinfast', status: 'active' as const },
  { id: 't3', type: 'post' as const, platform: 'youtube' as Platform, url: 'youtube.com/watch?v=abc123', status: 'paused' as const },
];

const mockTeam = [
  { id: 'u1', name: 'Nguyen Tan Tai', email: 'tai@smap.io', role: 'admin' as const, avatar: 'NT' },
  { id: 'u2', name: 'Le Minh Khoa', email: 'khoa@smap.io', role: 'editor' as const, avatar: 'LK' },
  { id: 'u3', name: 'Tran Anh', email: 'anh@agency.com', role: 'viewer' as const, avatar: 'TA' },
];

export default function CampaignSettingsPage() {
  return (
    <Suspense>
      <CampaignSettingsContent />
    </Suspense>
  );
}

function CampaignSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campId = searchParams.get('camp_id') || 'camp-1';
  const [tab, setTab] = useState<TabId>('overview');

  // Find campaign from mock data
  const camp = campaigns.find((c) => c.id === campId) || campaigns[0];

  // Overview form state
  const [campName, setCampName] = useState(camp.name);
  const [campDesc, setCampDesc] = useState('');

  return (
    <div className="max-w-[1600px] mx-auto px-6 pt-24 pb-20">
      {/* Back button + header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/smap?camp_id=${campId}`)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>
            Campaign Settings
          </h1>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {camp.name}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-52 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all duration-200"
                  style={{
                    background: active ? 'var(--accent-subtle)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 rounded-2xl p-6"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}
        >
          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="max-w-lg space-y-5">
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Campaign Details
              </h2>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Campaign name
                </label>
                <input
                  type="text"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Description
                </label>
                <textarea
                  value={campDesc}
                  onChange={(e) => setCampDesc(e.target.value)}
                  placeholder="Describe this campaign..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                  style={inputStyle}
                  onFocus={handleFocus as any}
                  onBlur={handleBlur as any}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Start date
                  </label>
                  <input type="date" defaultValue="2026-03-01" className={inputClass} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    End date
                  </label>
                  <input type="date" defaultValue="2026-06-30" className={inputClass} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Status</label>
                <Badge variant={camp.status === 'active' ? 'success' : camp.status === 'paused' ? 'warning' : 'neutral'} dot={camp.status === 'active'}>
                  {camp.status}
                </Badge>
              </div>
              <button
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: 'var(--accent)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}

          {/* ── Projects ── */}
          {tab === 'projects' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Projects ({camp.projects.length})
                </h2>
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Project
                </button>
              </div>
              <div className="space-y-2">
                {camp.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="flex items-center justify-between p-4 rounded-xl transition-colors"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--accent-subtle)' }}
                      >
                        <FolderOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {proj.name}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {proj.keywords.length} keywords · {[...new Set(proj.keywords.flatMap((k) => k.platforms))].map((p) => platformLabel[p]).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-2 rounded-lg transition-colors" style={{ color: 'var(--danger)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Keywords ── */}
          {tab === 'keywords' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  All Keywords
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Import CSV
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Keyword
                  </button>
                </div>
              </div>

              {camp.projects.map((proj) => (
                <div key={proj.id} className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                    {proj.name}
                  </p>
                  <div className="space-y-1">
                    {proj.keywords.map((kw) => (
                      <div
                        key={kw.id}
                        className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                        style={{ background: 'var(--bg-hover)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                            {kw.text}
                          </span>
                          <div className="flex gap-1">
                            {kw.platforms.map((p) => (
                              <span key={p} className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-faint)' }}>
                                {platformLabel[p]}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            {kw.volume.toLocaleString()} vol
                          </span>
                          <Badge variant={kw.sentiment >= 70 ? 'success' : kw.sentiment >= 40 ? 'warning' : 'danger'} size="sm">
                            {kw.sentiment}%
                          </Badge>
                          <button className="p-1" style={{ color: 'var(--text-faint)' }}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Targets ── */}
          {tab === 'targets' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Monitored Targets
                </h2>
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Target
                </button>
              </div>

              {mockTargets.length > 0 ? (
                <div className="space-y-2">
                  {mockTargets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: 'var(--bg-hover)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: 'var(--bg-surface)', color: 'var(--text-faint)' }}>
                          {t.type}
                        </span>
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-faint)' }}>
                          {platformLabel[t.platform]}
                        </span>
                        <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                          {t.url}
                        </span>
                        <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-faint)' }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={t.status === 'active' ? 'success' : 'warning'} dot size="sm">
                          {t.status}
                        </Badge>
                        <button className="p-1" style={{ color: 'var(--danger)' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No targets yet" description="Add pages, profiles, or specific posts to monitor." />
              )}
            </div>
          )}

          {/* ── Team ── */}
          {tab === 'team' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Team Members ({mockTeam.length})
                </h2>
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Invite Member
                </button>
              </div>
              <div className="space-y-2">
                {mockTeam.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                      >
                        {m.avatar}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.role === 'admin' ? 'accent' : 'neutral'} size="sm">
                        {m.role}
                      </Badge>
                      {m.role !== 'admin' && (
                        <button className="p-1" style={{ color: 'var(--danger)' }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Billing ── */}
          {tab === 'billing' && (
            <div>
              <h2 className="text-[15px] font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Campaign Usage
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'API Calls', value: '12,450', limit: '50,000' },
                  { label: 'Data Volume', value: '2.3 GB', limit: '10 GB' },
                  { label: 'Keywords Tracked', value: '17', limit: '100' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl p-4"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>
                      {stat.label}
                    </p>
                    <p className="text-[16px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                      of {stat.limit}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Billing is managed at the workspace level.{' '}
                <button className="font-semibold" style={{ color: 'var(--accent)' }}>
                  Go to Workspace Billing →
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
