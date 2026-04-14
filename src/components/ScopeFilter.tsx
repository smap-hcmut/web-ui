'use client';

import { useState, useRef, useEffect } from 'react';
import { useScope } from './ScopeProvider';
import { campaigns } from '@/lib/mock-campaigns';
import { Filter, X, ChevronDown, ChevronRight } from 'lucide-react';

export function ScopeFilter() {
  const {
    campaignIds,
    projectIds,
    keywordIds,
    toggleCampaign,
    toggleProject,
    toggleKeyword,
    clearAll,
    hasSelection,
    selectionCount,
  } = useScope();

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Collect selected labels for chips
  const chips: { id: string; label: string; type: 'campaign' | 'project' | 'keyword'; onRemove: () => void }[] = [];
  for (const c of campaigns) {
    if (campaignIds.has(c.id)) {
      chips.push({ id: c.id, label: c.name, type: 'campaign', onRemove: () => toggleCampaign(c.id) });
    }
    for (const p of c.projects) {
      if (projectIds.has(p.id)) {
        chips.push({ id: p.id, label: p.name, type: 'project', onRemove: () => toggleProject(p.id) });
      }
      for (const k of p.keywords) {
        if (keywordIds.has(k.id)) {
          chips.push({ id: k.id, label: k.text, type: 'keyword', onRemove: () => toggleKeyword(k.id) });
        }
      }
    }
  }

  const typeColor = {
    campaign: 'var(--accent)',
    project: 'var(--info)',
    keyword: 'var(--success)',
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger button + chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200"
          style={{
            background: open || hasSelection ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: hasSelection ? 'var(--accent)' : 'var(--text-secondary)',
          }}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Scope</span>
          {selectionCount > 0 && (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: 'var(--accent)' }}
            >
              {selectionCount}
            </span>
          )}
        </button>

        {/* Selected chips */}
        {chips.map((chip) => (
          <span
            key={chip.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium"
            style={{
              background: `color-mix(in srgb, ${typeColor[chip.type]} 12%, transparent)`,
              color: typeColor[chip.type],
            }}
          >
            {chip.label}
            <button
              onClick={chip.onRemove}
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:opacity-70"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {hasSelection && (
          <button
            onClick={clearAll}
            className="text-[10px] font-medium px-2 py-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Dropdown panel — tree picker */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 w-[420px] max-h-[400px] overflow-y-auto rounded-2xl py-2"
          style={{
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {campaigns.map((camp) => {
            const campChecked = campaignIds.has(camp.id);
            const campExpanded = expanded.has(camp.id);

            return (
              <div key={camp.id}>
                {/* Campaign row */}
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
                  style={{ background: campChecked ? 'var(--accent-subtle)' : 'transparent' }}
                >
                  <button onClick={() => toggleExpand(camp.id)} className="w-4 h-4 flex items-center justify-center shrink-0">
                    {campExpanded
                      ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    }
                  </button>
                  <button
                    onClick={() => toggleCampaign(camp.id)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <span
                      className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        borderColor: campChecked ? 'var(--accent)' : 'var(--text-faint)',
                        background: campChecked ? 'var(--accent)' : 'transparent',
                      }}
                    >
                      {campChecked && <span className="text-white text-[10px] font-bold leading-none">&#10003;</span>}
                    </span>
                    <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {camp.name}
                    </span>
                    {camp.status !== 'active' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                        {camp.status}
                      </span>
                    )}
                  </button>
                </div>

                {/* Projects under campaign */}
                {campExpanded && camp.projects.map((proj) => {
                  const projChecked = projectIds.has(proj.id);
                  const projExpanded = expanded.has(proj.id);

                  return (
                    <div key={proj.id}>
                      {/* Project row */}
                      <div
                        className="flex items-center gap-2 pl-8 pr-3 py-1.5 cursor-pointer transition-colors"
                        style={{ background: projChecked ? 'var(--info-bg)' : 'transparent' }}
                      >
                        <button onClick={() => toggleExpand(proj.id)} className="w-4 h-4 flex items-center justify-center shrink-0">
                          {projExpanded
                            ? <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                            : <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                          }
                        </button>
                        <button
                          onClick={() => toggleProject(proj.id)}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                            style={{
                              borderColor: projChecked ? 'var(--info)' : 'var(--text-faint)',
                              background: projChecked ? 'var(--info)' : 'transparent',
                            }}
                          >
                            {projChecked && <span className="text-white text-[9px] font-bold leading-none">&#10003;</span>}
                          </span>
                          <span className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {proj.name}
                          </span>
                          <span className="text-[9px] ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>
                            {proj.keywords.length} kw
                          </span>
                        </button>
                      </div>

                      {/* Keywords under project */}
                      {projExpanded && proj.keywords.map((kw) => {
                        const kwChecked = keywordIds.has(kw.id);

                        return (
                          <button
                            key={kw.id}
                            onClick={() => toggleKeyword(kw.id)}
                            className="flex items-center gap-2 pl-14 pr-3 py-1.5 w-full transition-colors"
                            style={{ background: kwChecked ? 'var(--success-bg)' : 'transparent' }}
                          >
                            <span
                              className="w-3 h-3 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                              style={{
                                borderColor: kwChecked ? 'var(--success)' : 'var(--text-faint)',
                                background: kwChecked ? 'var(--success)' : 'transparent',
                              }}
                            >
                              {kwChecked && <span className="text-white text-[8px] font-bold leading-none">&#10003;</span>}
                            </span>
                            <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>
                              {kw.text}
                            </span>
                            <span className="text-[9px] ml-auto tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                              {kw.volume.toLocaleString()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
