'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Layers,
  TrendingUp,
  MessageSquare,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { hubCampaigns, type HubCampaign } from '@/lib/mock-hub';
import type { Platform } from '@/lib/mock-data';

const statusOptions = ['all', 'active', 'paused', 'completed'] as const;

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 28;
  const w = 80;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(' ');

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const platformLabel: Record<Platform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
};

function CampaignHubCard({ campaign, onClick }: { campaign: HubCampaign; onClick: () => void }) {
  const sentimentVariant = campaign.sentiment >= 70 ? 'success' : campaign.sentiment >= 40 ? 'warning' : 'danger';
  const statusVariant = campaign.status === 'active' ? 'success' : campaign.status === 'paused' ? 'warning' : 'neutral';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] group"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-subtle)' }}
          >
            <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {campaign.name}
            </p>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
              {campaign.description}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant} dot={campaign.status === 'active'} className="shrink-0 ml-2">
          {campaign.status}
        </Badge>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5 mb-4">
        <Calendar className="w-3 h-3" style={{ color: 'var(--text-faint)' }} />
        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
          {campaign.dateRange.start} — {campaign.dateRange.end}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl p-2.5" style={{ background: 'var(--bg-hover)' }}>
          <div className="flex items-center gap-1 mb-1">
            <MessageSquare className="w-3 h-3" style={{ color: 'var(--text-faint)' }} />
            <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              Mentions
            </span>
          </div>
          <p className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {fmt(campaign.totalMentions)}
          </p>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: 'var(--bg-hover)' }}>
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3" style={{ color: 'var(--text-faint)' }} />
            <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              Sentiment
            </span>
          </div>
          <Badge variant={sentimentVariant} size="sm">
            {campaign.sentiment}%
          </Badge>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: 'var(--bg-hover)' }}>
          <div className="flex items-center gap-1 mb-1">
            <FolderOpen className="w-3 h-3" style={{ color: 'var(--text-faint)' }} />
            <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              Projects
            </span>
          </div>
          <p className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {campaign.projectCount}
          </p>
        </div>
      </div>

      {/* Footer: sparkline + platforms */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {campaign.platforms.map((p) => (
            <span
              key={p}
              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
            >
              {platformLabel[p]}
            </span>
          ))}
        </div>
        <MiniSparkline data={campaign.sparkline} color="var(--accent)" />
      </div>
    </button>
  );
}

export default function CampaignsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('all');

  const filtered = useMemo(() => {
    return hubCampaigns.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, statusFilter]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 pt-10 pb-20">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>
            Your Campaigns
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {hubCampaigns.length} campaigns across your workspace
          </p>
        </div>
        <button
          onClick={() => router.push('/onboarding')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-200"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-faint)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-[13px] outline-none transition-all duration-200"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = 'var(--ring)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'var(--input-border)';
            }}
          />
        </div>

        {/* Status tabs */}
        <div
          className="flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: 'var(--bg-hover)' }}
        >
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all duration-200"
              style={{
                background: statusFilter === s ? 'var(--bg-surface-solid)' : 'transparent',
                color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: statusFilter === s ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CampaignHubCard
              key={c.id}
              campaign={c}
              onClick={() => router.push(`/smap?camp_id=${c.id}`)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No campaigns found"
          description={
            search || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first campaign to get started'
          }
          action={
            !search && statusFilter === 'all' ? (
              <button
                onClick={() => router.push('/onboarding')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-white"
                style={{ background: 'var(--accent)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Create Campaign
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
