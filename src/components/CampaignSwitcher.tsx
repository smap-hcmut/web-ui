'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { ChevronDown, Check, Plus, Layers } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCampaigns } from '@/lib/hooks/use-campaigns';
import type { Campaign } from '@/lib/api/campaigns';

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function CampaignSwitcherInner() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCampId = searchParams.get('camp_id');

  const { data, isLoading } = useCampaigns();
  const campaigns = data?.campaigns ?? [];
  const active = campaigns.find((c) => c.id === currentCampId);

  // Auto-select first campaign when none is selected
  useEffect(() => {
    if (!isLoading && campaigns.length > 0 && !currentCampId) {
      router.replace(`/smap?camp_id=${campaigns[0].id}`);
    }
  }, [isLoading, campaigns, currentCampId, router]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handle);
    return () => document.removeEventListener('pointerdown', handle);
  }, [open]);

  const select = (c: Campaign) => {
    router.push(`/smap?camp_id=${c.id}`);
    setOpen(false);
  };

  const label = isLoading ? 'Loading…' : active?.name ?? 'Select campaign';

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-200"
        style={{
          background: open ? 'var(--bg-hover)' : 'transparent',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = open ? 'var(--bg-hover)' : 'transparent';
        }}
      >
        <Layers
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
        />
        <span
          className="text-[12px] font-medium truncate"
          style={{ maxWidth: '160px' }}
        >
          {label}
        </span>
        <ChevronDown
          className="w-3 h-3 shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--text-faint)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-72 rounded-xl p-1.5 z-50 animate-[fadeIn_150ms_ease]"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-2"
            style={{ color: 'var(--text-faint)' }}
          >
            Campaigns
          </p>

          {/* Campaign list */}
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2.5 py-2">
                <div
                  className="w-7 h-7 rounded-lg animate-pulse shrink-0"
                  style={{ background: 'var(--bg-hover)' }}
                />
                <div
                  className="flex-1 h-3 rounded animate-pulse"
                  style={{ background: 'var(--bg-hover)' }}
                />
              </div>
            ))
          ) : campaigns.length === 0 ? (
            <p className="text-[12px] px-3 py-2" style={{ color: 'var(--text-muted)' }}>
              No campaigns yet
            </p>
          ) : (
            campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => select(c)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150"
                style={{
                  background: active?.id === c.id ? 'var(--bg-hover)' : 'transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    active?.id === c.id ? 'var(--bg-hover)' : 'transparent';
                }}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <p
                    className="text-[12px] font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {c.name}
                  </p>
                </div>
                {/* Active check */}
                {active?.id === c.id && (
                  <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                )}
              </button>
            ))
          )}

          <div className="h-px my-1.5" style={{ background: 'var(--border)' }} />

          {/* Create campaign */}
          <button
            onClick={() => { router.push('/onboarding'); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-hover)' }}
            >
              <Plus className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Create campaign
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Public export (Suspense boundary for useSearchParams) ───────────────────

export function CampaignSwitcher() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
          style={{ color: 'var(--text-muted)' }}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="text-[12px]">Loading…</span>
        </div>
      }
    >
      <CampaignSwitcherInner />
    </Suspense>
  );
}
