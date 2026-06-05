'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ProjectStat } from '@/lib/hooks';
import type { Project, CrisisConfig, Platform } from '@/lib/types';
import type { EntityType } from '@/lib/api/projects';
import { PlatformIcon } from '@/components/icons/PlatformIcon';
import {
  Settings,
  Shield,
  ShieldOff,
  Clock,
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
/* ─── Inline input styling ─── */
const modalInputClass = 'w-full px-3 py-2 rounded-lg text-[12px] outline-none transition-all duration-200';
const modalInputStyle = {
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  color: 'var(--text-primary)',
};
