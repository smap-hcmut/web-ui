"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNav } from "@/components/NavProvider";
import { ScopeFilter } from "@/components/ScopeFilter";
import { useScope } from "@/components/ScopeProvider";
import { GeneratingReportCard } from "@/components/reports/GeneratingReportCard";
import { ReviewPostsModal } from "@/components/reports/ReviewPostsModal";
import { ProjectFlipCard, CreateProjectModal, toProjectCardStatus } from "@/components/cards/ProjectCardsRow";
import { CrisisConfigEditorModal } from "@/components/crisis/CrisisConfigEditor";
import HeapSpace from "@/components/heap/HeapSpace";
import { GlowCard } from "@/components/animated/GlowCard";
import { AnimatedCounter } from "@/components/animated/AnimatedCounter";
import { TrendArrow } from "@/components/animated/TrendArrow";
import { SentimentPulse } from "@/components/animated/SentimentPulse";
import { LineChart } from "@/components/charts/LineChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PlatformOverviewCard } from "@/components/cards/PlatformOverviewCard";
import { PostCard } from "@/components/cards/PostCard";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import type { Platform, PostDetail, ReportItem } from "@/lib/types";
import {
  datasourceApi,
  type DataSource,
  type SourceType,
  type TargetWithSource,
} from "@/lib/api/datasources";
import { reportsApi } from "@/lib/api/reports";
import { datasourceKeys, useCampaignTargets } from "@/lib/hooks/use-datasources";
import {
  useCampaignKPIs,
  usePlatformStats,
  useSentimentData,
  useTrendingKeywords,
  useRecentActivity,
  useProjectsByCampaign,
  useCreateProject,
  usePauseProject,
  useResumeProject,
  useActivateProject,
  useArchiveProject,
  useUnarchiveProject,
  useDryrunProject,
  useProjectStats,
  useReports,
  useGenerateCompetitor,
  reportKeys,
  type PostItem,
  type ProjectStat,
  type PlatformStat,
  type KeywordItem,
  type SentimentDonutItem,
} from "@/lib/hooks";
import { detectPlatform, PLATFORM_LABEL } from "@/lib/utils/platform";
import {
  Activity,
  Smile,
  Heart,
  Users,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Eye,
  ExternalLink,
  MessageCircle,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  X,
  Plus,
  Pause,
  Play,
  Trash2,
  Bell,
  BellOff,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Send,
  Link2,
  ChevronDown,
  ChevronRight,
  Target,
  BarChart3,
  Globe,
  Calendar,
  RotateCw,
} from "lucide-react";

/* ── Constants ── */
const iconMap: Record<string, React.ReactNode> = {
  activity: <Activity className="w-4 h-4" />,
  smile: <Smile className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />,
};

const platformColors: Record<string, string> = {
  tiktok: "var(--platform-tiktok)",
  facebook: "#1877f2",
  youtube: "#ff0000",
};

const platformLabel: Record<string, string> = {
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
};

const POSTS_PER_PAGE = 12;
type AnalyticsSourceScope = "all" | "stalker" | "keyword";
const analyticsSourceScopes: { value: AnalyticsSourceScope; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "stalker", label: "Stalker" },
  { value: "keyword", label: "Keyword crawl" },
];

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatSigned(value: number, suffix = ""): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}${suffix}`;
}

function formatChange(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) return formatSigned(value / 1000, "K%");
  return formatSigned(value, "%");
}

function formatMonthLabel(value: string): string {
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function isValidHttpUrl(value: string | undefined | null): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function paginationWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index);
  }

  const pages = new Set<number>([0, total - 1, current, current - 1, current + 1]);
  if (current <= 2) {
    [1, 2, 3].forEach((page) => pages.add(page));
  }
  if (current >= total - 3) {
    [total - 4, total - 3, total - 2].forEach((page) => pages.add(page));
  }

  const sorted = Array.from(pages)
    .filter((page) => page >= 0 && page < total)
    .sort((a, b) => a - b);

  return sorted.reduce<Array<number | "gap">>((acc, page) => {
    const previous = acc[acc.length - 1];
    if (typeof previous === "number" && page - previous > 1) {
      acc.push("gap");
    }
    acc.push(page);
    return acc;
  }, []);
}

function netSentimentColor(value: number): string {
  if (value >= 10) return "var(--success)";
  if (value <= -10) return "var(--danger)";
  return "var(--warning)";
}

function netSentimentLabel(value: number): string {
  if (value >= 10) return "Positive";
  if (value <= -10) return "Negative";
  return "Mixed";
}

function sentimentShare(donut: SentimentDonutItem[] | undefined, label: string): number {
  const rows = donut ?? [];
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  if (!total) return 0;
  const value = rows.find((item) => item.label === label)?.value ?? 0;
  return Math.round((value / total) * 100);
}

/* ── Shared components ── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-4 md:p-5 min-w-0 ${className}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3 min-w-0">
      <h2 className="text-[13px] md:text-[14px] font-semibold tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
        {children}
      </h2>
      {sub && <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

function SourceScopeControl({
  value,
  onChange,
}: {
  value: AnalyticsSourceScope;
  onChange: (value: AnalyticsSourceScope) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
        style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
      >
        <SlidersHorizontal className="w-3 h-3" />
        Source
      </div>
      <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--bg-hover)" }}>
        {analyticsSourceScopes.map((scope) => (
          <button
            key={scope.value}
            type="button"
            onClick={() => onChange(scope.value)}
            className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap"
            style={{
              background: value === scope.value ? "var(--bg-surface-solid)" : "transparent",
              color: value === scope.value ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: value === scope.value ? "var(--shadow-sm)" : "none",
            }}
          >
            {scope.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const sentimentVariant = { positive: "success", negative: "danger", neutral: "warning" } as const;
const alertSeverityVariant = { info: "info", warning: "warning", critical: "danger" } as const;

function TopicHealthList({ keywords, maxItems = 8 }: { keywords: KeywordItem[]; maxItems?: number }) {
  const items = keywords.slice(0, maxItems);
  const maxVolume = Math.max(...items.map((item) => item.volume), 1);

  if (!items.length) {
    return <p className="text-[11px] py-6 text-center" style={{ color: "var(--text-faint)" }}>No topic data available</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => {
        const color = netSentimentColor(item.sentiment);
        const volumePct = Math.max(4, (item.volume / maxVolume) * 100);
        return (
          <div key={`${item.text}-${idx}`} className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                  {idx + 1}
                </span>
                <span className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.text}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] tabular-nums" style={{ color }}>
                  {formatSigned(item.sentiment)}
                </span>
                <span className="text-[10px] tabular-nums" style={{ color: item.change >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {formatChange(item.change)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 rounded-full overflow-hidden flex-1" style={{ background: "var(--bg-hover)" }}>
                <div className="h-full rounded-full" style={{ width: `${volumePct}%`, background: color, opacity: 0.85 }} />
              </div>
              <span className="w-10 text-right text-[10px] font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
                {fmt(item.volume)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SentimentMixPanel({ donut, pulse }: { donut: SentimentDonutItem[] | undefined; pulse: number }) {
  const total = (donut ?? []).reduce((sum, item) => sum + item.value, 0);
  const shares = [
    { label: "Positive", key: "positive", color: "var(--success)" },
    { label: "Neutral", key: "neutral", color: "var(--warning)" },
    { label: "Negative", key: "negative", color: "var(--danger)" },
  ];

  return (
    <div className="flex items-center gap-5 min-w-0">
      <SentimentPulse value={pulse} mode="net" size={84} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Net Sentiment {formatSigned(pulse)}
        </p>
        <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
          {fmt(total)} analyzed mentions · {netSentimentLabel(pulse)} conversation mood
        </p>
        <div className="space-y-1.5">
          {shares.map((share) => (
            <div key={share.key} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: share.color }} />
              <span className="text-[10px] flex-1" style={{ color: "var(--text-secondary)" }}>{share.label}</span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {sentimentShare(donut, share.key)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShareOfVoicePanel({ stats }: { stats: PlatformStat[] }) {
  const total = stats.reduce((sum, item) => sum + item.mentions, 0);
  const segments = stats.map((item) => ({
    label: item.name,
    value: item.mentions,
    color: item.color,
  }));

  if (!stats.length || !total) {
    return <p className="text-[11px] py-6 text-center" style={{ color: "var(--text-faint)" }}>No channel data available</p>;
  }

  return (
    <div className="flex flex-col items-center gap-3 min-w-0">
      <DonutChart segments={segments} size={150} showLegend={false} />
      <div className="grid grid-cols-1 gap-2 w-full">
        {stats.map((item) => {
          const share = Math.round((item.mentions / total) * 100);
          return (
            <div key={item.platform} className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[11px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.name}</span>
              <span className="ml-auto text-[10px] font-bold tabular-nums shrink-0" style={{ color: "var(--text-primary)" }}>
                {share}% · {fmt(item.mentions)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChannelSentimentPanel({ stats }: { stats: PlatformStat[] }) {
  if (!stats.length) {
    return <p className="text-[11px] py-6 text-center" style={{ color: "var(--text-faint)" }}>No sentiment data available</p>;
  }

  return (
    <div className="space-y-3">
      {stats.map((item) => {
        const normalized = Math.max(0, Math.min(100, (item.sentiment + 100) / 2));
        const color = netSentimentColor(item.sentiment);
        return (
          <div key={item.platform} className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.name}</span>
              <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color }}>
                {formatSigned(item.sentiment)}
              </span>
            </div>
            <div className="relative h-3 rounded-full" style={{ background: "var(--bg-hover)" }}>
              <div className="absolute top-[-3px] bottom-[-3px] left-1/2 w-px" style={{ background: "var(--border)" }} />
              <div
                className="absolute top-1/2 w-3.5 h-3.5 -translate-y-1/2 rounded-full"
                style={{
                  left: `calc(${normalized}% - 7px)`,
                  background: color,
                  boxShadow: "0 0 0 3px var(--bg-surface-solid)",
                }}
              />
            </div>
          </div>
        );
      })}
      <div className="flex justify-between text-[9px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
        <span>Negative</span>
        <span>Neutral</span>
        <span>Positive</span>
      </div>
    </div>
  );
}

function EngagementEfficiencyPanel({ stats }: { stats: PlatformStat[] }) {
  const rows = stats.map((item) => ({
    ...item,
    efficiency: item.mentions > 0 ? item.engagementRaw / item.mentions : 0,
  }));
  const totalEfficiency = rows.reduce((sum, item) => sum + item.efficiency, 0);

  if (!rows.length || totalEfficiency <= 0) {
    return <p className="text-[11px] py-6 text-center" style={{ color: "var(--text-faint)" }}>No engagement data available</p>;
  }

  const weightedAverage = rows.reduce((sum, item) => sum + item.engagementRaw, 0) / Math.max(rows.reduce((sum, item) => sum + item.mentions, 0), 1);
  const segments = rows.map((item) => ({
    label: item.name,
    value: item.efficiency,
    color: item.color,
  }));

  return (
    <div className="flex flex-col items-center gap-3 min-w-0">
      <DonutChart
        segments={segments}
        size={150}
        showLegend={false}
        centerLabel="Avg / mention"
        centerValue={weightedAverage.toFixed(1)}
        formatValue={(value) => value.toFixed(1)}
        valueLabel="/ mention"
      />
      <div className="grid grid-cols-1 gap-2 w-full min-w-0">
        {rows.map((item) => (
          <div key={item.platform} className="flex items-start gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: item.color }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.name}</span>
                <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: "var(--text-primary)" }}>
                  {item.efficiency.toFixed(1)} / mention
                </span>
              </div>
              <p className="text-[9px]" style={{ color: "var(--text-faint)" }}>
                {item.engagement} engagements from {fmt(item.mentions)} mentions
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton loader with shimmer ── */
function SkeletonBlock({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={`rounded-2xl skeleton-shimmer ${className}`}
      style={{
        animation: `skeletonStagger 0.5s ease-out ${delay}ms both`,
      }}
    />
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background: "var(--accent)",
            animation: `spinnerDot 1.2s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function TabSkeleton({ rows = 3 }: { rows?: number }) {
  let idx = 0;
  return (
    <div className="space-y-4">
      <LoadingDots />
      {/* Top row cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" delay={(idx++ * 80)} />
        ))}
      </div>
      {/* Chart rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="grid grid-cols-12 gap-3">
          <SkeletonBlock className="col-span-12 lg:col-span-5 h-48" delay={(idx++) * 80} />
          <SkeletonBlock className="col-span-6 lg:col-span-3 h-48" delay={(idx++) * 80} />
          <SkeletonBlock className="col-span-6 lg:col-span-4 h-48" delay={(idx++) * 80} />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      <LoadingDots />
      {/* Header */}
      <div className="flex items-center justify-between" style={{ animation: "skeletonStagger 0.5s ease-out both" }}>
        <div className="space-y-1.5">
          <SkeletonBlock className="h-5 w-32 !rounded-lg" delay={0} />
          <SkeletonBlock className="h-3 w-56 !rounded-lg" delay={60} />
        </div>
        <SkeletonBlock className="h-9 w-28 !rounded-xl" delay={120} />
      </div>
      {/* Cards */}
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className="h-24" delay={180 + i * 100} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   TAB: MAP
   ════════════════════════════════════════════ */
function MapTab() {
  const { activeCampaignId } = useScope();
  const [sourceScope, setSourceScope] = useState<AnalyticsSourceScope>("all");

  // Real data hooks
  const { data: kpisData, isLoading: kpisLoading } = useCampaignKPIs(activeCampaignId ?? undefined, sourceScope);
  const { data: keywordsData, isLoading: keywordsLoading } = useTrendingKeywords(activeCampaignId ?? undefined, 50, sourceScope);
  const { data: sentimentData, isLoading: sentimentLoading } = useSentimentData(activeCampaignId ?? undefined, sourceScope);

  const isLoading = kpisLoading || keywordsLoading || sentimentLoading;
  const waitingForCampaign = !activeCampaignId;

  // KPI metrics from API (or empty)
  const kpiMetrics = kpisData?.metrics ?? [];

  // Trending topics for sidebar
  const topConversationDrivers = useMemo(
    () => (keywordsData?.keywords ?? []).slice(0, 7),
    [keywordsData],
  );

  // Overall sentiment from API
  const scopedSentiment = sentimentData?.pulse ?? 0;
  const keywordCount = keywordsData?.keywords?.length ?? 0;

  if (waitingForCampaign || isLoading) return <TabSkeleton rows={2} />;

  return (
    <>
      <div className="flex justify-end mb-4">
        <SourceScopeControl value={sourceScope} onChange={setSourceScope} />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiMetrics.length > 0 ? kpiMetrics.map((m) => (
          <GlowCard key={m.label}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                  >
                    {iconMap[m.icon] ?? <Activity className="w-4 h-4" />}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {m.label}
                  </span>
                </div>
                <TrendArrow value={m.change} size="sm" />
              </div>
              <AnimatedCounter
                value={m.value}
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              />
              <div className="mt-3 -mx-1">
                <LineChart
                  series={[{ label: m.label, data: m.sparkline, color: "var(--accent)" }]}
                  height={48}
                  showLegend={false}
                  compact
                />
              </div>
            </div>
          </GlowCard>
        )) : (
          /* Empty KPI placeholders */
          ["Total Mentions", "Sentiment Score", "Engagement", "Audience Reach"].map((label) => (
            <GlowCard key={label}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--bg-hover)", color: "var(--text-faint)" }}
                  >
                    {iconMap[label === "Total Mentions" ? "activity" : label === "Sentiment Score" ? "smile" : label === "Engagement" ? "heart" : "users"]}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </span>
                </div>
                <span className="text-2xl font-bold" style={{ color: "var(--text-faint)" }}>0</span>
              </div>
            </GlowCard>
          ))
        )}
      </div>

      {/* HeapSpace + Sidebar */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <div
            className="relative h-[50vh] min-h-[420px] rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <HeapSpace sourceKind={sourceScope} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <Card className="flex-1">
            <SectionTitle sub="Volume · net sentiment · momentum">Conversation Drivers</SectionTitle>
            <TopicHealthList keywords={topConversationDrivers} maxItems={7} />
          </Card>

          <Card>
            <SectionTitle sub={`${keywordCount} topics tracked`}>Market Mood</SectionTitle>
            <SentimentMixPanel donut={sentimentData?.donut} pulse={scopedSentiment} />
          </Card>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   TAB: Projects
   ════════════════════════════════════════════ */
function ProjectsTab() {
  const { activeCampaignId, projectIds, toggleProject } = useScope();
  const [configModalProject, setConfigModalProject] = useState<import('@/lib/types').Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dryrunStartedIds, setDryrunStartedIds] = useState<Set<string>>(new Set());

  const { data: apiProjects, isLoading } = useProjectsByCampaign(activeCampaignId ?? undefined);
  const createProject = useCreateProject(activeCampaignId ?? '');
  const pauseProject = usePauseProject(activeCampaignId ?? '');
  const resumeProject = useResumeProject(activeCampaignId ?? '');
  const activateProject = useActivateProject(activeCampaignId ?? '');
  const archiveProject = useArchiveProject(activeCampaignId ?? '');
  const unarchiveProject = useUnarchiveProject(activeCampaignId ?? '');
  const dryrunProject = useDryrunProject();
  const { data: statsData } = useProjectStats(activeCampaignId ?? undefined);

  const statsMap = useMemo(() => {
    const map = new Map<string, ProjectStat>();
    for (const s of statsData?.stats ?? []) map.set(s.project_id, s);
    return map;
  }, [statsData]);

  const projects = useMemo(
    () =>
      (apiProjects ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        domain_type_code: p.domain_type_code,
        keywords: [] as import('@/lib/types').Keyword[],
        platforms: undefined,
        status: toProjectCardStatus(p.status),
        crisis_config: p.crisis_config,
      })),
    [apiProjects],
  );

  if (!activeCampaignId || isLoading) return <ListSkeleton count={6} />;

  return (
    <div className="content-reveal">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Projects
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} in this campaign
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white transition-colors"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start tracking mentions and analytics"
        />
      ) : (
        <div className="flex flex-wrap gap-3">
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
              onArchive={() => archiveProject.mutate(proj.id)}
              onUnarchive={() => unarchiveProject.mutate(proj.id)}
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
                (archiveProject.isPending && archiveProject.variables === proj.id) ||
                (unarchiveProject.isPending && unarchiveProject.variables === proj.id) ||
                (dryrunProject.isPending && dryrunProject.variables === proj.id)
              }
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {configModalProject && (
        <CrisisConfigEditorModal
          projectId={configModalProject.id}
          projectName={configModalProject.name}
          domainTypeCode={configModalProject.domain_type_code}
          onClose={() => setConfigModalProject(null)}
        />
      )}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => {
            createProject.mutate(data, { onSuccess: () => setShowCreateModal(false) });
          }}
          isPending={createProject.isPending}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   TAB: Insights (merged Platforms + Insights)
   ════════════════════════════════════════════ */
function InsightsTab() {
  const { activeCampaignId } = useScope();
  const [postDetailId, setPostDetailId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [sourceScope, setSourceScope] = useState<AnalyticsSourceScope>("all");
  const [postPage, setPostPage] = useState(0);
  const sortBy: "engagement" = "engagement";

  // Real data hooks
  const { data: platformData, isLoading: platformLoading } = usePlatformStats(activeCampaignId ?? undefined, sourceScope);
  const { data: sentimentData, isLoading: sentimentLoading } = useSentimentData(activeCampaignId ?? undefined, sourceScope);
  const { data: keywordsData, isLoading: keywordsLoading } = useTrendingKeywords(activeCampaignId ?? undefined, 50, sourceScope);
  const { data: postsData, isLoading: postsLoading } = useRecentActivity({
    campaignId: activeCampaignId ?? undefined,
    platform: platformFilter !== "all" ? platformFilter : undefined,
    sentiment: sentimentFilter !== "all" ? sentimentFilter : undefined,
    sourceKind: sourceScope,
    sort: sortBy,
    limit: POSTS_PER_PAGE,
    offset: postPage * POSTS_PER_PAGE,
  });

  const isLoading = platformLoading || sentimentLoading || keywordsLoading;
  const waitingForCampaign = !activeCampaignId;

  // Platform overview cards
  const scopedPlatformStats = useMemo(() => {
    return (platformData?.stats ?? []).map((p) => ({
      platform: p.platform as Platform,
      name: platformLabel[p.platform] ?? p.platform,
      mentions: p.mentions,
      mentionsChange: p.mentionsChange,
      engagement: p.engagement,
      engagementRaw: p.engagementRaw,
      sentiment: p.sentiment,
      reach: p.reach,
      status: p.mentions > 0 ? ("active" as const) : ("inactive" as const),
      color: platformColors[p.platform] ?? "var(--text-muted)",
    }));
  }, [platformData]);

  // Mentions over time (12-month area chart)
  const mentionsSeries = useMemo(
    () =>
      (platformData?.timeSeries ?? []).map((ts) => ({
        label: ts.label,
        data: ts.data,
        color: ts.color,
      })),
    [platformData],
  );
  const mentionsLabels = useMemo(
    () => (platformData?.months ?? []).map(formatMonthLabel),
    [platformData],
  );

  // Sentiment donut
  const sentimentSegments = useMemo(() => {
    const donut = sentimentData?.donut ?? [];
    const colorMap: Record<string, string> = { positive: "var(--success)", neutral: "var(--warning)", negative: "var(--danger)" };
    return donut.map((d) => ({
      label: d.label.charAt(0).toUpperCase() + d.label.slice(1),
      value: d.value,
      color: colorMap[d.label] ?? "var(--text-faint)",
    }));
  }, [sentimentData]);

  // Sentiment timeline per platform
  const sentimentTimeline = useMemo(
    () =>
      (sentimentData?.timeline ?? []).map((ts) => ({
        label: ts.label,
        data: ts.data,
        color: ts.color,
      })),
    [sentimentData],
  );
  const sentimentTimelineLabels = useMemo(
    () => (sentimentData?.months ?? []).map(formatMonthLabel),
    [sentimentData],
  );

  const topTopics = useMemo(() => (keywordsData?.keywords ?? []).slice(0, 8), [keywordsData]);
  const momentumTopics = useMemo(() => {
    return (keywordsData?.keywords ?? [])
      .slice()
      .sort((a, b) => {
        const aRisk = a.sentiment <= -10 ? 1 : 0;
        const bRisk = b.sentiment <= -10 ? 1 : 0;
        if (aRisk !== bRisk) return bRisk - aRisk;
        return b.change - a.change;
      })
      .slice(0, 10);
  }, [keywordsData]);

  // Posts
  const filteredPosts = useMemo<PostItem[]>(() => {
    const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
    let list = [...(postsData?.posts ?? [])];

    if (platformFilter !== "all") {
      list = list.filter((post) => normalize(post.platform) === platformFilter);
    }
    if (sentimentFilter !== "all") {
      list = list.filter((post) => normalize(post.sentiment) === sentimentFilter);
    }

    return list.sort((a, b) => (b.engagement || 0) - (a.engagement || 0));
  }, [platformFilter, postsData?.posts, sentimentFilter]);

  useEffect(() => {
    setPostPage(0);
  }, [activeCampaignId, platformFilter, sentimentFilter, sourceScope]);

  const totalPosts = postsData?.total ?? filteredPosts.length;
  const totalPostPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
  const pageStart = totalPosts > 0 ? postPage * POSTS_PER_PAGE + 1 : 0;
  const pageEnd = Math.min(postPage * POSTS_PER_PAGE + filteredPosts.length, totalPosts);
  const postPages = paginationWindow(postPage, totalPostPages);

  useEffect(() => {
    if (totalPosts > 0 && postPage >= totalPostPages) {
      setPostPage(totalPostPages - 1);
    }
  }, [postPage, totalPostPages, totalPosts]);

  // Post detail — build from PostItem instead of generatePostDetail
  const selectedPost = postDetailId
    ? filteredPosts.find((p) => p.id === postDetailId)
    : null;
  const postDetail: PostDetail | null = selectedPost
    ? {
        id: selectedPost.id,
        platform: selectedPost.platform as Platform,
        author: selectedPost.author,
        content: selectedPost.content,
        time: selectedPost.time,
        sentiment: selectedPost.sentiment,
        engagement: selectedPost.engagement,
        likes: selectedPost.likes,
        comments: selectedPost.comments,
        shares: selectedPost.shares,
        views: selectedPost.views,
        sentimentBreakdown: {
          positive: selectedPost.sentiment === "positive" ? 65 : 25,
          neutral: 20,
          negative: selectedPost.sentiment === "negative" ? 55 : 15,
        },
        engagementTrend: Array.from({ length: 7 }, (_, i) =>
          Math.round(selectedPost.engagement * (0.6 + (i / 6) * 0.4 + Math.sin(i) * 0.1))
        ),
        topComments: [],
        keywords: selectedPost.keywords ?? [],
        url: selectedPost.url ?? "#",
      }
    : null;

  if (waitingForCampaign || isLoading) {
    return <TabSkeleton rows={3} />;
  }

  return (
    <div className="content-reveal">
      <div className="flex justify-end mb-4">
        <SourceScopeControl value={sourceScope} onChange={setSourceScope} />
      </div>

      {/* Row 1: Platform overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {scopedPlatformStats.map((p) => (
          <PlatformOverviewCard
            key={p.platform}
            name={p.name}
            platform={p.platform}
            mentions={p.mentions}
            mentionsChange={p.mentionsChange}
            engagement={p.engagement}
            sentiment={p.sentiment}
            status={p.status}
            color={p.color}
          />
        ))}
      </div>

      {/* Row 2: Mentions trend + sentiment split + channel sentiment */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <Card className="col-span-12 lg:col-span-5">
          <SectionTitle sub="Monthly volume by channel">Mentions Over Time</SectionTitle>
          <AreaChart series={mentionsSeries} xLabels={mentionsLabels.length > 0 ? mentionsLabels : months} height={180} />
        </Card>

        <Card className="col-span-6 lg:col-span-3 flex flex-col">
          <SectionTitle sub="Share of analyzed mentions">Mood Split</SectionTitle>
          <div className="flex-1 flex items-center justify-center">
            <DonutChart segments={sentimentSegments} size={130} />
          </div>
        </Card>

        <Card className="col-span-6 lg:col-span-4">
          <SectionTitle sub="Net sentiment per channel">Channel Sentiment</SectionTitle>
          <ChannelSentimentPanel stats={scopedPlatformStats} />
        </Card>
      </div>

      {/* Row 3: channel mix + topic health + sentiment trend */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle sub="Mention share by platform">Share of Voice</SectionTitle>
          <ShareOfVoicePanel stats={scopedPlatformStats} />
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle sub="Volume · net sentiment · momentum">Topic Health</SectionTitle>
          <TopicHealthList keywords={topTopics} maxItems={8} />
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle sub="Net sentiment by month">Sentiment Trend</SectionTitle>
          <LineChart series={sentimentTimeline} xLabels={sentimentTimelineLabels.length > 0 ? sentimentTimelineLabels : months} height={170} />
        </Card>
      </div>

      {/* Row 4: engagement quality + rising issues */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle sub="Engagement normalized by mention volume">Engagement Efficiency</SectionTitle>
          <EngagementEfficiencyPanel stats={scopedPlatformStats} />
        </Card>

        <Card className="col-span-12 lg:col-span-8">
          <SectionTitle sub="Fast-growing or negative themes to review first">Momentum Watchlist</SectionTitle>
          <TopicHealthList keywords={momentumTopics} maxItems={10} />
        </Card>
      </div>

      {/* Row 5: Top Posts with filters */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <SectionTitle sub="Click any post to view details & comments">Top Posts by Platform</SectionTitle>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Platform filter */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--bg-hover)" }}>
	              {(["all", "tiktok", "facebook", "youtube"] as const).map((p) => (
	                <button
	                  key={p}
	                  onClick={() => {
	                    setPlatformFilter(p);
	                    setPostPage(0);
	                  }}
	                  className="px-2 py-1 rounded-md text-[10px] font-medium capitalize transition-all whitespace-nowrap"
	                  style={{
                    background: platformFilter === p ? "var(--bg-surface-solid)" : "transparent",
                    color: platformFilter === p ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: platformFilter === p ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {p === "all" ? "All" : platformLabel[p]}
                </button>
              ))}
            </div>

            {/* Sentiment filter */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--bg-hover)" }}>
	              {["all", "positive", "neutral", "negative"].map((s) => (
	                <button
	                  key={s}
	                  onClick={() => {
	                    setSentimentFilter(s);
	                    setPostPage(0);
	                  }}
	                  className="px-2 py-1 rounded-md text-[10px] font-medium capitalize transition-all whitespace-nowrap"
	                  style={{
                    background: sentimentFilter === s ? "var(--bg-surface-solid)" : "transparent",
                    color: sentimentFilter === s ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: sentimentFilter === s ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap"
              style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
            >
              <ArrowUpDown className="w-3 h-3 shrink-0" />
              Sorted by Engagement
            </div>
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                author={post.author}
                content={post.content}
                platform={post.platform as Platform}
                sentiment={post.sentiment}
                engagement={post.engagement}
                time={post.time}
                originalUrl={isValidHttpUrl(post.url) ? post.url : undefined}
                onOpen={() => setPostDetailId(post.id)}
              />
            ))}
          </div>
        ) : postsLoading ? (
          <LoadingDots />
        ) : (
          <EmptyState title="No posts found" description="Try adjusting your filters" />
        )}

        {totalPosts > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              Showing {pageStart}-{pageEnd} of {totalPosts} posts
            </p>
            {totalPostPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPostPage((page) => Math.max(0, page - 1))}
                  disabled={postPage === 0 || postsLoading}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-40"
                  style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {postPages.map((page, index) =>
                    page === "gap" ? (
                      <span key={`gap-${index}`} className="px-1 text-[10px]" style={{ color: "var(--text-faint)" }}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setPostPage(page)}
                        disabled={postsLoading}
                        className="w-7 h-7 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
                        style={{
                          background: postPage === page ? "var(--accent)" : "var(--bg-hover)",
                          color: postPage === page ? "white" : "var(--text-muted)",
                          boxShadow: postPage === page ? "var(--shadow-sm)" : "none",
                        }}
                      >
                        {page + 1}
                      </button>
                    ),
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPostPage((page) => Math.min(totalPostPages - 1, page + 1))}
                  disabled={postPage >= totalPostPages - 1 || postsLoading}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-40"
                  style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={postDetail}
        open={!!postDetail}
        onClose={() => setPostDetailId(null)}
      />
    </div>
  );
}

/* ── Post Detail Modal ── */
const COMMENTS_PER_PAGE = 5;

function PostDetailModal({ post, open, onClose }: { post: PostDetail | null; open: boolean; onClose: () => void }) {
  const [commentSort, setCommentSort] = useState<"likes" | "time" | "sentiment">("likes");
  const [commentPage, setCommentPage] = useState(0);
  const [detailLoading, setDetailLoading] = useState(true);
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  // Reset page & simulate loading when post changes
  useEffect(() => {
    if (post) {
      setCommentPage(0);
      setDetailLoading(true);
      setShowAllKeywords(false);
      const t = setTimeout(() => setDetailLoading(false), 800);
      return () => clearTimeout(t);
    }
  }, [post?.id]);

  if (!post) return null;

  const sortedComments = [...post.topComments].sort((a, b) => {
    if (commentSort === "likes") return b.likes - a.likes;
    if (commentSort === "sentiment") {
      const order = { negative: 0, neutral: 1, positive: 2 };
      return order[a.sentiment] - order[b.sentiment];
    }
    return 0; // time = default order
  });

  const totalPages = Math.ceil(sortedComments.length / COMMENTS_PER_PAGE);
  const pagedComments = sortedComments.slice(commentPage * COMMENTS_PER_PAGE, (commentPage + 1) * COMMENTS_PER_PAGE);
  const originalUrl = isValidHttpUrl(post.url) ? post.url : null;

  return (
    <Modal open={open} onClose={onClose} title="Post Details" size="lg">
      <div className="max-h-[70vh] overflow-y-auto -mx-6 px-6">
        {/* Loading skeleton with shimmer */}
        {detailLoading ? (
          <div className="space-y-4">
            <LoadingDots />
            <div className="flex items-start gap-3" style={{ animation: "skeletonStagger 0.5s ease-out both" }}>
              <div className="w-10 h-10 rounded-full skeleton-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded-lg w-32 skeleton-shimmer" />
                <div className="h-3 rounded-lg w-48 skeleton-shimmer" />
              </div>
            </div>
            <div className="space-y-2" style={{ animation: "skeletonStagger 0.5s ease-out 80ms both" }}>
              <div className="h-3 rounded-lg w-full skeleton-shimmer" />
              <div className="h-3 rounded-lg w-3/4 skeleton-shimmer" />
            </div>
            <div className="grid grid-cols-4 gap-2" style={{ animation: "skeletonStagger 0.5s ease-out 160ms both" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl p-3 h-16 skeleton-shimmer" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3" style={{ animation: "skeletonStagger 0.5s ease-out 240ms both" }}>
              <div className="rounded-xl h-32 skeleton-shimmer" />
              <div className="rounded-xl h-32 skeleton-shimmer" />
            </div>
            <div className="space-y-2 pt-4" style={{ borderTop: "1px solid var(--border)", animation: "skeletonStagger 0.5s ease-out 320ms both" }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-2.5 p-3 rounded-xl skeleton-shimmer">
                  <div className="w-7 h-7 rounded-full shrink-0" style={{ background: "var(--bg-inset)" }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded w-24" style={{ background: "var(--bg-inset)" }} />
                    <div className="h-3 rounded w-full" style={{ background: "var(--bg-inset)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
        <div className="content-reveal">
        {/* Post header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
            style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
          >
            {post.author.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{post.author}</p>
              <Badge variant={sentimentVariant[post.sentiment]} size="sm">{post.sentiment}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {platformLabel[post.platform]} · {post.time}
              </span>
              {originalUrl ? (
                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={originalUrl}
                  className="text-[10px] flex items-center gap-0.5"
                  style={{ color: "var(--accent)" }}
                >
                  <ExternalLink className="w-3 h-3" /> Open original post
                </a>
              ) : (
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                  Original link unavailable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
          {post.content}
        </p>

        {/* Keywords */}
        {post.keywords.length > 0 && (() => {
          const KW_LIMIT = 10;
          const overflow = post.keywords.length - KW_LIMIT;
          const visible = showAllKeywords ? post.keywords : post.keywords.slice(0, KW_LIMIT);
          return (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {visible.map((kw, i) => (
                <span
                  key={`${kw}-${i}`}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                  style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                >
                  {kw}
                </span>
              ))}
              {overflow > 0 && !showAllKeywords && (
                <button
                  type="button"
                  onClick={() => setShowAllKeywords(true)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors hover:opacity-80"
                  style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
                  aria-label={`Show ${overflow} more keywords`}
                >
                  +{overflow}
                </button>
              )}
              {showAllKeywords && post.keywords.length > KW_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllKeywords(false)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors hover:opacity-80"
                  style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
                >
                  Show less
                </button>
              )}
            </div>
          );
        })()}

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { icon: <Eye className="w-3.5 h-3.5" />, label: "Views", value: fmt(post.views) },
            { icon: <Heart className="w-3.5 h-3.5" />, label: "Likes", value: fmt(post.likes) },
            { icon: <MessageCircle className="w-3.5 h-3.5" />, label: "Comments", value: fmt(post.comments) },
            { icon: <Share2 className="w-3.5 h-3.5" />, label: "Shares", value: fmt(post.shares) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-hover)" }}>
              <div className="flex justify-center mb-1" style={{ color: "var(--text-faint)" }}>{stat.icon}</div>
              <p className="text-[14px] font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
              <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Sentiment breakdown + engagement trend */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl p-4" style={{ background: "var(--bg-hover)" }}>
            <p className="text-[11px] font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Comment Sentiment</p>
            <div className="space-y-2">
              {[
                { label: "Positive", pct: post.sentimentBreakdown.positive, color: "var(--success)" },
                { label: "Neutral", pct: post.sentimentBreakdown.neutral, color: "var(--warning)" },
                { label: "Negative", pct: post.sentimentBreakdown.negative, color: "var(--danger)" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.pct}%</span>
                  </div>
                  <ProgressBar value={s.pct} color={s.color} size="sm" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--bg-hover)" }}>
            <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Engagement (7 days)</p>
            <LineChart
              series={[{ label: "Engagement", data: post.engagementTrend, color: "var(--accent)" }]}
              height={80}
              showLegend={false}
            />
          </div>
        </div>

        {/* Comments section */}
        <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Comments ({post.topComments.length})
            </p>
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--bg-hover)" }}>
              {(["likes", "time", "sentiment"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setCommentSort(s)}
                  className="px-2 py-1 rounded-md text-[10px] font-medium capitalize transition-all"
                  style={{
                    background: commentSort === s ? "var(--bg-surface-solid)" : "transparent",
                    color: commentSort === s ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: commentSort === s ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {pagedComments.map((c) => (
              <div
                key={c.id}
                className="flex gap-2.5 p-3 rounded-xl"
                style={{ background: "var(--bg-hover)" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                >
                  {c.author.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>{c.author}</span>
                    <Badge variant={sentimentVariant[c.sentiment]} size="sm">{c.sentiment}</Badge>
                    <span className="text-[9px] ml-auto" style={{ color: "var(--text-faint)" }}>{c.time}</span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{c.content}</p>
                  <div className="flex items-center gap-1 mt-1" style={{ color: "var(--text-faint)" }}>
                    <Heart className="w-3 h-3" />
                    <span className="text-[10px] tabular-nums">{c.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => setCommentPage((p) => Math.max(0, p - 1))}
                disabled={commentPage === 0}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30"
                style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCommentPage(i)}
                    className="w-6 h-6 rounded-md text-[10px] font-bold transition-all"
                    style={{
                      background: commentPage === i ? "var(--accent)" : "var(--bg-hover)",
                      color: commentPage === i ? "white" : "var(--text-muted)",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCommentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={commentPage === totalPages - 1}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all disabled:opacity-30"
                style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
        </div>
        )}
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════
   TAB: Stalker
   ════════════════════════════════════════════ */
function StalkerTab() {
  const { activeCampaignId } = useScope();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">("all");
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const { data: apiProjects, isLoading: projectsLoading } = useProjectsByCampaign(activeCampaignId ?? undefined);
  const projectIds = useMemo(() => (apiProjects ?? []).map((project) => project.id), [apiProjects]);
  const { data: targets, isLoading: targetsLoading } = useCampaignTargets(projectIds);

  const projectNameById = useMemo(() => {
    const names = new Map<string, string>();
    for (const project of apiProjects ?? []) names.set(project.id, project.name);
    return names;
  }, [apiProjects]);

  const stalkers = useMemo(() => {
    return (targets ?? [])
      .filter((target) => target.target_type === "PROFILE" && (target.source_type === "FACEBOOK" || target.source_type === "TIKTOK"))
      .map((target) => ({
        ...target,
        project_name: target.project_id ? projectNameById.get(target.project_id) : undefined,
      }));
  }, [projectNameById, targets]);

  const filtered = stalkers.filter((target) => {
    if (filterStatus === "all") return true;
    return filterStatus === "active" ? target.is_active : !target.is_active;
  });

  const createStalker = useMutation({
    mutationFn: async (input: CreateFocusedSourceInput) => {
      const sourceType = toSourceType(input.platform);
      const existingSources = await datasourceApi.listByProject(input.projectId);
      const reusableStatuses = new Set<DataSource["status"]>(["PENDING", "READY", "ACTIVE", "PAUSED"]);
      let source = existingSources.find((item) => item.source_type === sourceType && reusableStatuses.has(item.status));

      if (!source) {
        source = await datasourceApi.create({
          project_id: input.projectId,
          name: `${platformLabel[input.platform]} Focused Sources`,
          description: `Focused ${platformLabel[input.platform]} profile/page monitoring`,
          source_type: sourceType,
          source_category: "CRAWL",
          crawl_mode: "NORMAL",
          crawl_interval_minutes: input.intervalMinutes,
        });
      }

      const target = await datasourceApi.createProfileTarget(source.id, {
        values: [input.url],
        label: input.label,
        platform_meta: input.platformMeta,
        crawl_interval_minutes: input.intervalMinutes,
        priority: 20,
      });

      await datasourceApi.activateTarget(source.id, target.id);
      await ensureDatasourceRuntime(source);
      return target;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.campaignTargets(projectIds) });
      for (const projectId of projectIds) {
        queryClient.invalidateQueries({ queryKey: datasourceKeys.byProject(projectId) });
      }
      setShowCreate(false);
    },
  });

  const toggleTarget = useMutation({
    mutationFn: async (target: TargetWithSource) => {
      setActionTargetId(target.id);
      if (target.is_active) {
        return datasourceApi.deactivateTarget(target.data_source_id, target.id);
      }
      const updated = await datasourceApi.activateTarget(target.data_source_id, target.id);
      await ensureDatasourceRuntime({
        id: target.data_source_id,
        status: target.datasource_status ?? "READY",
        source_type: target.source_type,
        source_category: "CRAWL",
        crawl_mode: "NORMAL",
        name: target.datasource_name,
        project_id: target.project_id ?? "",
        created_at: "",
        updated_at: "",
      });
      return updated;
    },
    onSettled: () => {
      setActionTargetId(null);
      queryClient.invalidateQueries({ queryKey: datasourceKeys.campaignTargets(projectIds) });
    },
  });

  if (projectsLoading || targetsLoading) return <ListSkeleton count={4} />;

  return (
    <div className="content-reveal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Stalker
          </h2>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Focused profile/page sources for campaign-owned crawling
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--bg-hover)" }}>
            {(["all", "active", "paused"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-2.5 py-1 rounded-md text-[10px] font-medium capitalize transition-all"
                style={{
                  background: filterStatus === s ? "var(--bg-surface-solid)" : "transparent",
                  color: filterStatus === s ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: filterStatus === s ? "var(--shadow-sm)" : "none",
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            disabled={(apiProjects ?? []).length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white"
            style={{ background: "var(--accent)", opacity: (apiProjects ?? []).length === 0 ? 0.5 : 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Stalker
          </button>
        </div>
      </div>

      {/* Stalker cards */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((target) => {
            const platform = sourceTypeToPlatform(target.source_type);
            const meta = target.platform_meta ?? {};
            const identity = platform === "facebook"
              ? String(meta.page_id ?? "")
              : String(meta.username ?? meta.sec_uid ?? "");
            const isPending = toggleTarget.isPending && actionTargetId === target.id;

            return (
              <Card key={target.id} className="!p-0 overflow-hidden">
                <div className="w-full flex items-center gap-3 p-4 text-left">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--accent-subtle)" }}
                  >
                    <Target className="w-5 h-5" style={{ color: "var(--accent)" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {target.label || target.values[0]}
                      </p>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-faint)" }}>
                        {platformLabel[platform]}
                      </span>
                      <Badge variant={target.is_active ? "success" : "warning"} dot={target.is_active} size="sm">
                        {target.is_active ? "active" : "paused"}
                      </Badge>
                      <Badge variant={target.datasource_status === "ACTIVE" ? "success" : "neutral"} size="sm">
                        {target.datasource_status ?? "source"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-0.5">
                      <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
                        <Clock className="w-3 h-3" /> Every {target.crawl_interval_minutes ?? 30}m
                      </span>
                      {target.project_name && (
                        <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                          {target.project_name}
                        </span>
                      )}
                      {identity && (
                        <span className="text-[10px] font-mono" style={{ color: "var(--text-faint)" }}>
                          {identity}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleTarget.mutate(target)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--text-muted)", opacity: isPending ? 0.5 : 1 }}
                      title={target.is_active ? "Pause focused source" : "Resume focused source"}
                    >
                      {target.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={target.values[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      title="Open source"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Target />}
          title="No stalkers yet"
          description="Add a Facebook page or TikTok profile to collect posts and comments from that source only."
          action={
            <button
              onClick={() => setShowCreate(true)}
              disabled={(apiProjects ?? []).length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white"
              style={{ background: "var(--accent)", opacity: (apiProjects ?? []).length === 0 ? 0.5 : 1 }}
            >
              <Plus className="w-3.5 h-3.5" /> New Stalker
            </button>
          }
        />
      )}

      {/* Create Stalker Modal */}
      <CreateStalkerModal
        open={showCreate}
        projects={apiProjects ?? []}
        isPending={createStalker.isPending}
        errorMessage={createStalker.error ? getMutationErrorMessage(createStalker.error) : ""}
        onClose={() => setShowCreate(false)}
        onSubmit={(input) => createStalker.mutate(input)}
      />
    </div>
  );
}

/* ── Create Stalker Modal ── */
type StalkerPlatform = Extract<Platform, "facebook" | "tiktok">;

type CreateFocusedSourceInput = {
  projectId: string;
  platform: StalkerPlatform;
  url: string;
  label: string;
  intervalMinutes: number;
  platformMeta: Record<string, unknown>;
};

function CreateStalkerModal({
  open,
  projects,
  isPending,
  errorMessage,
  onClose,
  onSubmit,
}: {
  open: boolean;
  projects: Array<{ id: string; name: string }>;
  isPending: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (input: CreateFocusedSourceInput) => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<StalkerPlatform>("facebook");
  const [label, setLabel] = useState("");
  const [pageId, setPageId] = useState("");
  const [username, setUsername] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState("30");

  useEffect(() => {
    if (open && !projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [open, projectId, projects]);

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200";
  const inputStyle = { background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" };

  const reset = () => {
    setProjectId(projects[0]?.id ?? "");
    setUrl("");
    setPlatform("facebook");
    setLabel("");
    setPageId("");
    setUsername("");
    setIntervalMinutes("30");
  };

  const resolvedPageId = pageId.trim() || extractFacebookPageId(url);
  const resolvedUsername = username.trim().replace(/^@/, "") || extractTikTokUsername(url);
  const parsedInterval = Math.max(5, Number(intervalMinutes) || 30);
  const canSubmit = Boolean(
    projectId &&
    url.trim() &&
    label.trim() &&
    (platform === "facebook" ? /^\d{5,}$/.test(resolvedPageId) : resolvedUsername),
  );

  const submit = () => {
    if (!canSubmit || isPending) return;
    onSubmit({
      projectId,
      platform,
      url: url.trim(),
      label: label.trim(),
      intervalMinutes: parsedInterval,
      platformMeta: platform === "facebook"
        ? { page_id: resolvedPageId, source_kind: "focused_page" }
        : { username: resolvedUsername, source_kind: "focused_profile" },
    });
  };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Create Stalker" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Project</label>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={inputClass} style={inputStyle}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Platform</label>
          <div className="grid grid-cols-2 gap-2">
            {(["facebook", "tiktok"] as StalkerPlatform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-medium transition-all"
                style={{
                  background: platform === p ? "var(--accent-subtle)" : "var(--bg-hover)",
                  border: `1.5px solid ${platform === p ? "var(--accent)" : "var(--border)"}`,
                  color: platform === p ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {platformLabel[p]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Display name</label>
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={platform === "facebook" ? "Ahamove Facebook Page" : "Ahamove TikTok Profile"}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Source URL</label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-faint)" }} />
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={platform === "facebook" ? "https://www.facebook.com/profile.php?id=100066224874581" : "https://www.tiktok.com/@username"}
              className={`${inputClass} pl-10`}
              style={inputStyle}
            />
          </div>
        </div>

        {platform === "facebook" ? (
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Facebook numeric page ID</label>
            <input
              type="text"
              value={pageId}
              onChange={(event) => setPageId(event.target.value.replace(/\D/g, ""))}
              placeholder="100066224874581"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>TikTok username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value.replace(/^@/, ""))}
              placeholder="username"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Crawl interval minutes</label>
          <input
            type="number"
            value={intervalMinutes}
            onChange={(event) => setIntervalMinutes(event.target.value)}
            className={inputClass}
            style={inputStyle}
            min={5}
          />
        </div>

        {errorMessage && (
          <p className="text-[11px]" style={{ color: "var(--danger)" }}>{errorMessage}</p>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={() => { onClose(); reset(); }} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>Cancel</button>
          <button
            onClick={submit}
            disabled={!canSubmit || isPending}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            {isPending ? "Creating..." : "Create Stalker"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function toSourceType(platform: StalkerPlatform): SourceType {
  return platform === "facebook" ? "FACEBOOK" : "TIKTOK";
}

function sourceTypeToPlatform(sourceType: SourceType): Platform {
  if (sourceType === "FACEBOOK") return "facebook";
  if (sourceType === "TIKTOK") return "tiktok";
  return "youtube";
}

async function ensureDatasourceRuntime(source: DataSource) {
  if (source.status === "ACTIVE") return;
  if (source.status === "PAUSED") {
    await datasourceApi.resume(source.id);
    return;
  }
  if (source.status === "READY" || source.status === "PENDING") {
    await datasourceApi.activate(source.id);
    return;
  }
  throw new Error(`Datasource is ${source.status.toLowerCase()}`);
}

function extractFacebookPageId(raw: string): string {
  try {
    const url = new URL(raw);
    const queryId = url.searchParams.get("id")?.trim();
    if (queryId && /^\d{5,}$/.test(queryId)) return queryId;
    const pathId = url.pathname.split("/").find((part) => /^\d{5,}$/.test(part));
    return pathId ?? "";
  } catch {
    return "";
  }
}

function extractTikTokUsername(raw: string): string {
  try {
    const url = new URL(raw);
    const handle = url.pathname.split("/").find((part) => part.startsWith("@"));
    return handle?.replace(/^@/, "") ?? "";
  } catch {
    return "";
  }
}

function getMutationErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "Could not save focused source";
}

/* ════════════════════════════════════════════
   TAB: Reports
   ════════════════════════════════════════════ */
function ReportsTab() {
  const { activeCampaignId } = useScope();
  const router = useRouter();
  const [showGenerate, setShowGenerate] = useState(false);
  const [reviewReport, setReviewReport] = useState<ReportItem | null>(null);
  const { data, isLoading } = useReports(activeCampaignId);

  if (!activeCampaignId) {
    return (
      <div className="content-reveal">
        <EmptyState
          icon={<BarChart3 />}
          title="Select a campaign first"
          description="Open a campaign from Projects to generate and review reports."
        />
      </div>
    );
  }

  if (isLoading) return <ListSkeleton count={4} />;

  const reports = data?.items ?? [];
  const openDetail = (id: string) => {
    router.push(`/smap/reports/${id}?camp_id=${activeCampaignId}`);
  };
  const downloadReport = async (report: ReportItem) => {
    if (report.status !== "ready") return;
    const file = await reportsApi.download(report.id);
    window.open(file.downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="content-reveal">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Reports</h2>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Generate and manage campaign reports
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white"
          style={{ background: "var(--accent)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
        >
          <Plus className="w-3.5 h-3.5" />
          Generate Report
        </button>
      </div>

      {reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => {
            const nonTerminal =
              report.status === "generating" ||
              report.status === "failed" ||
              report.status === "cancelled";
            if (nonTerminal) {
              return <GeneratingReportCard key={report.id} report={report} />;
            }
            return (
              <Card key={report.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: report.type === "competitor" ? "var(--warning-bg)" : "var(--accent-subtle)",
                      }}
                    >
                      {report.type === "competitor" ? (
                        <Target className="w-5 h-5" style={{ color: "var(--warning)" }} />
                      ) : (
                        <BarChart3 className="w-5 h-5" style={{ color: "var(--accent)" }} />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{report.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={report.type === "competitor" ? "warning" : report.type === "campaign" ? "accent" : "info"} size="sm">
                          {report.type}
                        </Badge>
                        <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                          {new Date(report.generatedAt).toLocaleString("vi-VN")}
                        </span>
                        {report.totals && (
                          <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                            · {report.totals.posts} posts · {report.totals.comments} comments
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                        Scope: {report.scope}
                      </p>
                      {report.sections.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {report.sections.map((s) => (
                            <span
                              key={s}
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                              style={{ background: "var(--bg-hover)", color: "var(--text-faint)" }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button
                      onClick={() => setReviewReport(report)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                      style={{ color: "var(--accent)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-subtle)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => openDetail(report.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </button>
                    <button
                      onClick={() => downloadReport(report)}
                      disabled={report.status !== "ready"}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<BarChart3 />}
          title="No reports yet"
          description="Generate your first report from campaign data or competitor analysis"
          action={
            <button
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Generate Report
            </button>
          }
        />
      )}

      {/* Generate Report Modal */}
      <GenerateReportModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        campaignId={activeCampaignId}
      />

      {/* Review modal (paginated post list) */}
      {reviewReport && (
        <ReviewPostsModal
          open={!!reviewReport}
          onClose={() => setReviewReport(null)}
          report={reviewReport}
        />
      )}
    </div>
  );
}

/* ── Generate Report Modal ── */
interface GenerateReportModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
}

function GenerateReportModal({ open, onClose, campaignId }: GenerateReportModalProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"existing" | "competitor">("existing");
  const [competitorUrls, setCompetitorUrls] = useState("");
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(["tiktok", "facebook", "youtube"]));
  const [maxPosts, setMaxPosts] = useState<number>(50);
  const [campaignPending, setCampaignPending] = useState(false);
  const [campaignGenerateError, setCampaignGenerateError] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(["Overview", "Sentiment Analysis", "Trends", "Top Posts", "Platform Breakdown"])
  );

  const generate = useGenerateCompetitor();

  const toggleSection = useCallback((s: string) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);

  const togglePlatform = useCallback((p: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }, []);

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200";
  const inputStyle = { background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" };

  const allSectionsExisting = ["Overview", "Sentiment Analysis", "Trends", "Top Posts", "Platform Breakdown", "Recommendations"];
  const allSectionsCompetitor = ["Engagement Analysis", "Content Strategy", "Sentiment Breakdown", "Audience Insights", "Competitive Gap"];

  const sections = mode === "existing" ? allSectionsExisting : allSectionsCompetitor;

  // Validate competitor URLs against selected platforms.
  const urlRows = useMemo(() => {
    const lines = competitorUrls.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.map((url) => {
      const detected = detectPlatform(url);
      const allowed = detected !== null && platforms.has(detected);
      return { url, detected, allowed };
    });
  }, [competitorUrls, platforms]);

  const validUrls = urlRows.filter((r) => r.allowed).map((r) => r.url);
  const invalidUrls = urlRows.filter((r) => !r.allowed);

  const maxPostsValid = maxPosts >= 1 && maxPosts <= 500;
  const canGenerate =
    mode === "existing"
      ? true
      : validUrls.length > 0 && invalidUrls.length === 0 && platforms.size > 0 && maxPostsValid;

  const handleGenerate = async () => {
    if (mode !== "competitor") {
      try {
        setCampaignPending(true);
        setCampaignGenerateError(false);
        await reportsApi.generateCampaign({
          campaignId,
          title: `Campaign intelligence report · ${new Date().toLocaleDateString("vi-VN")}`,
          sections: Array.from(selectedSections),
          source: "manual",
        });
        queryClient.invalidateQueries({ queryKey: reportKeys.list(campaignId) });
        onClose();
        return;
      } catch {
        setCampaignGenerateError(true);
        return;
      } finally {
        setCampaignPending(false);
      }
    }
    try {
      await generate.mutateAsync({
        campaignId,
        competitorUrls: validUrls,
        platforms: Array.from(platforms),
        sections: Array.from(selectedSections),
        maxPostsPerCompetitor: maxPosts,
      });
      // Reset and close
      setCompetitorUrls("");
      setMaxPosts(50);
      onClose();
    } catch {
      /* mutation error surfaced below via generate.error */
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Generate Report" size="md">
      <div className="max-h-[70vh] overflow-y-auto -mx-6 px-6">
        {/* Mode selector */}
        <p className="text-[12px] mb-3" style={{ color: "var(--text-muted)" }}>Choose report type</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([
            { id: "existing" as const, label: "From Campaign Data", desc: "Use existing tracked data", icon: <BarChart3 className="w-5 h-5" /> },
            { id: "competitor" as const, label: "Benchmark Brief", desc: "Use tracked knowledge plus source context", icon: <Globe className="w-5 h-5" /> },
          ]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all"
              style={{
                background: mode === opt.id ? "var(--accent-subtle)" : "var(--bg-hover)",
                border: `1.5px solid ${mode === opt.id ? "var(--accent)" : "var(--border)"}`,
                color: mode === opt.id ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {opt.icon}
              <span className="text-[12px] font-semibold">{opt.label}</span>
              <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>{opt.desc}</span>
            </button>
          ))}
        </div>

        {mode === "existing" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Scope (uses current ScopeFilter selection)
              </label>
              <div className="p-3 rounded-xl text-[12px]" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                Current scope will be used. Adjust via the scope filter above.
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Date range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" defaultValue="2026-03-01" className={inputClass} style={inputStyle} />
                <input type="date" defaultValue="2026-04-14" className={inputClass} style={inputStyle} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Platform multi-select */}
            <div>
              <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Platforms to analyse
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["tiktok", "facebook", "youtube"] as Platform[]).map((p) => {
                  const active = platforms.has(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-medium transition-all"
                      style={{
                        background: active ? "var(--accent-subtle)" : "var(--bg-hover)",
                        border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                        color: active ? "var(--accent)" : "var(--text-muted)",
                      }}
                    >
                      <PlatformIcon platform={p} size={14} />
                      {PLATFORM_LABEL[p]}
                    </button>
                  );
                })}
              </div>
              {platforms.size === 0 && (
                <p className="text-[10px] mt-1" style={{ color: "var(--danger)" }}>
                  Select at least one platform.
                </p>
              )}
            </div>

            {/* Competitor URLs */}
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Competitor URLs (one per line)
              </label>
              <textarea
                value={competitorUrls}
                onChange={(e) => setCompetitorUrls(e.target.value)}
                placeholder={"https://tiktok.com/@competitor\nhttps://facebook.com/competitor"}
                rows={4}
                className={`${inputClass} resize-none`}
                style={inputStyle}
              />
              {urlRows.length > 0 && (
                <div className="mt-2 space-y-1">
                  {urlRows.map((r, i) => (
                    <div
                      key={`${r.url}-${i}`}
                      className="flex items-center gap-2 text-[10px] px-2 py-1 rounded-md"
                      style={{
                        background: r.allowed ? "var(--success-bg)" : "var(--danger-bg)",
                        color: r.allowed ? "var(--success)" : "var(--danger)",
                      }}
                    >
                      {r.detected && <PlatformIcon platform={r.detected} size={12} />}
                      <span className="truncate flex-1">{r.url}</span>
                      <span className="shrink-0 font-semibold">
                        {r.allowed
                          ? (r.detected ? PLATFORM_LABEL[r.detected] : "ok")
                          : r.detected
                            ? `${PLATFORM_LABEL[r.detected]} not selected`
                            : "unknown platform"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Max posts */}
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Evidence posts to review
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={maxPosts}
                onChange={(e) => setMaxPosts(Number(e.target.value) || 0)}
                className={inputClass}
                style={inputStyle}
              />
              <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                Knowledge-srv will use the strongest indexed evidence available. Default 50.
              </p>
            </div>
          </div>
        )}

        {/* Section selection */}
        <div className="mt-5">
          <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Report sections
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => toggleSection(s)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium text-left transition-all"
                style={{
                  background: selectedSections.has(s) ? "var(--accent-subtle)" : "var(--bg-hover)",
                  border: `1px solid ${selectedSections.has(s) ? "var(--accent)" : "var(--border)"}`,
                  color: selectedSections.has(s) ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                  style={{
                    background: selectedSections.has(s) ? "var(--accent)" : "transparent",
                    border: selectedSections.has(s) ? "none" : "1.5px solid var(--input-border)",
                  }}
                >
                  {selectedSections.has(s) && <span className="text-white text-[8px]">✓</span>}
                </span>
                {s}
              </button>
            ))}
          </div>
        </div>

        {(generate.isError || campaignGenerateError) && (
          <div className="mt-4 p-3 rounded-xl text-[12px]" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
            Failed to start report. Please try again.
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generate.isPending || campaignPending || !canGenerate}
          className="w-full mt-6 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)" }}
          onMouseEnter={(e) => { if (!generate.isPending && canGenerate) e.currentTarget.style.background = "var(--accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
        >
          {generate.isPending || campaignPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate Report
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════ */
export default function Dashboard() {
  const { activeTab } = useNav();

  return (
    <div className="max-w-[1600px] mx-auto px-6 pt-24 pb-20">
      <div className="sticky top-[72px] z-40 -mx-6 px-6 py-3 mb-2 flex justify-center">
        <ScopeFilter />
      </div>

      {activeTab === "MAP" && <MapTab />}
      {activeTab === "Projects" && <ProjectsTab />}
      {activeTab === "Insights" && <InsightsTab />}
      {activeTab === "Stalker" && <StalkerTab />}
      {activeTab === "Reports" && <ReportsTab />}
    </div>
  );
}
