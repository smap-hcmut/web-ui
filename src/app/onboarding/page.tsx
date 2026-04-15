'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  FolderOpen,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { campaignApi, type CreateCampaignInput } from '@/lib/api/campaigns';
import { projectApi, type CreateProjectInput, type EntityType } from '@/lib/api/projects';

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Campaign', icon: Layers },
  { label: 'Projects', icon: FolderOpen },
] as const;

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'topic', label: 'Topic' },
];

// ─── Input styling helpers ───────────────────────────────────────────────────

const inputClass = 'w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200';
const inputStyle = {
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  color: 'var(--text-primary)',
};
const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = 'var(--ring)';
  e.currentTarget.style.borderColor = 'var(--accent)';
};
const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = 'var(--input-border)';
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectDraft {
  name: string;
  description: string;
  brand: string;
  entityType: EntityType;
  entityName: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Campaign
  const [campaignName, setCampaignName] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [campStart, setCampStart] = useState('');
  const [campEnd, setCampEnd] = useState('');

  // Step 2: Projects (multiple drafts)
  const [savedProjects, setSavedProjects] = useState<ProjectDraft[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [brand, setBrand] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('product');
  const [entityName, setEntityName] = useState('');

  // ─── Project form helpers ────────────────────────────────────────────────

  const currentProjectValid =
    projectName.trim().length > 0 &&
    entityName.trim().length > 0;

  const resetProjectForm = () => {
    setProjectName('');
    setProjectDesc('');
    setBrand('');
    setEntityType('product');
    setEntityName('');
  };

  const saveCurrentProject = () => {
    if (!currentProjectValid) return;
    setSavedProjects((prev) => [
      ...prev,
      {
        name: projectName.trim(),
        description: projectDesc.trim(),
        brand: brand.trim(),
        entityType,
        entityName: entityName.trim(),
      },
    ]);
    resetProjectForm();
  };

  const removeProject = (idx: number) => {
    setSavedProjects((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── Validation ──────────────────────────────────────────────────────────

  const canProceed = () => {
    if (step === 0) return campaignName.trim().length > 0 && campStart && campEnd;
    if (step === 1) return savedProjects.length > 0 || currentProjectValid;
    return false;
  };

  // ─── Submit: create campaign then projects sequentially ──────────────────

  const handleFinish = async () => {
    // Auto-save current project if valid
    let projectsToCreate = [...savedProjects];
    if (currentProjectValid) {
      projectsToCreate.push({
        name: projectName.trim(),
        description: projectDesc.trim(),
        brand: brand.trim(),
        entityType,
        entityName: entityName.trim(),
      });
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create campaign
      const campaignInput: CreateCampaignInput = {
        name: campaignName.trim(),
        description: campaignDesc.trim() || undefined,
        start_date: new Date(campStart).toISOString(),
        end_date: new Date(campEnd).toISOString(),
      };

      const campaign = await campaignApi.create(campaignInput);

      // 2. Create projects sequentially under the new campaign
      for (const draft of projectsToCreate) {
        const projectInput: CreateProjectInput = {
          name: draft.name,
          description: draft.description || undefined,
          brand: draft.brand || undefined,
          entity_type: draft.entityType,
          entity_name: draft.entityName,
        };
        await projectApi.create(campaign.id, projectInput);
      }

      // Success — navigate to smap with the real campaign id
      router.push(`/smap?camp_id=${campaign.id}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
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
          {/* Error banner */}
          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl mb-6 text-[12px]"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Failed to create</p>
                <p className="opacity-80 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ─── Step 1: Campaign ─── */}
          {step === 0 && (
            <div key="step-0">
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Create your first campaign
              </h2>
              <p className="text-[12px] mb-6" style={{ color: 'var(--text-muted)' }}>
                A campaign groups related projects and team members together.
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
                    onFocus={handleFocus as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                    onBlur={handleBlur as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
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

          {/* ─── Step 2: Projects ─── */}
          {step === 1 && (
            <div key="step-1">
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Set up your projects
              </h2>
              <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>
                Each project defines an entity to monitor (product, brand, competitor...).
              </p>

              {/* Saved projects list */}
              {savedProjects.length > 0 && (
                <div className="mb-4 space-y-2">
                  {savedProjects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)' }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                        style={{ background: 'var(--accent)', color: 'white' }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {proj.name}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {proj.entityType} &middot; {proj.entityName}
                          {proj.brand && ` &middot; ${proj.brand}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProject(idx)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Project form */}
              <div
                className="space-y-4 p-4 rounded-xl"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  {savedProjects.length > 0 ? `Project ${savedProjects.length + 1}` : 'Project 1'}
                </p>

                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Project name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. VinFast VF8 Monitoring"
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
                  <input
                    type="text"
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="e.g. Monitor discussions about VF8 electric SUV"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Entity type *
                    </label>
                    <select
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value as EntityType)}
                      className={inputClass}
                      style={inputStyle}
                      onFocus={handleFocus as unknown as React.FocusEventHandler<HTMLSelectElement>}
                      onBlur={handleBlur as unknown as React.FocusEventHandler<HTMLSelectElement>}
                    >
                      {ENTITY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Entity name *
                    </label>
                    <input
                      type="text"
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      placeholder="e.g. VF8"
                      className={inputClass}
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Brand (optional)
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. VinFast"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Add another project button */}
                {currentProjectValid && (
                  <button
                    type="button"
                    onClick={saveCurrentProject}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-200"
                    style={{
                      background: 'transparent',
                      border: '1.5px dashed var(--accent)',
                      color: 'var(--accent)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Save & add another project
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ─── Navigation buttons ─── */}
          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => { setStep(step - 1); setError(null); }}
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
      </div>
    </div>
  );
}
