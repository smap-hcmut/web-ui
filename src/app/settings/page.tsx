'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  Building2,
  CreditCard,
  Bell,
  Key,
  Save,
  Camera,
  Plus,
  X,
  Mail,
  Check,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Globe,
  Palette,
  Trash2,
  LogOut,
  ChevronRight,
  AlertTriangle,
  Zap,
  Crown,
  Users,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User, desc: 'Your account details' },
  { id: 'workspace', label: 'Workspace', icon: Building2, desc: 'Team & settings' },
  { id: 'billing', label: 'Billing', icon: CreditCard, desc: 'Plans & usage' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alert preferences' },
  { id: 'api', label: 'API Keys', icon: Key, desc: 'Integration access' },
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

const mockMembers = [
  { id: 'u1', name: 'Nguyen Tan Tai', email: 'tai@smap.io', role: 'admin' as const, avatar: 'NT', status: 'online' as const },
  { id: 'u2', name: 'Le Minh Khoa', email: 'khoa@smap.io', role: 'editor' as const, avatar: 'LK', status: 'online' as const },
  { id: 'u3', name: 'Tran Anh', email: 'anh@agency.com', role: 'viewer' as const, avatar: 'TA', status: 'offline' as const },
];

/* ── Toggle Switch ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-9 h-5 rounded-full transition-colors relative shrink-0"
      style={{ background: checked ? 'var(--accent)' : 'var(--bg-inset)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm"
        style={{ left: checked ? 18 : 2 }}
      />
    </button>
  );
}

/* ── Section wrapper ── */
function Section({ title, desc, children, className = '' }: { title: string; desc?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {desc && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Setting Row ── */
function SettingRow({ icon: Icon, label, desc, children }: { icon: React.ElementType; label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-subtle)' }}>
          <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
          {desc && <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{desc}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ── Create Workspace Modal ── */
function CreateWorkspaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const [creating, setCreating] = useState(false);

  const reset = () => { setStep(0); setWsName(''); setWsDesc(''); setInviteEmails(''); setCreating(false); };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Create Workspace" size="md">
      {step === 0 && (
        <div className="space-y-5">
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            A workspace is a shared space for your team to manage campaigns and collaborate.
          </p>

          {/* Workspace name */}
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Workspace name *
            </label>
            <input
              type="text"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              placeholder="e.g., Marketing Team, Agency X"
              className={inputClass}
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Description (optional)
            </label>
            <textarea
              value={wsDesc}
              onChange={(e) => setWsDesc(e.target.value)}
              placeholder="What is this workspace for?"
              rows={2}
              className={`${inputClass} resize-none`}
              style={inputStyle}
              onFocus={handleFocus as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
              onBlur={handleBlur as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
            />
          </div>

          {/* Preview */}
          {wsName && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-bold"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                {wsName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{wsName}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                  1 member · Free plan
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            disabled={!wsName.trim()}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)' }}
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Invite team members to <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{wsName}</span>. You can also do this later.
          </p>

          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email addresses (one per line)
            </label>
            <textarea
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder={"colleague@company.com\npartner@agency.com"}
              rows={4}
              className={`${inputClass} resize-none`}
              style={inputStyle}
              onFocus={handleFocus as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
              onBlur={handleBlur as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
            />
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
              They&apos;ll receive an invitation email with a link to join
            </p>
          </div>

          {/* Count */}
          {inviteEmails.trim() && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--accent-subtle)' }}>
              <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
                {inviteEmails.split('\n').filter(e => e.trim()).length} member(s) will be invited
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep(0)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
            >
              Back
            </button>
            <button
              onClick={() => {
                setCreating(true);
                setTimeout(() => { setCreating(false); onClose(); reset(); }, 1500);
              }}
              disabled={creating}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)' }}
            >
              {creating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Workspace
                </>
              )}
            </button>
          </div>

          {/* Skip option */}
          {!inviteEmails.trim() && (
            <button
              onClick={() => {
                setCreating(true);
                setTimeout(() => { setCreating(false); onClose(); reset(); }, 1500);
              }}
              disabled={creating}
              className="w-full text-center text-[11px] font-medium py-1"
              style={{ color: 'var(--text-faint)' }}
            >
              Skip — I&apos;ll invite people later
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ── Main Settings Page ── */
export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('profile');
  const [showCreateWs, setShowCreateWs] = useState(false);

  // Profile state
  const [name, setName] = useState('Nguyen Tan Tai');
  const [email, setEmail] = useState('tai@smap.io');
  const [saved, setSaved] = useState(false);

  // Notifications state
  const [notifs, setNotifs] = useState({
    emailMentions: true,
    emailDigest: true,
    emailAlerts: false,
    inAppMentions: true,
    inAppInsights: true,
    inAppStalker: true,
    slackIntegration: false,
  });

  // API key visibility
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Invite email
  const [inviteEmail, setInviteEmail] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 pt-10 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Manage your account, workspace, and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 text-left w-full"
                  style={{
                    background: active ? 'var(--accent-subtle)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? 'var(--accent-subtle)' : 'transparent'; }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[12px] font-medium">{t.label}</p>
                    <p className="text-[10px] hidden lg:block" style={{ color: active ? 'var(--accent)' : 'var(--text-faint)', opacity: 0.7 }}>
                      {t.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Danger zone in sidebar */}
          <div className="hidden lg:block mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium w-full transition-colors"
              style={{ color: 'var(--danger)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-2xl p-6 lg:p-8 content-reveal"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            key={tab}
          >
            {/* ── Profile ── */}
            {tab === 'profile' && (
              <div className="space-y-6">
                <Section title="Your Profile" desc="Manage your personal information">
                  {/* Avatar + name banner */}
                  <div
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-bold relative group cursor-pointer"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                    >
                      NT
                      <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="accent" size="sm">Admin</Badge>
                        <Badge variant="success" size="sm" dot>Active</Badge>
                      </div>
                    </div>
                  </div>
                </Section>

                <div className="max-w-lg space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>

                  <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Change password</label>
                    <div className="space-y-2">
                      <input type="password" placeholder="Current password" className={inputClass} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                      <input type="password" placeholder="New password" className={inputClass} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                    style={{ background: saved ? 'var(--success)' : 'var(--accent)' }}
                    onMouseEnter={(e) => { if (!saved) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = saved ? 'var(--success)' : 'var(--accent)'; }}
                  >
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>

                {/* Danger zone */}
                <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--danger)' }}>Danger Zone</p>
                  <div
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                  >
                    <div>
                      <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>Delete Account</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Permanently delete your account and all data</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Workspace ── */}
            {tab === 'workspace' && (
              <div className="space-y-6">
                <Section title="Workspace Settings" desc="Manage your workspace details and team members">
                  {/* Workspace info card */}
                  <div
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: 'var(--bg-hover)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-[16px] font-bold"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                      >
                        S
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>SMAP Team</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="accent" size="sm">Pro Plan</Badge>
                          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>3 members · Created Jan 2026</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateWs(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium transition-colors"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Workspace
                    </button>
                  </div>
                </Section>

                {/* General settings */}
                <div className="max-w-lg space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Workspace name</label>
                    <input type="text" defaultValue="SMAP Team" className={inputClass} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Invite link</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value="https://app.smap.io/invite/abc123" className={`${inputClass} flex-1 font-mono text-[12px]`} style={{ ...inputStyle, opacity: 0.7 }} />
                      <button
                        onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium shrink-0 transition-all"
                        style={{
                          background: copied ? 'var(--success)' : 'var(--bg-hover)',
                          color: copied ? 'white' : 'var(--text-primary)',
                        }}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Team Members ({mockMembers.length})
                      </h3>
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Manage who has access to this workspace</p>
                    </div>
                  </div>

                  {/* Invite bar */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-faint)' }} />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email to invite..."
                        className={`${inputClass} pl-10`}
                        style={inputStyle}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                    <button
                      disabled={!inviteEmail.includes('@')}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white disabled:opacity-40 shrink-0"
                      style={{ background: 'var(--accent)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Invite
                    </button>
                  </div>

                  <div className="space-y-2">
                    {mockMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                        style={{ background: 'var(--bg-hover)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                              {m.avatar}
                            </div>
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                              style={{
                                background: m.status === 'online' ? 'var(--success)' : 'var(--text-faint)',
                                borderColor: 'var(--bg-hover)',
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={m.role}
                            disabled={m.role === 'admin'}
                            className="text-[11px] font-medium px-2 py-1 rounded-lg outline-none cursor-pointer disabled:cursor-default disabled:opacity-60"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          {m.role !== 'admin' && (
                            <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-faint)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                    style={{ background: saved ? 'var(--success)' : 'var(--accent)' }}
                  >
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Billing ── */}
            {tab === 'billing' && (
              <div className="space-y-6">
                <Section title="Billing & Usage" desc="Manage your subscription and monitor usage">
                  {/* Current plan card */}
                  <div
                    className="relative overflow-hidden rounded-xl p-5"
                    style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold" style={{ color: 'var(--accent)' }}>Pro Plan</p>
                            <Badge variant="accent" size="sm">Current</Badge>
                          </div>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            $49/month · Renews Apr 28, 2026
                          </p>
                        </div>
                      </div>
                      <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
                        <Zap className="w-3.5 h-3.5" />
                        Upgrade
                      </button>
                    </div>
                  </div>
                </Section>

                {/* Usage meters */}
                <div>
                  <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Current Usage</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'API Calls', used: 32450, total: 100000, icon: Zap },
                      { label: 'Data Storage', used: 4.2, total: 20, unit: 'GB', icon: Globe },
                      { label: 'Active Campaigns', used: 4, total: 10, icon: RefreshCw },
                      { label: 'Team Members', used: 3, total: 10, icon: Users },
                    ].map((m) => {
                      const pct = (m.used / m.total) * 100;
                      const Icon = m.icon;
                      return (
                        <div key={m.label} className="rounded-xl p-4" style={{ background: 'var(--bg-hover)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-3.5 h-3.5" style={{ color: pct > 80 ? 'var(--warning)' : 'var(--text-muted)' }} />
                            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                            <span className="text-[10px] tabular-nums ml-auto font-semibold" style={{ color: pct > 80 ? 'var(--warning)' : 'var(--text-primary)' }}>
                              {m.used}{m.unit ? ` ${m.unit}` : ''} / {m.total}{m.unit ? ` ${m.unit}` : ''}
                            </span>
                          </div>
                          <ProgressBar value={pct} size="sm" color={pct > 80 ? 'var(--warning)' : undefined} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment */}
                <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Payment Method</h3>
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                        <CreditCard className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Visa ending in 4242</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Expires 12/2027</p>
                      </div>
                    </div>
                    <button className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ color: 'var(--accent)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Invoices */}
                <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Recent Invoices</h3>
                  <div className="space-y-1.5">
                    {[
                      { date: 'Mar 28, 2026', amount: '$49.00', status: 'Paid' },
                      { date: 'Feb 28, 2026', amount: '$49.00', status: 'Paid' },
                      { date: 'Jan 28, 2026', amount: '$49.00', status: 'Paid' },
                    ].map((inv) => (
                      <div key={inv.date} className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
                        <span className="text-[12px]" style={{ color: 'var(--text-primary)' }}>{inv.date}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[12px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{inv.amount}</span>
                          <Badge variant="success" size="sm">{inv.status}</Badge>
                          <button className="p-1" style={{ color: 'var(--text-faint)' }}><ExternalLink className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {tab === 'notifications' && (
              <div className="space-y-6">
                <Section title="Notification Preferences" desc="Choose how and when you want to be notified">
                  <div className="space-y-2">
                    <SettingRow icon={Mail} label="New mention alerts" desc="Get notified when your keywords are mentioned">
                      <Toggle checked={notifs.emailMentions} onChange={(v) => setNotifs({ ...notifs, emailMentions: v })} />
                    </SettingRow>
                    <SettingRow icon={Mail} label="Weekly digest" desc="Summary of all activity sent every Monday">
                      <Toggle checked={notifs.emailDigest} onChange={(v) => setNotifs({ ...notifs, emailDigest: v })} />
                    </SettingRow>
                    <SettingRow icon={AlertTriangle} label="Sentiment spike alerts" desc="Alert when negative sentiment exceeds threshold">
                      <Toggle checked={notifs.emailAlerts} onChange={(v) => setNotifs({ ...notifs, emailAlerts: v })} />
                    </SettingRow>
                  </div>
                </Section>

                <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <Section title="In-App Notifications" desc="Real-time notifications within the dashboard">
                    <div className="space-y-2">
                      <SettingRow icon={Bell} label="Real-time mention popups" desc="Show popup when new mentions are detected">
                        <Toggle checked={notifs.inAppMentions} onChange={(v) => setNotifs({ ...notifs, inAppMentions: v })} />
                      </SettingRow>
                      <SettingRow icon={Bell} label="Insight generation complete" desc="Notify when reports and insights are ready">
                        <Toggle checked={notifs.inAppInsights} onChange={(v) => setNotifs({ ...notifs, inAppInsights: v })} />
                      </SettingRow>
                      <SettingRow icon={Eye} label="Stalker alerts" desc="Get notified about stalker monitoring events">
                        <Toggle checked={notifs.inAppStalker} onChange={(v) => setNotifs({ ...notifs, inAppStalker: v })} />
                      </SettingRow>
                    </div>
                  </Section>
                </div>

                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
                  style={{ background: saved ? 'var(--success)' : 'var(--accent)' }}
                  onMouseEnter={(e) => { if (!saved) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = saved ? 'var(--success)' : 'var(--accent)'; }}
                >
                  {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Saved!' : 'Save Preferences'}
                </button>
              </div>
            )}

            {/* ── API Keys ── */}
            {tab === 'api' && (
              <div className="space-y-6">
                <Section title="API Keys" desc="Manage API keys for integrations and automation">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
                      <Plus className="w-3.5 h-3.5" />
                      Create New Key
                    </button>
                    <a
                      href="#"
                      className="flex items-center gap-1 text-[11px] font-medium px-3 py-2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Docs
                    </a>
                  </div>
                </Section>

                {/* Active key */}
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                        <Key className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Production Key</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Created Mar 15, 2026 · Last used 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success" size="sm" dot>Active</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 px-3 py-2 rounded-lg font-mono text-[12px]"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      {showKey ? 'sk-smap-4f8b2c1d9e3a7f6b5c8d2e1a0f9b3c7d' : 'sk-smap-****************************a1b2'}
                    </div>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      title={showKey ? 'Hide' : 'Reveal'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      title="Copy"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-faint)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent'; }}
                      title="Revoke"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Test key */}
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--warning-bg)' }}>
                        <Key className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Test Key</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Created Apr 01, 2026 · Last used 5 days ago</p>
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">Test</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 px-3 py-2 rounded-lg font-mono text-[12px]"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      sk-test-****************************x9y8
                    </div>
                    <button className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}><Eye className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}><Copy className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg" style={{ color: 'var(--text-faint)' }}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Security notice */}
                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)' }}
                >
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--warning)' }}>Security Notice</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Keep your API keys secure. Do not share them publicly or commit them to version control.
                      Rotate keys regularly and revoke any keys that may have been compromised.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal open={showCreateWs} onClose={() => setShowCreateWs(false)} />
    </div>
  );
}
