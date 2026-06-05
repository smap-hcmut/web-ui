'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  FolderOpen,
  Target,
  Users,
  Plus,
  Archive,
  Pause,
  Play,
  RotateCcw,
  Loader2,
  Edit3,
  Save,
  Trash2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CrisisConfigEditor } from '@/components/crisis/CrisisConfigEditor';
import { OntologyRulesEditor } from '@/components/ontology/OntologyRulesEditor';
import {
  useCampaign,
  useProjectsByCampaign,
  usePauseProject,
  useResumeProject,
  useActivateProject,
  useArchiveProject,
  useUnarchiveProject,
} from '@/lib/hooks';
import { useCampaignTargets } from '@/lib/hooks/use-datasources';
import type { SourceType } from '@/lib/api/datasources';
import type { Project } from '@/lib/api/projects';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'crisis', label: 'Crisis', icon: AlertTriangle },
  { id: 'ontology', label: 'Signals', icon: BookOpen },
  { id: 'targets', label: 'Targets', icon: Target },
  { id: 'team', label: 'Team', icon: Users },
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

const sourceTypeLabel: Record<SourceType, string> = {
  TIKTOK: 'TikTok',
  FACEBOOK: 'Facebook',
  YOUTUBE: 'YouTube',
};

function projectStatusBadge(status: Project['status']) {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', variant: 'success' as const };
    case 'PAUSED':
      return { label: 'Paused', variant: 'warning' as const };
    case 'ARCHIVED':
      return { label: 'Archived', variant: 'neutral' as const };
    default:
      return { label: 'Pending', variant: 'info' as const };
  }
}

function LifecycleIconButton({
  title,
  icon,
  tone,
  disabled,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  tone: 'success' | 'warning' | 'danger' | 'accent';
  disabled?: boolean;
  onClick: () => void;
}) {
  const toneColor = {
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    accent: 'var(--accent)',
  }[tone];
  const hoverBg = tone === 'danger'
    ? 'var(--danger-bg)'
    : tone === 'success'
      ? 'var(--success-subtle, #d1fae5)'
      : tone === 'warning'
        ? 'var(--warning-subtle, #fef3c7)'
        : 'var(--accent-subtle)';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-lg transition-colors disabled:cursor-not-allowed"
      style={{ color: toneColor, opacity: disabled ? 0.45 : 1 }}
      title={title}
      aria-label={title}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
    </button>
  );
}

function CrisisSettingsPanel({ projects }: { projects: Project[] }) {
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
    if (selectedProjectId && !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]?.id ?? '');
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create a project first, then tune crisis thresholds for keyword, volume, sentiment, and influencer rules."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Crisis Configuration
          </h2>
          <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Teach SMAP when a project should become WARNING or CRITICAL.
          </p>
        </div>
        <div className="w-full sm:w-80">
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={inputClass}
            style={inputStyle}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} · {project.entity_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProject ? (
        <CrisisConfigEditor
          key={selectedProject.id}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          domainTypeCode={selectedProject.domain_type_code}
        />
      ) : null}
    </div>
  );
}

function OntologySettingsPanel({ projects }: { projects: Project[] }) {
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
    if (selectedProjectId && !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]?.id ?? '');
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create a project first, then tune the signal dictionary for marketing topics and issues."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Signal Dictionary
          </h2>
          <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Expose safe ontology rules so marketing teams can classify posts into the right topic, issue, or aspect.
          </p>
        </div>
        <div className="w-full sm:w-80">
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={inputClass}
            style={inputStyle}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} · {project.entity_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProject ? (
        <OntologyRulesEditor
          key={selectedProject.id}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      ) : null}
    </div>
  );
}

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
  const campId = searchParams.get('camp_id') || '';
  const [tab, setTab] = useState<TabId>('overview');

  // Fetch campaign + projects from API
  const { data: camp } = useCampaign(campId);
  const { data: projects } = useProjectsByCampaign(campId);
  const pauseProject = usePauseProject(campId);
  const resumeProject = useResumeProject(campId);
  const activateProject = useActivateProject(campId);
  const archiveProject = useArchiveProject(campId);
  const unarchiveProject = useUnarchiveProject(campId);
  const isProjectLifecyclePending = (projectId: string) =>
    (pauseProject.isPending && pauseProject.variables === projectId) ||
    (resumeProject.isPending && resumeProject.variables === projectId) ||
    (activateProject.isPending && activateProject.variables === projectId) ||
    (archiveProject.isPending && archiveProject.variables === projectId) ||
    (unarchiveProject.isPending && unarchiveProject.variables === projectId);

  // Fetch all targets across all projects in this campaign
  const projectIds = projects?.map((p) => p.id);
  const { data: targets, isLoading: targetsLoading } = useCampaignTargets(projectIds);

  // Overview form state
  const [campName, setCampName] = useState('');
  const [campDesc, setCampDesc] = useState('');

  // Sync form state when campaign data loads
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
            {camp?.name || 'Loading...'}
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
                  value={campName || camp?.name || ''}
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
                  Projects ({projects?.length ?? 0})
                </h2>
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Project
                </button>
              </div>
              {(projects ?? []).length > 0 ? (
                <div className="space-y-2">
                {(projects ?? []).map((proj) => {
                  const status = projectStatusBadge(proj.status);
                  const pending = isProjectLifecyclePending(proj.id);

                  return (
                    <div
                      key={proj.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl transition-colors"
                      style={{ background: 'var(--bg-hover)' }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex shrink-0 items-center justify-center"
                          style={{ background: 'var(--accent-subtle)' }}
                        >
                          <FolderOpen className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {proj.name}
                            </p>
                            <Badge variant={status.variant} dot size="sm">
                              {status.label}
                            </Badge>
                          </div>
                          <p className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {proj.entity_type} · {proj.entity_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {pending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" style={{ color: 'var(--accent)' }} />}
                        {proj.status === 'PENDING' && (
                          <LifecycleIconButton
                            title="Activate project"
                            tone="success"
                            disabled={pending}
                            onClick={() => activateProject.mutate(proj.id)}
                            icon={<Play className="w-3.5 h-3.5" />}
                          />
                        )}
                        {proj.status === 'ACTIVE' && (
                          <LifecycleIconButton
                            title="Pause project"
                            tone="warning"
                            disabled={pending}
                            onClick={() => pauseProject.mutate(proj.id)}
                            icon={<Pause className="w-3.5 h-3.5" />}
                          />
                        )}
                        {proj.status === 'PAUSED' && (
                          <LifecycleIconButton
                            title="Resume project"
                            tone="success"
                            disabled={pending}
                            onClick={() => resumeProject.mutate(proj.id)}
                            icon={<Play className="w-3.5 h-3.5" />}
                          />
                        )}
                        {proj.status !== 'ARCHIVED' ? (
                          <LifecycleIconButton
                            title="Archive project"
                            tone="danger"
                            disabled={pending}
                            onClick={() => archiveProject.mutate(proj.id)}
                            icon={<Archive className="w-3.5 h-3.5" />}
                          />
                        ) : (
                          <LifecycleIconButton
                            title="Restore archived project"
                            tone="accent"
                            disabled={pending}
                            onClick={() => unarchiveProject.mutate(proj.id)}
                            icon={<RotateCcw className="w-3.5 h-3.5" />}
                          />
                        )}
                        <button
                          type="button"
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Edit project"
                          aria-label="Edit project"
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              ) : (
                <EmptyState title="No projects yet" description="Create a project to start monitoring keywords and social mentions." />
              )}
            </div>
          )}

          {/* ── Crisis ── */}
          {tab === 'crisis' && (
            <CrisisSettingsPanel projects={projects ?? []} />
          )}

          {tab === 'ontology' && (
            <OntologySettingsPanel projects={projects ?? []} />
          )}

          {/* ── Targets ── */}
          {tab === 'targets' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Monitored Targets {targets && targets.length > 0 ? `(${targets.length})` : ''}
                </h2>
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Target
                </button>
              </div>

              {targetsLoading ? (
                <p className="text-[13px] py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  Loading targets...
                </p>
              ) : targets && targets.length > 0 ? (
                <div className="space-y-2">
                  {targets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: 'var(--bg-hover)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: 'var(--bg-surface)', color: 'var(--text-faint)' }}>
                          {t.target_type}
                        </span>
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-faint)' }}>
                          {sourceTypeLabel[t.source_type] ?? t.source_type}
                        </span>
                        <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                          {t.label || t.values.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={t.is_active ? 'success' : 'warning'} dot size="sm">
                          {t.is_active ? 'active' : 'inactive'}
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
                  Team Members
                </h2>
              </div>
              <EmptyState
                title="Team management coming soon"
                description="Team member roles and permissions for campaigns are not yet available. This feature is planned for a future release."
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
