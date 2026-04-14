'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Layers,
  FolderOpen,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Users,
  Download,
  Check,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Platform } from '@/lib/mock-data';

const STEPS = [
  { label: 'Workspace', icon: Building2 },
  { label: 'Campaign', icon: Layers },
  { label: 'Project', icon: FolderOpen },
] as const;

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: 'tiktok', label: 'TikTok', color: '#fe2c55' },
  { id: 'facebook', label: 'Facebook', color: '#1877f2' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000' },
];

/* ─── Input styling helpers ─── */
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

/* ─── Types ─── */
interface InviteMember {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Workspace
  const [workspaceName, setWorkspaceName] = useState('');
  const [members, setMembers] = useState<InviteMember[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<InviteMember['role']>('editor');

  // Step 2: Campaign
  const [campaignName, setCampaignName] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [campStart, setCampStart] = useState('');
  const [campEnd, setCampEnd] = useState('');

  // Step 3: Project
  const [projectName, setProjectName] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState('');
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set());
  const [projStart, setProjStart] = useState('');
  const [projEnd, setProjEnd] = useState('');
  const [inheritDates, setInheritDates] = useState(true);

  const addMember = () => {
    if (!newEmail) return;
    setMembers([...members, { email: newEmail, role: newRole }]);
    setNewEmail('');
  };

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw.startsWith('#') ? kw : `#${kw}`]);
    }
    setKwInput('');
  };

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const canProceed = () => {
    if (step === 0) return workspaceName.trim().length > 0;
    if (step === 1) return campaignName.trim().length > 0 && campStart && campEnd;
    if (step === 2) return projectName.trim().length > 0 && keywords.length > 0 && platforms.size > 0;
    return false;
  };

  const handleFinish = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    router.push('/smap/processing?camp_id=new');
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-grid relative flex items-center justify-center p-4">
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="orb w-[600px] h-[600px] -top-[200px] right-[10%]"
          style={{ background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 65%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[560px]">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-6 mb-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const current = i === step;
            return (
              <div key={s.label} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className="w-8 h-px"
                    style={{ background: done ? 'var(--accent)' : 'var(--border)' }}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{
                      background: done || current ? 'var(--accent)' : 'var(--bg-hover)',
                    }}
                  >
                    {done ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: current ? 'white' : 'var(--text-muted)' }}
                      />
                    )}
                  </div>
                  <span
                    className="text-[11px] font-medium hidden sm:inline"
                    style={{ color: current ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <ProgressBar value={progress} size="sm" className="mb-6" />

        {/* Card */}
        <div
          className="rounded-2xl p-8 animate-[fadeIn_300ms_ease]"
          style={{
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* ─── Step 1: Workspace ─── */}
          {step === 0 && (
            <div key="step-0">
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Create your workspace
              </h2>
              <p className="text-[12px] mb-6" style={{ color: 'var(--text-muted)' }}>
                A workspace is where your team collaborates on campaigns.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Workspace name *
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. My Agency"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Invite members */}
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="w-3 h-3 inline mr-1" />
                    Invite team members (optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@company.com"
                      className={`${inputClass} flex-1`}
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                    />
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as InviteMember['role'])}
                      className="px-3 py-2 rounded-xl text-[12px] outline-none"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="button"
                      onClick={addMember}
                      className="px-3 py-2 rounded-xl transition-colors"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {members.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {members.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 rounded-lg"
                          style={{ background: 'var(--bg-hover)' }}
                        >
                          <span className="text-[12px]" style={{ color: 'var(--text-primary)' }}>
                            {m.email}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium capitalize" style={{ color: 'var(--text-muted)' }}>
                              {m.role}
                            </span>
                            <button onClick={() => setMembers(members.filter((_, j) => j !== i))}>
                              <X className="w-3 h-3" style={{ color: 'var(--text-faint)' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Campaign ─── */}
          {step === 1 && (
            <div key="step-1">
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Create your first campaign
              </h2>
              <p className="text-[12px] mb-6" style={{ color: 'var(--text-muted)' }}>
                Campaigns group related projects and keywords together.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Campaign name *
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Brand Reputation Q2"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={campaignDesc}
                    onChange={(e) => setCampaignDesc(e.target.value)}
                    placeholder="What is this campaign about?"
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
                      Start date *
                    </label>
                    <input
                      type="date"
                      value={campStart}
                      onChange={(e) => setCampStart(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      End date *
                    </label>
                    <input
                      type="date"
                      value={campEnd}
                      onChange={(e) => setCampEnd(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 3: Project ─── */}
          {step === 2 && (
            <div key="step-2">
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Set up your first project
              </h2>
              <p className="text-[12px] mb-6" style={{ color: 'var(--text-muted)' }}>
                Projects contain the keywords and platforms you want to monitor.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Project name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Competitor Analysis"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Keywords */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Keywords *
                    </label>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[10px] font-medium transition-colors"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Download className="w-3 h-3" />
                      Import CSV
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={kwInput}
                      onChange={(e) => setKwInput(e.target.value)}
                      placeholder="Type a keyword and press Enter"
                      className={`${inputClass} flex-1`}
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <button
                      type="button"
                      onClick={addKeyword}
                      className="px-3 py-2 rounded-xl"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                        >
                          {kw}
                          <button onClick={() => setKeywords(keywords.filter((k) => k !== kw))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Platforms */}
                <div>
                  <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Platforms to track *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLATFORMS.map((p) => {
                      const selected = platforms.has(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-medium transition-all duration-200"
                          style={{
                            background: selected ? 'var(--accent-subtle)' : 'var(--bg-hover)',
                            border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                            color: selected ? 'var(--accent)' : 'var(--text-muted)',
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: p.color }}
                          />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <Checkbox
                    checked={inheritDates}
                    onChange={setInheritDates}
                    label="Use campaign date range"
                  />
                  {!inheritDates && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                          Start date
                        </label>
                        <input
                          type="date"
                          value={projStart}
                          onChange={(e) => setProjStart(e.target.value)}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                          End date
                        </label>
                        <input
                          type="date"
                          value={projEnd}
                          onChange={(e) => setProjEnd(e.target.value)}
                          className={inputClass}
                          style={inputStyle}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Navigation buttons ─── */}
          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
                onMouseEnter={(e) => { if (canProceed()) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canProceed() || loading}
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-200 disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
                onMouseEnter={(e) => { if (canProceed()) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create & Start
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Skip link */}
        {step < STEPS.length - 1 && (
          <p className="text-center mt-4">
            <button
              onClick={() => setStep(step + 1)}
              className="text-[11px] font-medium transition-colors"
              style={{ color: 'var(--text-faint)' }}
            >
              Skip this step
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
