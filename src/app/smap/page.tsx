"use client";

import { useMemo, useState, useEffect } from "react";
import { useNav } from "@/components/NavProvider";
import { ScopeFilter } from "@/components/ScopeFilter";
import { useScope } from "@/components/ScopeProvider";
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
import {
  overviewMetrics,
  platformData,
  recentActivity,
  type Platform,
} from "@/lib/mock-data";
import {
  generatePostDetail,
  mockStalkers,
  mockReports,
  type StalkerTarget,
  type StalkerAlert,
  type PostDetail,
  type ReportItem,
} from "@/lib/mock-posts";
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
      className={`rounded-2xl p-5 ${className}`}
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
    <div className="mb-3">
      <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
        {children}
      </h2>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
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
  const { scopedKeywords } = useScope();

  const scopedTrending = scopedKeywords
    .slice()
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 7)
    .map((k) => ({ label: k.text, value: k.volume }));

  const scopedSentiment = scopedKeywords.length
    ? Math.round(scopedKeywords.reduce((s, k) => s + k.sentiment, 0) / scopedKeywords.length)
    : 0;

  return (
    <>
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {overviewMetrics.map((m) => (
          <GlowCard key={m.label}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                  >
                    {iconMap[m.icon]}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {m.label}
                  </span>
                </div>
                <TrendArrow value={m.change} size="sm" />
              </div>
              <AnimatedCounter
                value={parseMetricValue(m.value)}
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              />
              <div className="mt-3 -mx-1">
                <LineChart
                  series={[{ label: m.label, data: m.trend, color: "var(--accent)" }]}
                  height={48}
                  showLegend={false}
                  compact
                />
              </div>
            </div>
          </GlowCard>
        ))}
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
            <RankList items={scopedTrending} maxItems={7} />
          </Card>

          <Card className="flex items-center justify-center gap-6">
            <SentimentPulse value={scopedSentiment} size={80} />
            <div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Overall Sentiment
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {scopedKeywords.length} keywords tracked<br />
                {new Set(scopedKeywords.flatMap((k) => k.platforms)).size} platforms
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   TAB: Insights (merged Platforms + Insights)
   ════════════════════════════════════════════ */
function InsightsTab() {
  const { scopedKeywords } = useScope();
  const [postDetailId, setPostDetailId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"engagement" | "time">("engagement");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const mentionsSeries = platformData.map((p) => ({
    label: p.name,
    data: p.trend.map((v) => v * (p.mentions / 100)),
    color: chartColors[p.platform],
  }));

  const positive = scopedKeywords.filter((k) => k.sentiment >= 70).length;
  const negative = scopedKeywords.filter((k) => k.sentiment < 40).length;
  const neutral = scopedKeywords.length - positive - negative;
  const sentimentSegments = [
    { label: "Positive", value: positive || 1, color: "var(--success)" },
    { label: "Neutral", value: neutral || 1, color: "var(--warning)" },
    { label: "Negative", value: negative || 1, color: "var(--danger)" },
  ];

  const sorted = scopedKeywords.slice().sort((a, b) => b.volume - a.volume);
  const wordCloudItems = sorted.map((k) => ({
    text: k.text,
    value: k.volume,
    color: "var(--accent)",
    opacity: k.sentiment < 40 ? 0.4 : k.sentiment < 70 ? 0.65 : 1,
  }));

  const barCategories = platformData.map((p) => ({
    label: p.name,
    values: [
      { key: "Engagement", value: parseFloat(p.engagement) * 10, color: "var(--chart-1)", formatted: p.engagement },
      { key: "Sentiment", value: p.sentiment, color: "var(--chart-2)", formatted: `${p.sentiment}%` },
      { key: "Growth", value: p.mentionsChange * 3, color: "var(--chart-3)", formatted: `+${p.mentionsChange}%` },
    ],
  }));

  const radarAxes = [
    { key: "mentions", label: "Mentions" },
    { key: "engagement", label: "Engagement" },
    { key: "sentiment", label: "Sentiment" },
    { key: "growth", label: "Growth" },
    { key: "reach", label: "Reach" },
  ];

  const radarSeries = platformData.map((p) => ({
    label: p.name,
    color: chartColors[p.platform],
    values: {
      mentions: Math.min((p.mentions / 25000) * 100, 100),
      engagement: parseFloat(p.engagement) * 10,
      sentiment: p.sentiment,
      growth: Math.min(p.mentionsChange * 3, 100),
      reach: parseFloat(p.followers) * 0.5,
    },
  }));

  // Sentiment timeline per platform (last 12 months)
  const sentimentTimeline = platformData.map((p) => ({
    label: p.name,
    data: months.map((_, i) => Math.round(p.sentiment + (Math.sin(i * 0.7 + platformData.indexOf(p)) * 15) + (Math.random() * 8 - 4))),
    color: chartColors[p.platform],
  }));

  // Funnel-like engagement data
  const engagementFunnel = [
    { label: "Views", value: 12800000, pct: 100 },
    { label: "Likes", value: 7300000, pct: 57 },
    { label: "Comments", value: 876000, pct: 6.8 },
    { label: "Shares", value: 365000, pct: 2.9 },
  ];

  // Filter + sort posts
  const filteredPosts = useMemo(() => {
    let posts = [...recentActivity];
    if (platformFilter !== "all") posts = posts.filter((p) => p.platform === platformFilter);
    if (sentimentFilter !== "all") posts = posts.filter((p) => p.sentiment === sentimentFilter);
    if (sortBy === "engagement") posts.sort((a, b) => b.engagement - a.engagement);
    // time sort = default order
    return posts;
  }, [platformFilter, sentimentFilter, sortBy]);

  // Post detail
  const selectedPost = postDetailId
    ? recentActivity.find((p) => p.id === postDetailId)
    : null;
  const postDetail = selectedPost ? generatePostDetail(selectedPost) : null;

  const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));

  if (loading) return <TabSkeleton rows={3} />;

  return (
    <div className="content-reveal">
      {/* Row 1: Platform overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {platformData.map((p) => (
          <PlatformOverviewCard
            key={p.platform}
            name={p.name}
            platform={p.platform}
            mentions={p.mentions}
            mentionsChange={p.mentionsChange}
            engagement={p.engagement}
            sentiment={p.sentiment}
            status={p.status}
            color={platformColors[p.platform]}
          />
        ))}
      </div>

      {/* Row 2: Mentions trend (compact) + Sentiment donut + Radar */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <Card className="col-span-12 lg:col-span-5">
          <SectionTitle sub="12-month trend">Mentions Over Time</SectionTitle>
          <AreaChart series={mentionsSeries} xLabels={months} height={180} />
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
          <WordCloud words={wordCloudItems} maxWords={15} height={170} />
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle sub="Per-platform trend">Sentiment Timeline</SectionTitle>
          <AreaChart series={sentimentTimeline} xLabels={months} height={170} />
        </Card>
      </div>

      {/* Row 4: Engagement funnel + Trending topics compact */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle sub="Content conversion">Engagement Funnel</SectionTitle>
          <div className="space-y-2.5">
            {engagementFunnel.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>{stage.label}</span>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <RankList items={firstHalf.map((k) => ({ label: k.text, value: k.volume }))} maxItems={10} />
            <RankList items={secondHalf.map((k) => ({ label: k.text, value: k.volume }))} maxItems={10} startRank={firstHalf.length + 1} />
          </div>
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
                  className="px-2 py-1 rounded-md text-[10px] font-medium capitalize transition-all"
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
                  className="px-2 py-1 rounded-md text-[10px] font-medium capitalize transition-all"
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
              style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
            >
              <ArrowUpDown className="w-3 h-3" />
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
                  platform={post.platform}
                  sentiment={post.sentiment}
                  engagement={post.engagement}
                  time={post.time}
                />
              </button>
            ))}
          </div>
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

  // Reset page & simulate loading when post changes
  useEffect(() => {
    if (post) {
      setCommentPage(0);
      setDetailLoading(true);
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
        {post.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.keywords.map((kw) => (
              <span
                key={kw}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
              >
                {kw}
              </span>
            ))}
          </div>
        )}

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
  const [stalkers] = useState<StalkerTarget[]>(mockStalkers);
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
  const [reports] = useState<ReportItem[]>(mockReports);
  const [showGenerate, setShowGenerate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <ListSkeleton count={4} />;

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
          {reports.map((report) => (
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
                        {report.generatedAt}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                        · {report.pages} pages · {report.format}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                      Scope: {report.scope}
                    </p>
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
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                    style={{ color: "var(--accent)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-subtle)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Send className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              </div>
            </Card>
          ))}
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
      <GenerateReportModal open={showGenerate} onClose={() => setShowGenerate(false)} />
    </div>
  );
}

/* ── Generate Report Modal ── */
function GenerateReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"existing" | "competitor">("existing");
  const [competitorUrls, setCompetitorUrls] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(["Overview", "Sentiment Analysis", "Trends", "Top Posts", "Platform Breakdown"])
  );

  const toggleSection = (s: string) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all duration-200";
  const inputStyle = { background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" };

  const allSectionsExisting = ["Overview", "Sentiment Analysis", "Trends", "Top Posts", "Platform Breakdown", "Recommendations"];
  const allSectionsCompetitor = ["Engagement Analysis", "Content Strategy", "Sentiment Breakdown", "Audience Insights", "Competitive Gap"];

  const sections = mode === "existing" ? allSectionsExisting : allSectionsCompetitor;

  return (
    <Modal open={open} onClose={onClose} title="Generate Report" size="md">
      <div className="max-h-[65vh] overflow-y-auto -mx-6 px-6">
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
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Competitor URLs (one per line)
              </label>
              <textarea
                value={competitorUrls}
                onChange={(e) => setCompetitorUrls(e.target.value)}
                placeholder={"https://tiktok.com/@competitor\nhttps://facebook.com/competitor"}
                rows={3}
                className={`${inputClass} resize-none`}
                style={inputStyle}
              />
              <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                We&apos;ll crawl these URLs to gather data for analysis
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

        {/* Generate button */}
        <button
          onClick={() => {
            setGenerating(true);
            setTimeout(() => { setGenerating(false); onClose(); }, 2000);
          }}
          disabled={generating}
          className="w-full mt-6 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: "var(--accent)" }}
          onMouseEnter={(e) => { if (!generating) e.currentTarget.style.background = "var(--accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
        >
          {generating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
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
      <div className="mb-5 flex justify-center">
        <ScopeFilter />
      </div>

      {activeTab === "MAP" && <MapTab />}
      {activeTab === "Insights" && <InsightsTab />}
      {activeTab === "Stalker" && <StalkerTab />}
      {activeTab === "Reports" && <ReportsTab />}
    </div>
  );
}
