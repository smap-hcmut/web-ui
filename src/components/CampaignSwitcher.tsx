'use client';

import { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { ChevronDown, Check, Plus, Layers, Search, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCampaigns, useArchiveCampaign } from '@/lib/hooks/use-campaigns';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Campaign } from '@/lib/api/campaigns';

const VISIBLE_BATCH = 8;
const LAST_CAMPAIGN_KEY = 'smap:last-campaign';

function readLastCampaignId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(LAST_CAMPAIGN_KEY);
  } catch {
    return null;
  }
}

function writeLastCampaignId(campaignId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_CAMPAIGN_KEY, campaignId);
  } catch {
    // Ignore storage failures.
  }
}

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function CampaignSwitcherInner() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(VISIBLE_BATCH);
  const [deleteConfirm, setDeleteConfirm] = useState<Campaign | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCampId = searchParams.get('camp_id');

  const { data, isLoading } = useCampaigns();
  const archiveMutation = useArchiveCampaign();
  const campaigns = data?.campaigns ?? [];
  const active = campaigns.find((c) => c.id === currentCampId);

  // Client-side filter by name
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => c.name.toLowerCase().includes(q));
  }, [campaigns, query]);

  const visibleCampaigns = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  // Reset paging when query changes or dropdown closes
  useEffect(() => {
    setVisibleCount(VISIBLE_BATCH);
  }, [query, open]);

  // Auto-select first campaign when none is selected
  useEffect(() => {
    if (!isLoading && campaigns.length > 0 && !currentCampId) {
      const lastCampaignId = readLastCampaignId();
      const preferredCampaign = campaigns.find((c) => c.id === lastCampaignId) ?? campaigns[0];
      router.replace(`/smap?camp_id=${preferredCampaign.id}`);
    }
  }, [isLoading, campaigns, currentCampId, router]);

  useEffect(() => {
    if (currentCampId) {
      writeLastCampaignId(currentCampId);
    }
  }, [currentCampId]);

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
    setQuery('');
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    
    const deletingId = deleteConfirm.id;
    
    archiveMutation.mutate(deletingId, {
      onSuccess: () => {
        // If deleting the active campaign, redirect to first available campaign
        if (deletingId === currentCampId) {
          const remaining = campaigns.filter(c => c.id !== deletingId);
          if (remaining.length > 0) {
            router.push(`/smap?camp_id=${remaining[0].id}`);
          } else {
            router.push('/smap');
          }
        }
        setDeleteConfirm(null);
      },
      onError: (error) => {
        console.error('Failed to delete campaign:', error);
        setDeleteConfirm(null);
      },
    });
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
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-faint)' }}
            >
              Campaigns
            </p>
            {!isLoading && campaigns.length > 0 && (
              <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                {filtered.length}/{campaigns.length}
              </span>
            )}
          </div>

          {/* Search input — only show if there are more than a handful */}
          {!isLoading && campaigns.length > VISIBLE_BATCH && (
            <div className="px-2 pb-1.5">
              <div
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
              >
                <Search className="w-3 h-3 shrink-0" style={{ color: 'var(--text-faint)' }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm campaign…"
                  autoFocus
                  className="flex-1 bg-transparent outline-none text-[11px]"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          )}

          {/* Scrollable campaign list */}
          <div className="max-h-[280px] overflow-y-auto">
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
                Chưa có campaign nào
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-[12px] px-3 py-2" style={{ color: 'var(--text-muted)' }}>
                Không tìm thấy campaign
              </p>
            ) : (
              <>
                {visibleCampaigns.map((c) => (
                  <div
                    key={c.id}
                    className="group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150"
                    style={{
                      background: active?.id === c.id ? 'var(--bg-hover)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        active?.id === c.id ? 'var(--bg-hover)' : 'transparent';
                    }}
                  >
                    <button
                      onClick={() => select(c)}
                      className="flex-1 flex items-center gap-2.5 min-w-0"
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
                    
                    {/* Delete button - visible on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(c);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-150 shrink-0"
                      style={{ 
                        background: 'transparent',
                      }}
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.background = 'var(--danger-bg)';
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title="Xóa campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                    </button>
                  </div>
                ))}

                {hasMore && (
                  <button
                    onClick={() => setVisibleCount((n) => n + VISIBLE_BATCH)}
                    className="w-full px-2.5 py-2 rounded-lg text-[11px] font-medium transition-colors"
                    style={{ color: 'var(--accent)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Xem thêm ({filtered.length - visibleCount} còn lại)
                  </button>
                )}
              </>
            )}
          </div>

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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Xóa Campaign"
        message={`Bạn có chắc chắn muốn xóa campaign "${deleteConfirm?.name}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
        confirmLabel={archiveMutation.isPending ? "Đang xóa..." : "Xóa"}
        cancelLabel="Hủy"
      />
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
