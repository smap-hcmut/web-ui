"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNav } from "@/components/NavProvider";
import { ScopeFilter } from "@/components/ScopeFilter";
import { useScope } from "@/components/ScopeProvider";
import { GeneratingReportCard } from "@/components/reports/GeneratingReportCard";
import { ReviewPostsModal } from "@/components/reports/ReviewPostsModal";
import { ProjectFlipCard, CreateProjectModal, ProjectConfigModal } from "@/components/cards/ProjectCardsRow";
import HeapSpace from "@/components/heap/HeapSpace";
import { GlowCard } from "@/components/animated/GlowCard";
import { AnimatedCounter } from "@/components/animated/AnimatedCounter";
import { TrendArrow } from "@/components/animated/TrendArrow";
import { SentimentPulse } from "@/components/animated/SentimentPulse";
import { LineChart } from "@/components/charts/LineChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import { WordCloud } from "@/components/charts/WordCloud";
import { RadarChart } from "@/components/charts/RadarChart";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { RankList } from "@/components/ui/RankList";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PlatformOverviewCard } from "@/components/cards/PlatformOverviewCard";
import { PostCard } from "@/components/cards/PostCard";
import { PlatformIcon } from "@/components/icons/PlatformIcon";
import type { Platform, StalkerTarget, StalkerAlert, PostDetail, ReportItem } from "@/lib/types";
import {
  useCampaignKPIs,
  usePlatformStats,
  useSentimentData,
  useTrendingKeywords,
  useRecentActivity,
  useProjectsByCampaign,
  useCreateProject,
  useProjectStats,
  useReports,
  useGenerateCompetitor,
  type PostItem,
  type ProjectStat,
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

const chartColors: Record<string, string> = {
  tiktok: "var(--chart-1)",
  facebook: "var(--chart-2)",
  youtube: "var(--chart-3)",
};

const platformLabel: Record<string, string> = {
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
};

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseMetricValue(v: string): number {
  const cleaned = v.replace(/[,%]/g, "");
  if (cleaned.endsWith("M")) return parseFloat(cleaned) * 1_000_000;
  if (cleaned.endsWith("K")) return parseFloat(cleaned) * 1_000;
  return parseFloat(cleaned);
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
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

const sentimentVariant = { positive: "success", negative: "danger", neutral: "warning" } as const;
const alertSeverityVariant = { info: "info", warning: "warning", critical: "danger" } as const;

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

  // Real data hooks
  const { data: kpisData, isLoading: kpisLoading } = useCampaignKPIs(activeCampaignId ?? undefined);
  const { data: keywordsData, isLoading: keywordsLoading } = useTrendingKeywords(activeCampaignId ?? undefined);
  const { data: sentimentData, isLoading: sentimentLoading } = useSentimentData(activeCampaignId ?? undefined);

  const isLoading = kpisLoading || keywordsLoading || sentimentLoading;
  const waitingForCampaign = !activeCampaignId;

  // KPI metrics from API (or empty)
  const kpiMetrics = kpisData?.metrics ?? [];

  // Trending topics for sidebar
  const scopedTrending = useMemo(
    () => (keywordsData?.keywords ?? []).slice(0, 7).map((k) => ({ label: k.text, value: k.volume })),
    [keywordsData],
  );

  // Overall sentiment from API
  const scopedSentiment = sentimentData?.pulse ?? 0;
  const keywordCount = keywordsData?.keywords?.length ?? 0;

  if (waitingForCampaign || isLoading) return <TabSkeleton rows={2} />;

  return (
    <>
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
            <HeapSpace />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <Card className="flex-1">
            <SectionTitle sub="Top hashtags by volume">Trending Topics</SectionTitle>
            {scopedTrending.length > 0 ? (
              <RankList items={scopedTrending} maxItems={7} />
            ) : (
              <p className="text-[11px] py-6 text-center" style={{ color: "var(--text-faint)" }}>No trending topics yet</p>
            )}
          </Card>

          <Card className="flex items-center justify-center gap-6">
            <SentimentPulse value={scopedSentiment} size={80} />
            <div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Overall Sentiment
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {keywordCount} keywords tracked<br />
                {sentimentData?.donut?.length ?? 0} sentiment segments
              </p>
            </div>
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

  const { data: apiProjects, isLoading } = useProjectsByCampaign(activeCampaignId ?? undefined);
  const createProject = useCreateProject(activeCampaignId ?? '');
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
        keywords: [] as import('@/lib/types').Keyword[],
        platforms: undefined,
        status: p.status === 'ACTIVE' ? ('active' as const) : ('paused' as const),
        crisis_config: undefined,
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
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {configModalProject && (
        <ProjectConfigModal
          project={configModalProject}
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
  const [sortBy, setSortBy] = useState<"engagement" | "time">("engagement");

  // Real data hooks
  const { data: platformData, isLoading: platformLoading } = usePlatformStats(activeCampaignId ?? undefined);
  const { data: sentimentData, isLoading: sentimentLoading } = useSentimentData(activeCampaignId ?? undefined);
  const { data: keywordsData, isLoading: keywordsLoading } = useTrendingKeywords(activeCampaignId ?? undefined);
  const { data: postsData, isLoading: postsLoading } = useRecentActivity({
    campaignId: activeCampaignId ?? undefined,
    platform: platformFilter !== "all" ? platformFilter : undefined,
    sentiment: sentimentFilter !== "all" ? sentimentFilter : undefined,
    sort: sortBy,
    limit: 30,
  });

  const isLoading = platformLoading || sentimentLoading || keywordsLoading;
  const waitingForCampaign = !activeCampaignId;

  if (waitingForCampaign || isLoading) {
    return <TabSkeleton rows={3} />;
  }

  // Platform overview cards
  const scopedPlatformStats = useMemo(() => {
    return (platformData?.stats ?? []).map((p) => ({
      platform: p.platform as Platform,
      name: platformLabel[p.platform] ?? p.platform,
      mentions: p.mentions,
      mentionsChange: p.mentionsChange,
      engagement: p.engagement,
      sentiment: p.sentiment,
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
    () => platformData?.months ?? [],
    [platformData],
  );

  // Sentiment donut
  const sentimentSegments = useMemo(() => {
    const donut = sentimentData?.donut ?? [];
    const colorMap: Record<string, string> = { positive: "var(--success)", neutral: "var(--warning)", negative: "var(--danger)" };
    return donut.map((d) => ({
      label: d.label.charAt(0).toUpperCase() + d.label.slice(1),
      value: d.value || 1,
      color: colorMap[d.label] ?? "var(--text-faint)",
    }));
  }, [sentimentData]);

  // Word cloud from keywords
  const wordCloudItems = useMemo(
    () =>
      (keywordsData?.wordCloud ?? []).map((w) => ({
        text: w.text,
        value: w.value,
        color: w.color,
        opacity: w.opacity,
      })),
    [keywordsData],
  );

  // Bar chart (per-platform performance)
  const barCategories = scopedPlatformStats.map((p) => ({
    label: p.name,
    values: [
      { key: "Engagement", value: parseMetricValue(p.engagement) / 1000, color: "var(--chart-1)", formatted: p.engagement },
      { key: "Sentiment", value: p.sentiment, color: "var(--chart-2)", formatted: `${p.sentiment}%` },
      { key: "Growth", value: Math.abs(p.mentionsChange) * 3, color: "var(--chart-3)", formatted: `${p.mentionsChange >= 0 ? "+" : ""}${p.mentionsChange}%` },
    ],
  }));

  // Radar chart
  const radarAxes = [
    { key: "mentions", label: "Mentions" },
    { key: "engagement", label: "Engagement" },
    { key: "sentiment", label: "Sentiment" },
    { key: "growth", label: "Growth" },
    { key: "reach", label: "Reach" },
  ];

  const maxMentions = Math.max(...scopedPlatformStats.map((p) => p.mentions), 1);
  const radarSeries = scopedPlatformStats.map((p) => ({
    label: p.name,
    color: chartColors[p.platform] ?? "var(--chart-1)",
    values: {
      mentions: Math.min((p.mentions / maxMentions) * 100, 100),
      engagement: Math.min(parseMetricValue(p.engagement) / (maxMentions * 2) * 100, 100),
      sentiment: p.sentiment,
      growth: Math.min(Math.abs(p.mentionsChange) * 3, 100),
      reach: Math.min((p.mentions / maxMentions) * 80, 100),
    },
  }));

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
    () => sentimentData?.months ?? [],
    [sentimentData],
  );

  // Engagement funnel from KPIs engagement breakdown (approximate from posts data)
  const totalMentions = scopedPlatformStats.reduce((s, p) => s + p.mentions, 0);
  const engagementFunnel = [
    { label: "Views", value: Math.round(totalMentions * 3.35), pct: 100 },
    { label: "Likes", value: Math.round(totalMentions * 1.9), pct: totalMentions > 0 ? 57 : 0 },
    { label: "Comments", value: Math.round(totalMentions * 0.23), pct: totalMentions > 0 ? 7 : 0 },
    { label: "Shares", value: Math.round(totalMentions * 0.095), pct: totalMentions > 0 ? 3 : 0 },
  ];

  // Trending topics ranked
  const rankedKeywords = useMemo(() => {
    const kws = keywordsData?.keywords ?? [];
    return kws.map((k) => ({ label: k.text, value: k.volume }));
  }, [keywordsData]);
  const firstHalf = rankedKeywords.slice(0, Math.ceil(rankedKeywords.length / 2));
  const secondHalf = rankedKeywords.slice(Math.ceil(rankedKeywords.length / 2));

  // Posts
  const filteredPosts = postsData?.posts ?? [];

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

  if (isLoading) return <TabSkeleton rows={3} />;

  return (
    <div className="content-reveal">
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

      {/* Row 2: Mentions trend (compact) + Sentiment donut + Radar */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <Card className="col-span-12 lg:col-span-5">
          <SectionTitle sub="12-month trend">Mentions Over Time</SectionTitle>
          <AreaChart series={mentionsSeries} xLabels={mentionsLabels.length > 0 ? mentionsLabels : months} height={180} />
        </Card>

        <Card className="col-span-6 lg:col-span-3 flex flex-col">
          <SectionTitle sub="Keyword distribution">Sentiment</SectionTitle>
          <div className="flex-1 flex items-center justify-center">
            <DonutChart segments={sentimentSegments} size={130} />
          </div>
        </Card>

        <Card className="col-span-6 lg:col-span-4 flex flex-col items-center">
          <SectionTitle sub="Multi-dimensional">Platform Radar</SectionTitle>
          <RadarChart axes={radarAxes} series={radarSeries} size={180} showLegend={false} />
        </Card>
      </div>

      {/* Row 3: Bar chart + Word cloud + Heatmap */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle sub="Engagement · Sentiment · Growth">Performance</SectionTitle>
          <BarChart categories={barCategories} height={170} showLegend={false} />
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle sub="Size = volume, opacity = sentiment">Keyword Cloud</SectionTitle>
          {wordCloudItems.length > 0 ? (
            <WordCloud words={wordCloudItems} maxWords={15} height={170} />
          ) : (
            <div className="flex items-center justify-center" style={{ height: 170 }}>
              <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>No keyword data available</p>
            </div>
          )}
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle sub="Per-platform trend">Sentiment Timeline</SectionTitle>
          <AreaChart series={sentimentTimeline} xLabels={sentimentTimelineLabels.length > 0 ? sentimentTimelineLabels : months} height={170} />
        </Card>
      </div>

      {/* Row 4: Engagement funnel + Trending topics compact */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle sub="Content conversion">Engagement Funnel</SectionTitle>
          <div className="space-y-2.5">
            {engagementFunnel.map((stage) => (
              <div key={stage.label} className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-medium truncate" style={{ color: "var(--text-secondary)" }}>{stage.label}</span>
                  <span className="text-[11px] font-bold tabular-nums whitespace-nowrap shrink-0" style={{ color: "var(--text-primary)" }}>
                    {fmt(stage.value)} <span className="font-normal" style={{ color: "var(--text-faint)" }}>({stage.pct}%)</span>
                  </span>
                </div>
                <ProgressBar value={stage.pct} size="sm" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-8">
          <SectionTitle sub="All keywords ranked by volume">Trending Topics</SectionTitle>
          {rankedKeywords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <RankList items={firstHalf} maxItems={10} />
              <RankList items={secondHalf} maxItems={10} startRank={firstHalf.length + 1} />
            </div>
          ) : (
            <p className="text-[11px] py-6 text-center" style={{ color: "var(--text-faint)" }}>No keyword data available</p>
          )}
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
                  onClick={() => setPlatformFilter(p)}
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
                  onClick={() => setSentimentFilter(s)}
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

            {/* Sort */}
            <button
              onClick={() => setSortBy(sortBy === "engagement" ? "time" : "engagement")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap"
              style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
            >
              <ArrowUpDown className="w-3 h-3 shrink-0" />
              {sortBy === "engagement" ? "By Engagement" : "By Time"}
            </button>
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredPosts.slice(0, 12).map((post) => (
              <button
                key={post.id}
                onClick={() => setPostDetailId(post.id)}
                className="text-left w-full"
              >
                <PostCard
                  author={post.author}
                  content={post.content}
                  platform={post.platform as Platform}
                  sentiment={post.sentiment}
                  engagement={post.engagement}
                  time={post.time}
                />
              </button>
            ))}
          </div>
        ) : postsLoading ? (
          <LoadingDots />
        ) : (
          <EmptyState title="No posts found" description="Try adjusting your filters" />
        )}

        {filteredPosts.length > 12 && (
          <p className="text-center text-[11px] mt-4" style={{ color: "var(--text-faint)" }}>
            Showing 12 of {filteredPosts.length} posts
          </p>
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
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {platformLabel[post.platform]} · {post.time}
              </span>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] flex items-center gap-0.5"
                style={{ color: "var(--accent)" }}
              >
                <ExternalLink className="w-3 h-3" /> View original
              </a>
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
  const [stalkers] = useState<StalkerTarget[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const filtered = stalkers.filter((s) => filterStatus === "all" || s.status === filterStatus);
  const unreadTotal = stalkers.reduce((sum, s) => sum + s.alerts.filter((a) => !a.read).length, 0);

  if (loading) return <ListSkeleton count={4} />;

  return (
    <div className="content-reveal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Stalker
            {unreadTotal > 0 && (
              <span
                className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                style={{ background: "var(--danger)" }}
              >
                {unreadTotal}
              </span>
            )}
          </h2>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Monitor profiles and posts for real-time changes
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white"
            style={{ background: "var(--accent)" }}
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
          {filtered.map((stalker) => {
            const expanded = expandedId === stalker.id;
            const unread = stalker.alerts.filter((a) => !a.read).length;

            return (
              <Card key={stalker.id} className="!p-0 overflow-hidden">
                {/* Card header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(expanded ? null : stalker.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(expanded ? null : stalker.id); } }}
                  className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--accent-subtle)" }}
                  >
                    {stalker.type === "profile" ? (
                      <Target className="w-5 h-5" style={{ color: "var(--accent)" }} />
                    ) : (
                      <FileText className="w-5 h-5" style={{ color: "var(--accent)" }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {stalker.name}
                      </p>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-faint)" }}>
                        {platformLabel[stalker.platform]}
                      </span>
                      <Badge variant={stalker.status === "active" ? "success" : "warning"} dot={stalker.status === "active"} size="sm">
                        {stalker.status}
                      </Badge>
                      {unread > 0 && (
                        <span
                          className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white"
                          style={{ background: "var(--danger)" }}
                        >
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
                        <Clock className="w-3 h-3" /> Last checked: {stalker.lastChecked}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                        {stalker.totalAlerts} total alerts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      title={stalker.status === "active" ? "Pause" : "Resume"}
                    >
                      {stalker.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--danger)" }}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {expanded ? <ChevronDown className="w-4 h-4" style={{ color: "var(--text-faint)" }} /> : <ChevronRight className="w-4 h-4" style={{ color: "var(--text-faint)" }} />}
                  </div>
                </div>

                {/* Expanded alert feed */}
                {expanded && (
                  <div className="px-4 pb-4 pt-0">
                    {/* Thresholds summary */}
                    <div className="flex flex-wrap gap-2 mb-3 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-lg" style={{ background: stalker.thresholds.newPost ? "var(--success-bg)" : "var(--bg-hover)", color: stalker.thresholds.newPost ? "var(--success)" : "var(--text-faint)" }}>
                        {stalker.thresholds.newPost ? <Bell className="w-3 h-3 inline mr-1" /> : <BellOff className="w-3 h-3 inline mr-1" />}
                        New posts
                      </span>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-lg" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        Neg. sentiment &gt; {stalker.thresholds.commentSentiment}%
                      </span>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-lg" style={{ background: "var(--info-bg)", color: "var(--info)" }}>
                        <Heart className="w-3 h-3 inline mr-1" />
                        Engagement &gt; {fmt(stalker.thresholds.engagementThreshold)}
                      </span>
                    </div>

                    {/* Alert timeline */}
                    <div className="space-y-1.5">
                      {stalker.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl transition-colors"
                          style={{
                            background: alert.read ? "transparent" : "var(--bg-hover)",
                            opacity: alert.read ? 0.7 : 1,
                          }}
                        >
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: `var(--${alertSeverityVariant[alert.severity]}-bg)` }}
                          >
                            {alert.type === "new_post" && <FileText className="w-3 h-3" style={{ color: `var(--${alertSeverityVariant[alert.severity]})` }} />}
                            {alert.type === "comment_spike" && <MessageCircle className="w-3 h-3" style={{ color: `var(--${alertSeverityVariant[alert.severity]})` }} />}
                            {alert.type === "engagement_threshold" && <Heart className="w-3 h-3" style={{ color: `var(--${alertSeverityVariant[alert.severity]})` }} />}
                            {alert.type === "sentiment_shift" && <AlertTriangle className="w-3 h-3" style={{ color: `var(--${alertSeverityVariant[alert.severity]})` }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{alert.title}</p>
                              {!alert.read && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />}
                            </div>
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{alert.description}</p>
                          </div>
                          <span className="text-[9px] shrink-0" style={{ color: "var(--text-faint)" }}>{alert.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Target />}
          title="No stalkers yet"
          description="Create a stalker to start monitoring profiles and posts in real-time"
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              <Plus className="w-3.5 h-3.5" /> New Stalker
            </button>
          }
        />
      )}

      {/* Create Stalker Modal */}
      <CreateStalkerModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

/* ── Create Stalker Modal ── */
function CreateStalkerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [type, setType] = useState<"profile" | "post">("profile");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [newPost, setNewPost] = useState(true);
  const [sentimentThreshold, setSentimentThreshold] = useState("50");
  const [engagementThreshold, setEngagementThreshold] = useState("1000");
  const [creating, setCreating] = useState(false);

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200";
  const inputStyle = { background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" };

  const reset = () => { setStep(0); setType("profile"); setUrl(""); setPlatform("tiktok"); setNewPost(true); setSentimentThreshold("50"); setEngagementThreshold("1000"); };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Create Stalker" size="md">
      {step === 0 && (
        <div>
          <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>What do you want to monitor?</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {([
              { id: "profile" as const, label: "Profile / Page", desc: "Track a social media profile", icon: <Target className="w-5 h-5" /> },
              { id: "post" as const, label: "Specific Post", desc: "Monitor a single post", icon: <FileText className="w-5 h-5" /> },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setType(opt.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all"
                style={{
                  background: type === opt.id ? "var(--accent-subtle)" : "var(--bg-hover)",
                  border: `1.5px solid ${type === opt.id ? "var(--accent)" : "var(--border)"}`,
                  color: type === opt.id ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {opt.icon}
                <span className="text-[12px] font-semibold">{opt.label}</span>
                <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>{opt.desc}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            Continue
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>Enter the URL and select platform</p>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>URL</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-faint)" }} />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={type === "profile" ? "https://tiktok.com/@username" : "https://tiktok.com/@user/video/123"}
                  className={`${inputClass} pl-10`}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Platform</label>
              <div className="grid grid-cols-3 gap-2">
                {(["tiktok", "facebook", "youtube"] as Platform[]).map((p) => (
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
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>Back</button>
            <button
              onClick={() => setStep(2)}
              disabled={!url}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>Configure alert thresholds</p>
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-hover)" }}>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>Alert on new posts</span>
              </div>
              <button
                onClick={() => setNewPost(!newPost)}
                className="w-9 h-5 rounded-full transition-colors relative"
                style={{ background: newPost ? "var(--accent)" : "var(--bg-inset)" }}
              >
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: newPost ? 18 : 2 }} />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Negative sentiment threshold (%)
              </label>
              <input
                type="number"
                value={sentimentThreshold}
                onChange={(e) => setSentimentThreshold(e.target.value)}
                className={inputClass}
                style={inputStyle}
                min={0}
                max={100}
              />
              <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                Alert when negative comments exceed this percentage
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Engagement threshold
              </label>
              <input
                type="number"
                value={engagementThreshold}
                onChange={(e) => setEngagementThreshold(e.target.value)}
                className={inputClass}
                style={inputStyle}
                min={0}
              />
              <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                Alert when likes/reactions exceed this number
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>Back</button>
            <button
              onClick={() => {
                setCreating(true);
                setTimeout(() => { setCreating(false); onClose(); reset(); }, 1500);
              }}
              disabled={creating}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}
            >
              {creating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Stalker"
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
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
  const [mode, setMode] = useState<"existing" | "competitor">("existing");
  const [competitorUrls, setCompetitorUrls] = useState("");
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(["tiktok", "facebook", "youtube"]));
  const [maxPosts, setMaxPosts] = useState<number>(50);
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
      // The existing-data branch isn't wired yet — just close.
      onClose();
      return;
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
            { id: "competitor" as const, label: "Competitor Analysis", desc: "Crawl & analyze new URLs", icon: <Globe className="w-5 h-5" /> },
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
                Maximum posts per competitor
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
                Between 1 and 500. Default 50.
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

        {generate.isError && (
          <div className="mt-4 p-3 rounded-xl text-[12px]" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
            Failed to start report. Please try again.
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generate.isPending || !canGenerate}
          className="w-full mt-6 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--accent)" }}
          onMouseEnter={(e) => { if (!generate.isPending && canGenerate) e.currentTarget.style.background = "var(--accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
        >
          {generate.isPending ? (
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
