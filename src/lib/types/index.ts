/**
 * Shared UI Types
 *
 * Canonical type definitions used across components.
 * Extracted from the former mock-data files so every consumer
 * imports from a single, mock-free module.
 */

// ─── Platform ─────────────────────────────────────────────────────────────────

export type Platform = 'tiktok' | 'facebook' | 'youtube';

// ─── KPI / Overview ───────────────────────────────────────────────────────────

export interface MetricData {
  label: string;
  value: string;
  change: number;
  trend: number[];
  icon: string;
}

// ─── Platform breakdown ───────────────────────────────────────────────────────

export interface PlatformData {
  platform: Platform;
  name: string;
  mentions: number;
  mentionsChange: number;
  engagement: string;
  engagementChange: number;
  followers: string;
  followersChange: number;
  sentiment: number;
  trend: number[];
  status: 'active' | 'inactive';
}

// ─── Trending keywords ────────────────────────────────────────────────────────

export interface TrendItem {
  rank: number;
  keyword: string;
  volume: number;
  change: number;
  platforms: Platform[];
}

// ─── Activity / post feed ─────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  platform: Platform;
  author: string;
  content: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: number;
}

// ─── Post detail (expanded view) ──────────────────────────────────────────────

export interface PostComment {
  id: string;
  author: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  likes: number;
  time: string;
  replies?: PostComment[];
}

export interface PostDetail {
  id: string;
  platform: Platform;
  author: string;
  authorAvatar?: string;
  content: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  engagementTrend: number[];
  topComments: PostComment[];
  keywords: string[];
  url: string;
}

// ─── Stalker (post/profile monitoring) ────────────────────────────────────────

export interface StalkerAlert {
  id: string;
  type: 'new_post' | 'comment_spike' | 'engagement_threshold' | 'sentiment_shift';
  title: string;
  description: string;
  time: string;
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
}

export interface StalkerTarget {
  id: string;
  type: 'profile' | 'post';
  platform: Platform;
  name: string;
  url: string;
  status: 'active' | 'paused';
  lastChecked: string;
  totalAlerts: number;
  thresholds: {
    newPost: boolean;
    commentSentiment: number;
    engagementThreshold: number;
  };
  alerts: StalkerAlert[];
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportStatus = 'ready' | 'generating' | 'failed' | 'cancelled';

export interface ReportItem {
  id: string;
  title: string;
  type: 'campaign' | 'project' | 'competitor';
  scope: string;
  generatedAt: string;
  pages: number;
  format: 'PDF' | 'CSV';
  status: ReportStatus;
  sections: string[];

  // Competitor-specific
  campaignId?: string;
  competitorUrls?: string[];
  platforms?: Platform[];
  maxPostsPerCompetitor?: number;
  process?: CrawlerProcess;      // present while generating / after failure / cancelled
  totals?: { posts: number; comments: number };
  errorMessage?: string;
}

export type CrawlerStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

export interface CrawlerCompetitorProgress {
  url: string;
  platform: Platform;
  crawled: number;
  target: number;
  status: CrawlerStatus;
}

export interface CrawlerProcess {
  processId: string;
  status: CrawlerStatus;
  startedAt: string;
  finishedAt?: string;
  progress: {
    crawled: number;
    target: number;
    perCompetitor: CrawlerCompetitorProgress[];
  };
  errorMessage?: string;
}

export interface ReportPostReactions {
  like?: number;
  love?: number;
  haha?: number;
  wow?: number;
  sad?: number;
  angry?: number;
}

export interface ReportPostSentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ReportPost {
  id: string;
  reportId: string;
  competitorUrl: string;
  platform: Platform;
  author: string;
  authorAvatar?: string;
  content: string;
  postedAt: string;
  url: string;
  engagement: { likes: number; comments: number; shares: number; views: number };
  sentiment: 'positive' | 'negative' | 'neutral';
  commentCount: number;

  // Optional analytics (render only if BE returns them)
  reactions?: ReportPostReactions;
  sentimentBreakdown?: ReportPostSentimentBreakdown;
  topKeywords?: string[];
}

export interface ReportComment extends PostComment {
  postId: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Campaign assistant ───────────────────────────────────────────────────────

export interface SuggestedQuestion {
  id: string;
  text: string;
  icon: string;
}

export interface BotResponseBlock {
  type: 'text' | 'bullets' | 'stats';
  content?: string;
  items?: string[];
  stats?: { label: string; value: string; change?: number }[];
}

// ─── Crisis config (project-level) ────────────────────────────────────────────

export interface SentimentRule {
  type: string;
  threshold_percent: number;
  negative_threshold_percent: number;
  critical_aspects: string[];
}

export interface VolumeRule {
  baseline: string;
  comparison_window_hours: number;
  level: string;
  threshold_percent_growth: number;
}

export interface KeywordGroup {
  name: string;
  keywords: string[];
  weight: number;
}

export interface InfluencerRule {
  type: string;
  min_followers: number;
  min_comments: number;
  min_shares: number;
  required_sentiment: string;
}

export interface CrisisConfig {
  status: 'ACTIVE' | 'INACTIVE';
  sentiment_trigger: {
    enabled: boolean;
    min_sample_size: number;
    rules: SentimentRule[];
  };
  volume_trigger: {
    enabled: boolean;
    metric: string;
    rules: VolumeRule[];
  };
  keywords_trigger: {
    enabled: boolean;
    logic: 'AND' | 'OR';
    groups: KeywordGroup[];
  };
  influencer_trigger: {
    enabled: boolean;
    logic: 'AND' | 'OR';
    rules: InfluencerRule[];
  };
  cron_schedule?: string;
}

// ─── Project (used in ScopeFilter, ProjectCardsRow, settings) ─────────────────

export interface Keyword {
  id: string;
  text: string;
  platforms: Platform[];
  volume: number;
  sentiment: number;
}

export interface Project {
  id: string;
  name: string;
  domain_type_code?: string;
  keywords: Keyword[];
  platforms?: Platform[];
  status?: 'active' | 'paused' | 'pending';
  crisis_config?: CrisisConfig;
}
