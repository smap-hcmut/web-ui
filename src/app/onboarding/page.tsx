'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  FolderOpen,
  Activity,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { apiClient } from '@/lib/api/client';
import { campaignApi, type CreateCampaignInput } from '@/lib/api/campaigns';
import { projectApi, type CreateProjectInput, type EntityType } from '@/lib/api/projects';
import { datasourceApi, type SourceType } from '@/lib/api/datasources';
import { buildCrisisConfigPreset } from '@/lib/crisis/presets';

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Campaign', icon: Layers },
  { label: 'Projects', icon: FolderOpen },
  { label: 'Monitoring', icon: Activity },
] as const;

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'topic', label: 'Topic' },
];

const PLATFORMS: { value: SourceType; label: string }[] = [
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TIKTOK', label: 'TikTok' },
];

const AHAMOVE_DOMAIN_CODE = 'ahamove';

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

interface DomainType {
  code: string;
  name?: string;
}

interface ProjectDraft {
  name: string;
  description: string;
  brand: string;
  entityType: EntityType;
  entityName: string;
  domainTypeCode: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Step 0: Campaign
  const [campaignName, setCampaignName] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [campStart, setCampStart] = useState('');
  const [campEnd, setCampEnd] = useState('');

  // Step 1: Projects (multiple drafts)
  const [savedProjects, setSavedProjects] = useState<ProjectDraft[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [brand, setBrand] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('product');
  const [entityName, setEntityName] = useState('');
  const [domains, setDomains] = useState<DomainType[]>([]);
  const [domainTypeCode, setDomainTypeCode] = useState('_default');
  const [domainManuallyChanged, setDomainManuallyChanged] = useState(false);

  // Step 2: Monitoring
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<SourceType>>(
    () => new Set<SourceType>(['FACEBOOK', 'YOUTUBE', 'TIKTOK']),
  );
  const [projectKeywords, setProjectKeywords] = useState<string[][]>([]);
  const [keywordInputs, setKeywordInputs] = useState<string[]>([]);
  const [crawlIntervalMinutes, setCrawlIntervalMinutes] = useState('30');

  // Fetch available domain types from project-srv on mount
  useEffect(() => {
    apiClient
      .get<{ domains?: DomainType[] }>('/project/api/v1/domains')
      .then((resp) => {
        const list = resp.domains ?? [];
        if (list.length > 0) {
          setDomains(list);
          const preferred = list.find((d) => d.code === '_default') ?? list[0];
          setDomainTypeCode(preferred.code);
        }
      })
      .catch(() => {
        // Silently fall back — '_default' is already set as initial state
      });
  }, []);

  useEffect(() => {
    if (domainManuallyChanged) return;
    if (!domains.some((d) => d.code === AHAMOVE_DOMAIN_CODE)) return;

    const text = [campaignName, projectName, brand, entityName, projectDesc]
      .join(' ')
      .toLowerCase();
    if (text.includes('ahamove') || text.includes('aha move') || text.includes('ahatruck') || text.includes('aha truck')) {
      setDomainTypeCode(AHAMOVE_DOMAIN_CODE);
    }
  }, [brand, campaignName, domainManuallyChanged, domains, entityName, projectDesc, projectName]);

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
    setDomainManuallyChanged(false);
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
        domainTypeCode,
      },
    ]);
    resetProjectForm();
  };

  const removeProject = (idx: number) => {
    setSavedProjects((prev) => prev.filter((_, i) => i !== idx));
    setProjectKeywords((prev) => prev.filter((_, i) => i !== idx));
    setKeywordInputs((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── Monitoring helpers ──────────────────────────────────────────────────

  const togglePlatform = (platform: SourceType) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  };

  const addKeyword = (projectIdx: number, keyword: string) => {
    const kw = keyword.trim();
    if (!kw) return;
    setProjectKeywords((prev) => {
      const next = [...prev];
      if (!next[projectIdx]?.includes(kw)) {
        next[projectIdx] = [...(next[projectIdx] ?? []), kw];
      }
      return next;
    });
    setKeywordInputs((prev) => {
      const next = [...prev];
      next[projectIdx] = '';
      return next;
    });
  };

  const removeKeyword = (projectIdx: number, kwIdx: number) => {
    setProjectKeywords((prev) => {
      const next = [...prev];
      next[projectIdx] = next[projectIdx].filter((_, i) => i !== kwIdx);
      return next;
    });
  };

  const handleKeywordInputChange = (projectIdx: number, val: string) => {
    if (val.includes(',')) {
      const parts = val.split(',');
      const toAdd = parts[0].trim();
      if (toAdd) addKeyword(projectIdx, toAdd);
      // Keep whatever is after the comma in the input
      setKeywordInputs((prev) => {
        const next = [...prev];
        next[projectIdx] = parts.slice(1).join(',');
        return next;
      });
    } else {
      setKeywordInputs((prev) => {
        const next = [...prev];
        next[projectIdx] = val;
        return next;
      });
    }
  };

  // ─── Validation ──────────────────────────────────────────────────────────

  const canProceed = () => {
    if (step === 0) return campaignName.trim().length > 0 && campStart && campEnd;
    if (step === 1) return savedProjects.length > 0 || currentProjectValid;
    if (step === 2) {
      return (
        selectedPlatforms.size > 0 &&
        projectKeywords.length > 0 &&
        projectKeywords.every((kws) => kws.length > 0)
      );
    }
    return false;
  };

  // ─── Continue (step 1 → step 2: finalize projects + init keywords) ───────

  const handleContinue = () => {
    setError(null);
    if (step === 1) {
      // Auto-save current project if valid
      let finalProjects = [...savedProjects];
      if (currentProjectValid) {
        finalProjects = [
          ...finalProjects,
          {
            name: projectName.trim(),
            description: projectDesc.trim(),
            brand: brand.trim(),
            entityType,
            entityName: entityName.trim(),
            domainTypeCode,
          },
        ];
        setSavedProjects(finalProjects);
        resetProjectForm();
      }
      // Pre-populate keywords from entity_name + brand for each project
      setProjectKeywords(
        finalProjects.map((p) => [p.entityName, p.brand].filter(Boolean)),
      );
      setKeywordInputs(new Array(finalProjects.length).fill(''));
    }
    setStep(step + 1);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleFinish = async () => {
    const projectsToCreate = [...savedProjects];
    // On step 2 the form is reset, so currentProjectValid should be false;
    // but guard just in case user somehow reaches this from step 1.
    if (currentProjectValid) {
      projectsToCreate.push({
        name: projectName.trim(),
        description: projectDesc.trim(),
        brand: brand.trim(),
        entityType,
        entityName: entityName.trim(),
        domainTypeCode,
      });
    }

    setLoading(true);
    setError(null);
    setWarnings([]);
    const newWarnings: string[] = [];

    try {
      // 1. Create campaign
      setProgressMessage('Creating campaign...');
      const campaignInput: CreateCampaignInput = {
        name: campaignName.trim(),
        description: campaignDesc.trim() || undefined,
        start_date: new Date(campStart).toISOString(),
        end_date: new Date(campEnd).toISOString(),
      };
      const campaign = await campaignApi.create(campaignInput);

      // 2. Create projects sequentially
      setProgressMessage('Creating projects...');
      const createdProjects: Array<{ id: string; draft: ProjectDraft; index: number }> = [];
      for (let i = 0; i < projectsToCreate.length; i++) {
        const draft = projectsToCreate[i];
        const projectInput: CreateProjectInput = {
          name: draft.name,
          description: draft.description || undefined,
          brand: draft.brand || undefined,
          entity_type: draft.entityType,
          entity_name: draft.entityName,
          domain_type_code: draft.domainTypeCode,
        };
        const project = await projectApi.create(campaign.id, projectInput);
        createdProjects.push({ id: project.id, draft, index: i });

        const crisisPreset = buildCrisisConfigPreset(draft.domainTypeCode);
        if (crisisPreset) {
          try {
            setProgressMessage(`Applying crisis preset to "${draft.name}"...`);
            await projectApi.upsertCrisisConfig(project.id, crisisPreset);
          } catch (err: unknown) {
            const msg =
              err && typeof err === 'object' && 'message' in err
                ? (err as { message: string }).message
                : 'unknown error';
            newWarnings.push(`Failed to apply crisis preset for "${draft.name}": ${msg}`);
          }
        }
      }

      // 3. Setup datasources (step 2 only)
      setProgressMessage('Setting up data sources...');
      for (const { id: projectId, draft, index } of createdProjects) {
        const keywords = projectKeywords[index]?.length
          ? projectKeywords[index]
          : [draft.entityName].filter(Boolean);

        for (const platform of Array.from(selectedPlatforms)) {
          try {
            // 3a. Create datasource
            const ds = await datasourceApi.create({
              project_id: projectId,
              name: `${draft.entityName} - ${platform}`,
              source_type: platform,
              crawl_mode: 'NORMAL',
              crawl_interval_minutes: Math.max(5, Number(crawlIntervalMinutes) || 30),
            });

            // 3b. Create keyword target
            const target = await datasourceApi.createKeywordTarget(ds.id, {
              values: keywords,
              label: keywords.join(', '),
              crawl_interval_minutes: Math.max(5, Number(crawlIntervalMinutes) || 30),
            });

            // 3c. Activate target immediately for all platforms
            await datasourceApi.activateTarget(ds.id, target.id);
          } catch (err: unknown) {
            const msg =
              err && typeof err === 'object' && 'message' in err
                ? (err as { message: string }).message
                : 'unknown error';
            newWarnings.push(`Failed to setup ${platform} for "${draft.name}": ${msg}`);
          }
        }

        // 3d. Activate project in project-srv
        try {
          setProgressMessage(`Activating "${draft.name}"...`);
          await projectApi.activate(projectId);
        } catch {
          // Non-critical — cron will pick up active targets
        }
      }

      // 4. Navigate
      if (newWarnings.length > 0) {
        setWarnings(newWarnings);
        setTimeout(() => router.push(`/smap?camp_id=${campaign.id}`), 4000);
      } else {
        router.push(`/smap?camp_id=${campaign.id}`);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
      setProgressMessage('');
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

          {/* Warning banner (after finish with partial failures) */}
          {warnings.length > 0 && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl mb-6 text-[12px]"
              style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#ca8a04' }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Setup completed with warnings</p>
                {warnings.map((w, i) => (
                  <p key={i} className="opacity-80 mt-0.5">{w}</p>
                ))}
                <p className="mt-1 opacity-60">Redirecting you now...</p>
              </div>
            </div>
          )}

          {/* ─── Step 0: Campaign ─── */}
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

          {/* ─── Step 1: Projects ─── */}
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
                          {proj.brand && ` \u00b7 ${proj.brand}`}
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

                {/* Domain type — only shown when multiple domains are available */}
                {domains.length > 1 && (
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Domain type
                    </label>
                    <select
                      value={domainTypeCode}
                      onChange={(e) => {
                        setDomainManuallyChanged(true);
                        setDomainTypeCode(e.target.value);
                      }}
                      className={inputClass}
                      style={inputStyle}
                      onFocus={handleFocus as unknown as React.FocusEventHandler<HTMLSelectElement>}
                      onBlur={handleBlur as unknown as React.FocusEventHandler<HTMLSelectElement>}
                    >
                      {domains.map((d) => (
                        <option key={d.code} value={d.code}>{d.name ?? d.code}</option>
                      ))}
                    </select>
                  </div>
                )}

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

          {/* ─── Step 2: Monitoring ─── */}
          {step === 2 && (
            <div key="step-2">
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Setup monitoring
              </h2>
              <p className="text-[12px] mb-5" style={{ color: 'var(--text-muted)' }}>
                Choose which platforms to crawl and confirm the keywords for each project.
              </p>

              {/* Platform selection */}
              <div className="mb-5">
                <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Platforms *
                </label>
                <div className="flex gap-2">
                  {PLATFORMS.map((p) => {
                    const active = selectedPlatforms.has(p.value);
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => togglePlatform(p.value)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-150"
                        style={{
                          background: active ? 'var(--accent)' : 'var(--bg-hover)',
                          color: active ? 'white' : 'var(--text-muted)',
                          border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        }}
                      >
                        {active && <Check className="w-3 h-3" />}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Crawl interval */}
              <div className="mb-5">
                <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Crawl interval (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    value={crawlIntervalMinutes}
                    onChange={(e) => setCrawlIntervalMinutes(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl text-[12px] outline-none"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Every {Math.max(5, Number(crawlIntervalMinutes) || 30)}m
                  </span>
                </div>
              </div>

              {/* Keywords per project */}
              <div className="space-y-3">
                <label className="block text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Keywords per project *
                </label>
                {savedProjects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-[12px] font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      {proj.name}
                    </p>
                    <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
                      {proj.entityType} &middot; {proj.entityName}
                    </p>
                    {/* Keyword chips + input */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {projectKeywords[idx]?.map((kw, ki) => (
                        <span
                          key={ki}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px]"
                          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                        >
                          {kw}
                          <button
                            type="button"
                            onClick={() => removeKeyword(idx, ki)}
                            className="opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={keywordInputs[idx] ?? ''}
                        onChange={(e) => handleKeywordInputChange(idx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addKeyword(idx, keywordInputs[idx] ?? '');
                          }
                          if (e.key === 'Backspace' && !keywordInputs[idx] && projectKeywords[idx]?.length > 0) {
                            removeKeyword(idx, projectKeywords[idx].length - 1);
                          }
                        }}
                        placeholder="Add keyword, Enter to confirm"
                        className="text-[11px] px-2 py-0.5 rounded-lg outline-none flex-1 min-w-[120px]"
                        style={{
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                    {(projectKeywords[idx]?.length ?? 0) === 0 && (
                      <p className="text-[10px] mt-1.5" style={{ color: '#ef4444' }}>
                        At least one keyword is required.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Navigation buttons ─── */}
          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => { setStep(step - 1); setError(null); }}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium transition-colors disabled:opacity-40"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--bg-hover)'; }}
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
                onClick={handleContinue}
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
                    {progressMessage || 'Creating...'}
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
