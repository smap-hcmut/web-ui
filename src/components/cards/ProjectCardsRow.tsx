'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScope } from '@/components/ScopeProvider';
import { useProjectsByCampaign, useCreateProject, useProjectStats, usePauseProject, useResumeProject, useActivateProject, useDryrunProject } from '@/lib/hooks';
import type { ProjectStat } from '@/lib/hooks';
import type { Project, CrisisConfig, Platform } from '@/lib/types';
import type { EntityType } from '@/lib/api/projects';
import { PlatformIcon } from '@/components/icons/PlatformIcon';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Settings,
  Shield,
  ShieldOff,
  Activity,
  Volume2,
  Key,
  Users,
  Clock,
  Smile,
  Pause,
  Play,
  Zap,
  Loader2,
} from 'lucide-react';

/* ─── Trigger badge ─── */
function TriggerBadge({ label, enabled, detail }: { label: string; enabled: boolean; detail?: string }) {
  return (
    <div className="flex items-center gap-1.5 py-[3px]">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: enabled ? 'var(--success)' : 'var(--text-faint)' }}
      />
      <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>
        {label}
      </span>
      {enabled && detail && (
        <span className="text-[9px] ml-auto truncate" style={{ color: 'var(--text-muted)', maxWidth: 90 }}>
          {detail}
        </span>
      )}
      {!enabled && (
        <span className="text-[9px] ml-auto" style={{ color: 'var(--text-faint)' }}>OFF</span>
      )}
    </div>
  );
}

/* ─── Config summary for back face ─── */
function ConfigSummary({ config }: { config: CrisisConfig }) {
  const sentimentDetail = config.sentiment_trigger.enabled
    ? config.sentiment_trigger.rules[0]
      ? `neg>${config.sentiment_trigger.rules[0].negative_threshold_percent}%`
      : 'ON'
    : undefined;

  const volumeDetail = config.volume_trigger.enabled
    ? config.volume_trigger.rules[0]
      ? `+${config.volume_trigger.rules[0].threshold_percent_growth}%/${config.volume_trigger.rules[0].comparison_window_hours}h`
      : 'ON'
    : undefined;

  const kwDetail = config.keywords_trigger.enabled
    ? `${config.keywords_trigger.groups.length} group${config.keywords_trigger.groups.length !== 1 ? 's' : ''}, ${config.keywords_trigger.logic}`
    : undefined;

  const influencerDetail = config.influencer_trigger.enabled
    ? config.influencer_trigger.rules[0]
      ? `>${(config.influencer_trigger.rules[0].min_followers / 1000).toFixed(0)}k followers`
      : 'ON'
    : undefined;

  return (
    <div className="flex flex-col gap-0.5 w-full">
      <TriggerBadge label="Sentiment" enabled={config.sentiment_trigger.enabled} detail={sentimentDetail} />
      <TriggerBadge label="Volume" enabled={config.volume_trigger.enabled} detail={volumeDetail} />
      <TriggerBadge label="Keywords" enabled={config.keywords_trigger.enabled} detail={kwDetail} />
      <TriggerBadge label="Influencer" enabled={config.influencer_trigger.enabled} detail={influencerDetail} />
      {config.cron_schedule && (
        <div className="flex items-center gap-1.5 pt-1 mt-0.5" style={{ borderTop: '1px solid var(--border)' }}>
          <Clock className="w-2.5 h-2.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {config.cron_schedule}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Single flip card ─── */
export function ProjectFlipCard({
  project,
  stat,
  isSelected,
  onSelect,
  onOpenConfig,
  onPause,
  onResume,
  onActivate,
  onDryrun,
  isDryrunStarted,
  isToggling,
}: {
  project: Project;
  stat?: ProjectStat;
  isSelected: boolean;
  onSelect: () => void;
  onOpenConfig: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onActivate?: () => void;
  onDryrun?: () => void;
  isDryrunStarted?: boolean;
  isToggling?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  const mentions = stat?.mentions ?? 0;
  const avgSentiment = stat?.avg_sentiment ?? 0;
  const platforms = stat?.platforms ?? [];
  const status = project.status ?? 'active';

  const sentimentColor = avgSentiment >= 60 ? 'var(--success)' : avgSentiment >= 40 ? 'var(--warning)' : 'var(--error)';

  return (
    <div
      className="shrink-0"
      style={{ perspective: '800px', width: 224, height: 160, cursor: 'default' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
        }}
      >
        {/* ── FRONT FACE ── */}
        <div
          className="absolute inset-0 rounded-xl p-3.5 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            background: 'var(--bg-surface)',
            border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
            boxShadow: isSelected ? '0 0 0 1px var(--accent), 0 0 12px var(--accent-subtle)' : 'var(--shadow-sm)',
          }}
          onClick={onSelect}
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)', maxWidth: 160 }}>
                {project.name}
              </span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: status === 'active' ? 'var(--success)' : status === 'pending' ? 'var(--accent)' : 'var(--warning)' }}
              />
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              {platforms.map((p) => (
                <span key={p} style={{ color: p === 'TIKTOK' ? '#000000' : p === 'FACEBOOK' ? '#1877f2' : '#ff0000' }}>
                  <PlatformIcon platform={p.toLowerCase() as Platform} size={12} />
                </span>
              ))}
              <span className="text-[9px] ml-1" style={{ color: 'var(--text-faint)' }}>
                {mentions} mentions
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-faint)' }}>Mentions</p>
              <p className="text-[14px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {mentions >= 1000 ? `${(mentions / 1000).toFixed(1)}k` : mentions}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-faint)' }}>Sentiment</p>
              <p className="text-[14px] font-bold tabular-nums" style={{ color: sentimentColor }}>
                {avgSentiment}%
              </p>
            </div>
            <div className="text-right">
              {project.crisis_config && (
                <div className="flex items-center gap-1">
                  {project.crisis_config.status === 'ACTIVE' ? (
                    <Shield className="w-3 h-3" style={{ color: 'var(--success)' }} />
                  ) : (
                    <ShieldOff className="w-3 h-3" style={{ color: 'var(--text-faint)' }} />
                  )}
                  <span className="text-[9px]" style={{ color: project.crisis_config.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-faint)' }}>
                    Crisis
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BACK FACE ── */}
        <div
          className="absolute inset-0 rounded-xl p-3 flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'var(--bg-elevated)',
            border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
            boxShadow: isSelected ? '0 0 0 1px var(--accent), 0 0 12px var(--accent-subtle)' : 'var(--shadow-sm)',
          }}
        >
          {/* Back header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)', maxWidth: 150 }}>
              {project.name}
            </span>
            <div className="flex items-center gap-1">
              {/* Action button — varies by project status */}
              {status === 'active' && onPause && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPause(); }}
                  disabled={isToggling}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-hover)', opacity: isToggling ? 0.5 : 1 }}
                  onMouseEnter={(e) => { if (!isToggling) e.currentTarget.style.background = 'var(--warning-subtle, #fef3c7)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  title="Pause project"
                >
                  <Pause className="w-3 h-3" style={{ color: 'var(--warning)' }} />
                </button>
              )}
              {status === 'paused' && onResume && (
                <button
                  onClick={(e) => { e.stopPropagation(); onResume(); }}
                  disabled={isToggling}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-hover)', opacity: isToggling ? 0.5 : 1 }}
                  onMouseEnter={(e) => { if (!isToggling) e.currentTarget.style.background = 'var(--success-subtle, #d1fae5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  title="Resume project"
                >
                  <Play className="w-3 h-3" style={{ color: 'var(--success)' }} />
                </button>
              )}
              {status === 'pending' && !isDryrunStarted && onDryrun && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDryrun(); }}
                  disabled={isToggling}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-hover)', opacity: isToggling ? 0.5 : 1 }}
                  onMouseEnter={(e) => { if (!isToggling) e.currentTarget.style.background = 'var(--accent-subtle)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  title="Run dry-run check"
                >
                  {isToggling
                    ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--accent)' }} />
                    : <Zap className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                  }
                </button>
              )}
              {status === 'pending' && isDryrunStarted && onActivate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onActivate(); }}
                  disabled={isToggling}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-hover)', opacity: isToggling ? 0.5 : 1 }}
                  onMouseEnter={(e) => { if (!isToggling) e.currentTarget.style.background = 'var(--success-subtle, #d1fae5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  title="Activate project"
                >
                  {isToggling
                    ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--success)' }} />
                    : <Play className="w-3 h-3" style={{ color: 'var(--success)' }} />
                  }
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onOpenConfig(); }}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'var(--bg-hover)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-subtle)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                title="Edit crisis config"
              >
                <Settings className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              </button>
            </div>
          </div>

          {/* Config triggers */}
          <div className="flex-1 overflow-hidden" onClick={onSelect}>
            {project.crisis_config ? (
              <ConfigSummary config={project.crisis_config} />
            ) : (
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No crisis config</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Project Modal ─── */

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'product', label: 'Product' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'service', label: 'Service' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'topic', label: 'Topic' },
];

export function CreateProjectModal({
  onClose,
  onSubmit,
  isPending,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; brand?: string; entity_type: EntityType; entity_name: string }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('product');
  const [entityName, setEntityName] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const canSubmit = name.trim() && entityName.trim() && !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      brand: brand.trim() || undefined,
      entity_type: entityType,
      entity_name: entityName.trim(),
    });
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 animate-[fadeIn_200ms_ease]"
        style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-[15px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Create New Project
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VinFast VF9 Monitoring"
              className={modalInputClass}
              style={modalInputStyle}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Entity Type *
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType)}
              className={modalInputClass}
              style={modalInputStyle}
            >
              {ENTITY_TYPES.map((et) => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Entity Name *
            </label>
            <input
              type="text"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="e.g. VinFast VF9"
              className={modalInputClass}
              style={modalInputStyle}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Brand
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. VinFast"
              className={modalInputClass}
              style={modalInputStyle}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className={`${modalInputClass} resize-none`}
              style={modalInputStyle}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl text-[12px] font-medium transition-colors"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              {isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}/* ─── Add project card ─── */
function AddProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200"
      style={{
        width: 110,
        height: 160,
        background: 'var(--bg-surface)',
        border: '1.5px dashed var(--border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.background = 'var(--accent-subtle)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-surface)';
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--bg-hover)' }}
      >
        <Plus className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      </div>
      <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
        New Project
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   MAIN: ProjectCardsRow
   ═══════════════════════════════════════════ */
export function ProjectCardsRow() {
  const [collapsed, setCollapsed] = useState(false);
  const [configModalProject, setConfigModalProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Track which project IDs have had dryrun triggered this session
  const [dryrunStartedIds, setDryrunStartedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const { activeCampaignId, projectIds, toggleProject } = useScope();

  // Fetch projects from API for the active campaign
  const { data: apiProjects } = useProjectsByCampaign(activeCampaignId ?? undefined);
  const createProject = useCreateProject(activeCampaignId ?? '');
  const pauseProject = usePauseProject(activeCampaignId ?? '');
  const resumeProject = useResumeProject(activeCampaignId ?? '');
  const activateProject = useActivateProject(activeCampaignId ?? '');
  const dryrunProject = useDryrunProject();

  // Fetch per-project analytics (mentions, sentiment, platforms) from Metabase
  const { data: statsData } = useProjectStats(activeCampaignId ?? undefined);
  const statsMap = useMemo(() => {
    const map = new Map<string, ProjectStat>();
    for (const s of statsData?.stats ?? []) {
      map.set(s.project_id, s);
    }
    return map;
  }, [statsData]);

  // Map API projects to the local Project type (with empty keywords for now, since keywords come from analytics)
  const projects: Project[] = useMemo(() => {
    return (apiProjects ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      keywords: [],
      platforms: undefined,
      status: p.status === 'ACTIVE' ? 'active' as const : p.status === 'PENDING' ? 'pending' as const : 'paused' as const,
      crisis_config: undefined,
    }));
  }, [apiProjects]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 220;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  if (projects.length === 0) return null;

  return (
    <>
      <div className="mb-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Projects
            <span
              className="text-[10px] font-normal normal-case"
              style={{ color: 'var(--text-faint)' }}
            >
              ({projects.length})
            </span>
          </button>

          {!collapsed && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'var(--bg-hover)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              >
                <ChevronLeft className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'var(--bg-hover)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              >
                <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable cards row */}
        {!collapsed && (
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 no-scrollbar"
          >
            {projects.map((proj) => (
              <ProjectFlipCard
                key={proj.id}
                project={proj}
                stat={statsMap.get(proj.id)}
                isSelected={projectIds.has(proj.id)}
                onSelect={() => toggleProject(proj.id)}
                onOpenConfig={() => setConfigModalProject(proj)}
                onPause={() => pauseProject.mutate(proj.id)}
                onResume={() => resumeProject.mutate(proj.id)}
                onActivate={() => activateProject.mutate(proj.id)}
                onDryrun={() => {
                  dryrunProject.mutate(proj.id, {
                    onSuccess: () => {
                      setDryrunStartedIds((prev) => new Set(prev).add(proj.id));
                    },
                  });
                }}
                isDryrunStarted={dryrunStartedIds.has(proj.id)}
                isToggling={
                  (pauseProject.isPending && pauseProject.variables === proj.id) ||
                  (resumeProject.isPending && resumeProject.variables === proj.id) ||
                  (activateProject.isPending && activateProject.variables === proj.id) ||
                  (dryrunProject.isPending && dryrunProject.variables === proj.id)
                }
              />
            ))}
            <AddProjectCard onClick={() => setShowCreateModal(true)} />
          </div>
        )}
      </div>

      {/* ── Project Config Modal ── */}
      {configModalProject && (
        <ProjectConfigModal
          project={configModalProject}
          onClose={() => setConfigModalProject(null)}
        />
      )}

      {/* ── Create Project Modal ── */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => {
            createProject.mutate(data, {
              onSuccess: () => setShowCreateModal(false),
            });
          }}
          isPending={createProject.isPending}
        />
      )}
    </>
  );
}

/* ─── Inline input styling ─── */
const modalInputClass = 'w-full px-3 py-2 rounded-lg text-[12px] outline-none transition-all duration-200';
const modalInputStyle = {
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  color: 'var(--text-primary)',
};

/* ─── Toggle switch ─── */
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="relative w-8 h-[18px] rounded-full transition-colors duration-200 shrink-0"
      style={{ background: enabled ? 'var(--accent)' : 'var(--text-faint)' }}
    >
      <span
        className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform duration-200"
        style={{ left: 2, transform: enabled ? 'translateX(14px)' : 'translateX(0)' }}
      />
    </button>
  );
}

/* ─── Project Configuration Modal (editable) ─── */
export function ProjectConfigModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const config = project.crisis_config;

  // Editable state - initialize from config
  const [sentimentEnabled, setSentimentEnabled] = useState(config?.sentiment_trigger.enabled ?? false);
  const [sentimentThreshold, setSentimentThreshold] = useState(config?.sentiment_trigger.rules[0]?.threshold_percent ?? 25);
  const [sentimentNegative, setSentimentNegative] = useState(config?.sentiment_trigger.rules[0]?.negative_threshold_percent ?? 50);
  const [sentimentAspects, setSentimentAspects] = useState(config?.sentiment_trigger.rules[0]?.critical_aspects.join(', ') ?? '');
  const [sentimentMinSample, setSentimentMinSample] = useState(config?.sentiment_trigger.min_sample_size ?? 10);

  const [volumeEnabled, setVolumeEnabled] = useState(config?.volume_trigger.enabled ?? false);
  const [volumeGrowth, setVolumeGrowth] = useState(config?.volume_trigger.rules[0]?.threshold_percent_growth ?? 150);
  const [volumeWindow, setVolumeWindow] = useState(config?.volume_trigger.rules[0]?.comparison_window_hours ?? 1);
  const [volumeLevel, setVolumeLevel] = useState(config?.volume_trigger.rules[0]?.level ?? 'CRITICAL');

  const [kwEnabled, setKwEnabled] = useState(config?.keywords_trigger.enabled ?? false);
  const [kwLogic, setKwLogic] = useState<'AND' | 'OR'>(config?.keywords_trigger.logic ?? 'AND');
  const [kwGroups, setKwGroups] = useState(
    config?.keywords_trigger.groups.map((g) => ({ ...g, keywords: g.keywords.join(', ') })) ?? []
  );

  const [influencerEnabled, setInfluencerEnabled] = useState(config?.influencer_trigger.enabled ?? false);
  const [influencerFollowers, setInfluencerFollowers] = useState(config?.influencer_trigger.rules[0]?.min_followers ?? 100000);
  const [influencerComments, setInfluencerComments] = useState(config?.influencer_trigger.rules[0]?.min_comments ?? 500);
  const [influencerShares, setInfluencerShares] = useState(config?.influencer_trigger.rules[0]?.min_shares ?? 1000);

  const [cronSchedule, setCronSchedule] = useState(config?.cron_schedule ?? '*/30 * * * *');

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden animate-[fadeIn_200ms_ease]"
        style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Project Configuration
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {project.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-hover)' }}
          >
            <span className="text-[14px]" style={{ color: 'var(--text-muted)' }}>&times;</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">

          {/* ── Sentiment Trigger ── */}
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Smile className="w-3.5 h-3.5" style={{ color: sentimentEnabled ? 'var(--accent)' : 'var(--text-faint)' }} />
              <span className="text-[12px] font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>Sentiment Trigger</span>
              <ToggleSwitch enabled={sentimentEnabled} onChange={setSentimentEnabled} />
            </div>
            {sentimentEnabled && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Threshold %</label>
                  <input type="number" value={sentimentThreshold} onChange={(e) => setSentimentThreshold(+e.target.value)} className={modalInputClass} style={modalInputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Negative %</label>
                  <input type="number" value={sentimentNegative} onChange={(e) => setSentimentNegative(+e.target.value)} className={modalInputClass} style={modalInputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Min samples</label>
                  <input type="number" value={sentimentMinSample} onChange={(e) => setSentimentMinSample(+e.target.value)} className={modalInputClass} style={modalInputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Critical aspects</label>
                  <input type="text" value={sentimentAspects} onChange={(e) => setSentimentAspects(e.target.value)} placeholder="Giá, Chất lượng" className={modalInputClass} style={modalInputStyle} />
                </div>
              </div>
            )}
          </div>

          {/* ── Volume Trigger ── */}
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-3.5 h-3.5" style={{ color: volumeEnabled ? 'var(--accent)' : 'var(--text-faint)' }} />
              <span className="text-[12px] font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>Volume Trigger</span>
              <ToggleSwitch enabled={volumeEnabled} onChange={setVolumeEnabled} />
            </div>
            {volumeEnabled && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Growth %</label>
                  <input type="number" value={volumeGrowth} onChange={(e) => setVolumeGrowth(+e.target.value)} className={modalInputClass} style={modalInputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Window (h)</label>
                  <input type="number" value={volumeWindow} onChange={(e) => setVolumeWindow(+e.target.value)} className={modalInputClass} style={modalInputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Level</label>
                  <select value={volumeLevel} onChange={(e) => setVolumeLevel(e.target.value)} className={modalInputClass} style={modalInputStyle}>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="WARNING">WARNING</option>
                    <option value="INFO">INFO</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── Keywords Trigger ── */}
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-3.5 h-3.5" style={{ color: kwEnabled ? 'var(--accent)' : 'var(--text-faint)' }} />
              <span className="text-[12px] font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>Keywords Trigger</span>
              <ToggleSwitch enabled={kwEnabled} onChange={setKwEnabled} />
            </div>
            {kwEnabled && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>Logic:</label>
                  <select value={kwLogic} onChange={(e) => setKwLogic(e.target.value as 'AND' | 'OR')} className={`${modalInputClass} !w-20`} style={modalInputStyle}>
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                </div>
                {kwGroups.map((g, i) => (
                  <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-end">
                    <div>
                      <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Group name</label>
                      <input type="text" value={g.name} onChange={(e) => { const next = [...kwGroups]; next[i] = { ...next[i], name: e.target.value }; setKwGroups(next); }} className={modalInputClass} style={modalInputStyle} />
                    </div>
                    <div>
                      <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Keywords (comma-separated)</label>
                      <input type="text" value={g.keywords} onChange={(e) => { const next = [...kwGroups]; next[i] = { ...next[i], keywords: e.target.value }; setKwGroups(next); }} className={modalInputClass} style={modalInputStyle} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setKwGroups(kwGroups.filter((_, j) => j !== i))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center mb-0.5"
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
                    >
                      <span className="text-[12px]">&times;</span>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setKwGroups([...kwGroups, { name: '', keywords: '', weight: 5 }])}
                  className="text-[10px] font-medium flex items-center gap-1"
                  style={{ color: 'var(--accent)' }}
                >
                  <Plus className="w-3 h-3" /> Add group
                </button>
              </div>
            )}
          </div>

          {/* ── Influencer Trigger ── */}
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5" style={{ color: influencerEnabled ? 'var(--accent)' : 'var(--text-faint)' }} />
              <span className="text-[12px] font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>Influencer Trigger</span>
              <ToggleSwitch enabled={influencerEnabled} onChange={setInfluencerEnabled} />
            </div>
            {influencerEnabled && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Min followers</label>
                  <input type="number" value={influencerFollowers} onChange={(e) => setInfluencerFollowers(+e.target.value)} className={modalInputClass} style={modalInputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Min comments</label>
                  <input type="number" value={influencerComments} onChange={(e) => setInfluencerComments(+e.target.value)} className={modalInputClass} style={modalInputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Min shares</label>
                  <input type="number" value={influencerShares} onChange={(e) => setInfluencerShares(+e.target.value)} className={modalInputClass} style={modalInputStyle} />
                </div>
              </div>
            )}
          </div>

          {/* ── Cron Schedule ── */}
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>Cron Schedule</span>
            </div>
            <input type="text" value={cronSchedule} onChange={(e) => setCronSchedule(e.target.value)} placeholder="*/30 * * * *" className={`${modalInputClass} font-mono`} style={modalInputStyle} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-colors"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
