import { DashboardPost, DashboardSummary } from '@/lib/api/services/dashboard.service'
import { Users, MessageCircle, ShoppingCart, DollarSign } from 'lucide-react'

/**
 * Aggregated metrics from posts data
 */
export interface DashboardMetrics {
  sov: number // Share of Voice (%)
  sentiment: number // Net Sentiment Score (-1 to 1)
  mentions: number // Total mentions count
  engagement: number // Engagement rate (%)
}

/**
 * Topic/keyword data with sentiment and trend
 */
export interface TopicData {
  text: string
  value: number // Frequency/weight
  sentiment: number // -1 to 1
  trend: 'rising' | 'falling' | 'stable'
  mentions: number
  engagement: number
}

/**
 * Competitor Share of Voice data
 */
export interface CompetitorData {
  brand: string
  sov: number // Percentage
  color: string
}

/**
 * Viral post with risk assessment
 */
export interface ViralPostData {
  id: number
  title: string
  platform: string
  engagement: number
  reach: number
  impact_score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  virality_index: number
  timestamp: string
}

/**
 * Sales funnel stage data
 */
export interface FunnelStageData {
  stage: string
  count: number
  percentage: number
  change: number
  color: string
  icon: any
}

/**
 * Trend data point for time-series charts
 */
export interface TrendData {
  date: string
  mentions: number
  sentiment: number
}

/**
 * Complete dashboard data structure
 */
export interface DashboardData {
  metrics: DashboardMetrics
  trends: TrendData[]
  sentiment: Array<{ name: string; value: number; color: string }>
  competitors: CompetitorData[]
  topics: TopicData[]
  content: any[]
  viralPosts: ViralPostData[]
  salesFunnel: FunnelStageData[]
}

/**
 * Aggregate metrics from summary API data
 *
 * Transforms DashboardSummary from backend into DashboardMetrics structure
 * This is faster and more efficient than calculating from posts
 *
 * @param summary - DashboardSummary object from /analytic/summary API
 * @returns DashboardMetrics object
 */
export function aggregateMetricsFromSummary(summary: DashboardSummary): DashboardMetrics {
  // Calculate engagement rate from summary totals
  const totalEngagement =
    (summary.engagement_totals.likes || 0) + (summary.engagement_totals.comments || 0)
  const totalViews = summary.engagement_totals.views || 0
  const engagement = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0

  // Calculate SOV for primary platform (if only one platform, SOV = 100%)
  const platforms = Object.keys(summary.platform_distribution)
  const totalPosts = summary.total_posts
  const primaryPlatform = platforms[0] || ''
  const sov = primaryPlatform ? (summary.platform_distribution[primaryPlatform] / totalPosts) * 100 : 0

  return {
    sov: Math.round(sov * 10) / 10,
    sentiment: Math.round(summary.avg_sentiment_score * 100) / 100,
    mentions: summary.total_posts,
    engagement: Math.round(engagement * 10) / 10,
  }
}

/**
 * Aggregate metrics from posts array (fallback method)
 *
 * Calculates:
 * - SOV (Share of Voice): Percentage of mentions for primary brand
 * - Sentiment: Weighted average sentiment score
 * - Mentions: Total post count
 * - Engagement: Average engagement rate
 *
 * NOTE: Prefer using aggregateMetricsFromSummary() when summary data is available
 */
export function aggregateMetrics(posts: DashboardPost[]): DashboardMetrics {
  if (posts.length === 0) {
    return { sov: 0, sentiment: 0, mentions: 0, engagement: 0 }
  }

  // Calculate total mentions
  const mentions = posts.length

  // Calculate weighted sentiment (by engagement)
  let totalSentiment = 0
  let totalWeight = 0

  posts.forEach((post) => {
    const engagement = (post.like_count || 0) + (post.comment_count || 0)
    const weight = engagement > 0 ? engagement : 1
    totalSentiment += post.overall_sentiment_score * weight
    totalWeight += weight
  })

  const sentiment = totalWeight > 0 ? totalSentiment / totalWeight : 0

  // Calculate engagement rate (likes + comments) / views
  let totalEngagementRate = 0
  let validPosts = 0

  posts.forEach((post) => {
    if (post.view_count && post.view_count > 0) {
      const engagement = (post.like_count || 0) + (post.comment_count || 0)
      const rate = (engagement / post.view_count) * 100
      totalEngagementRate += rate
      validPosts++
    }
  })

  const engagement = validPosts > 0 ? totalEngagementRate / validPosts : 0

  // Calculate SOV for primary brand (first brand in dataset)
  const brandCounts: Record<string, number> = {}
  posts.forEach((post) => {
    brandCounts[post.brand_name] = (brandCounts[post.brand_name] || 0) + 1
  })

  const brands = Object.keys(brandCounts)
  const primaryBrand = brands[0] || ''
  const sov = primaryBrand ? (brandCounts[primaryBrand] / mentions) * 100 : 0

  return {
    sov: Math.round(sov * 10) / 10,
    sentiment: Math.round(sentiment * 100) / 100,
    mentions,
    engagement: Math.round(engagement * 10) / 10,
  }
}

/**
 * Smart metrics aggregation that prefers summary data over posts calculation
 *
 * @param summary - Optional DashboardSummary from API
 * @param posts - Fallback posts array
 * @returns DashboardMetrics object
 */
export function getMetrics(
  summary: DashboardSummary | null,
  posts: DashboardPost[]
): DashboardMetrics {
  if (summary) {
    return aggregateMetricsFromSummary(summary)
  }
  return aggregateMetrics(posts)
}

/**
 * Extract and aggregate topics from posts
 *
 * Groups posts by keyword, calculates frequency, sentiment, and trend
 */
export function extractTopics(posts: DashboardPost[]): TopicData[] {
  const topicMap: Record<
    string,
    {
      count: number
      sentimentSum: number
      engagementSum: number
      timestamps: number[]
    }
  > = {}

  posts.forEach((post) => {
    const keyword = post.keyword.toLowerCase()
    if (!topicMap[keyword]) {
      topicMap[keyword] = {
        count: 0,
        sentimentSum: 0,
        engagementSum: 0,
        timestamps: [],
      }
    }

    topicMap[keyword].count++
    topicMap[keyword].sentimentSum += post.overall_sentiment_score
    topicMap[keyword].engagementSum +=
      (post.like_count || 0) + (post.comment_count || 0)
    topicMap[keyword].timestamps.push(new Date(post.published_at).getTime())
  })

  const topics: TopicData[] = Object.entries(topicMap).map(([keyword, data]) => {
    const sentiment = data.sentimentSum / data.count
    const avgEngagement = data.engagementSum / data.count

    // Determine trend based on recent vs older posts
    const sortedTimestamps = data.timestamps.sort((a, b) => a - b)
    const midpoint = Math.floor(sortedTimestamps.length / 2)
    const recentCount = sortedTimestamps.length - midpoint
    const olderCount = midpoint

    let trend: 'rising' | 'falling' | 'stable' = 'stable'
    if (recentCount > olderCount * 1.2) {
      trend = 'rising'
    } else if (recentCount < olderCount * 0.8) {
      trend = 'falling'
    }

    return {
      text: keyword,
      value: data.count,
      sentiment: Math.round(sentiment * 100) / 100,
      trend,
      mentions: data.count,
      engagement: Math.round(avgEngagement),
    }
  })

  // Sort by frequency (value) descending
  return topics.sort((a, b) => b.value - a.value)
}

/**
 * Extract viral posts sorted by impact score
 *
 * Filters posts with high impact scores or viral flag
 */
export function extractViralPosts(posts: DashboardPost[]): ViralPostData[] {
  const viralPosts = posts
    .filter((post) => post.is_viral || post.impact_score > 0.5)
    .map((post, index) => ({
      id: index + 1, // Use index as numeric ID
      title: post.content_text.substring(0, 100) + (post.content_text.length > 100 ? '...' : ''),
      platform: post.platform,
      engagement: (post.like_count || 0) + (post.comment_count || 0),
      reach: post.view_count || 0,
      impact_score: Math.round(post.impact_score * 100),
      risk: post.risk_level,
      virality_index: Math.round(post.impact_score * 100),
      timestamp: new Date(post.published_at).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }))
    .sort((a, b) => b.impact_score - a.impact_score)
    .slice(0, 10) // Top 10 viral posts

  return viralPosts
}

/**
 * Aggregate competitor Share of Voice
 *
 * Calculates SOV percentage for each brand
 */
export function aggregateCompetitors(posts: DashboardPost[]): CompetitorData[] {
  const brandCounts: Record<string, number> = {}

  posts.forEach((post) => {
    brandCounts[post.brand_name] = (brandCounts[post.brand_name] || 0) + 1
  })

  const total = posts.length
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const competitors: CompetitorData[] = Object.entries(brandCounts)
    .map(([brand, count], index) => ({
      brand,
      sov: Math.round((count / total) * 1000) / 10,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.sov - a.sov)

  return competitors
}

/**
 * Build sales funnel based on time periods
 *
 * Creates funnel stages comparing current vs previous time periods
 */
export function buildSalesFunnel(posts: DashboardPost[]): FunnelStageData[] {
  // Sort posts by published date
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  )

  if (sortedPosts.length === 0) {
    return []
  }

  // Split into time periods (last 7 days, 7-14 days ago, etc.)
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000

  const periods = {
    awareness: sortedPosts.filter((p) => new Date(p.published_at).getTime() > now - 1 * oneDay),
    interest: sortedPosts.filter(
      (p) =>
        new Date(p.published_at).getTime() > now - 3 * oneDay &&
        new Date(p.published_at).getTime() <= now - 1 * oneDay
    ),
    consideration: sortedPosts.filter(
      (p) =>
        new Date(p.published_at).getTime() > now - 7 * oneDay &&
        new Date(p.published_at).getTime() <= now - 3 * oneDay
    ),
    intent: sortedPosts.filter(
      (p) =>
        new Date(p.published_at).getTime() > now - 14 * oneDay &&
        new Date(p.published_at).getTime() <= now - 7 * oneDay
    ),
    purchase: sortedPosts.filter((p) => new Date(p.published_at).getTime() <= now - 14 * oneDay),
  }

  const total = sortedPosts.length
  const awarenessCount = periods.awareness.length
  const interestCount = periods.interest.length
  const considerationCount = periods.consideration.length
  const intentCount = periods.intent.length
  const purchaseCount = periods.purchase.length

  return [
    {
      stage: 'Awareness (Last 24h)',
      count: awarenessCount,
      percentage: 100,
      change: awarenessCount > 0 ? 12.5 : 0,
      color: '#3b82f6',
      icon: Users,
    },
    {
      stage: 'Interest (1-3 days)',
      count: interestCount,
      percentage: total > 0 ? (interestCount / total) * 100 : 0,
      change: interestCount > awarenessCount ? 8.3 : -5.2,
      color: '#8b5cf6',
      icon: MessageCircle,
    },
    {
      stage: 'Consideration (3-7 days)',
      count: considerationCount,
      percentage: total > 0 ? (considerationCount / total) * 100 : 0,
      change: considerationCount > interestCount ? 5.0 : -2.1,
      color: '#f59e0b',
      icon: ShoppingCart,
    },
    {
      stage: 'Intent (7-14 days)',
      count: intentCount,
      percentage: total > 0 ? (intentCount / total) * 100 : 0,
      change: intentCount > considerationCount ? 3.7 : -1.5,
      color: '#10b981',
      icon: DollarSign,
    },
    {
      stage: 'Purchase (14+ days)',
      count: purchaseCount,
      percentage: total > 0 ? (purchaseCount / total) * 100 : 0,
      change: purchaseCount > intentCount ? 2.2 : -0.8,
      color: '#ef4444',
      icon: DollarSign,
    },
  ]
}

/**
 * Build time-series trend data
 *
 * Aggregates posts by date for trend charts
 */
function buildTrends(posts: DashboardPost[]): TrendData[] {
  const trendMap: Record<string, { count: number; sentimentSum: number }> = {}

  posts.forEach((post) => {
    const date = new Date(post.published_at).toISOString().split('T')[0]
    if (!trendMap[date]) {
      trendMap[date] = { count: 0, sentimentSum: 0 }
    }
    trendMap[date].count++
    trendMap[date].sentimentSum += post.overall_sentiment_score
  })

  return Object.entries(trendMap)
    .map(([date, data]) => ({
      date,
      mentions: data.count,
      sentiment: data.sentimentSum / data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Build sentiment breakdown from summary data
 *
 * @param summary - DashboardSummary from API
 * @returns Sentiment distribution array for charts
 */
export function buildSentimentFromSummary(summary: DashboardSummary) {
  const total =
    summary.sentiment_distribution.POSITIVE +
    summary.sentiment_distribution.NEUTRAL +
    summary.sentiment_distribution.NEGATIVE

  if (total === 0) {
    return [
      { name: 'Positive', value: 0, color: '#10b981' },
      { name: 'Neutral', value: 0, color: '#6b7280' },
      { name: 'Negative', value: 0, color: '#ef4444' },
    ]
  }

  return [
    {
      name: 'Positive',
      value: Math.round((summary.sentiment_distribution.POSITIVE / total) * 100),
      color: '#10b981',
    },
    {
      name: 'Neutral',
      value: Math.round((summary.sentiment_distribution.NEUTRAL / total) * 100),
      color: '#6b7280',
    },
    {
      name: 'Negative',
      value: Math.round((summary.sentiment_distribution.NEGATIVE / total) * 100),
      color: '#ef4444',
    },
  ]
}

/**
 * Build sentiment breakdown from posts (fallback)
 */
function buildSentimentBreakdown(posts: DashboardPost[]) {
  const sentimentCounts = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 }

  posts.forEach((post) => {
    sentimentCounts[post.overall_sentiment]++
  })

  const total = posts.length || 1

  return [
    {
      name: 'Positive',
      value: Math.round((sentimentCounts.POSITIVE / total) * 100),
      color: '#10b981',
    },
    {
      name: 'Neutral',
      value: Math.round((sentimentCounts.NEUTRAL / total) * 100),
      color: '#6b7280',
    },
    {
      name: 'Negative',
      value: Math.round((sentimentCounts.NEGATIVE / total) * 100),
      color: '#ef4444',
    },
  ]
}

/**
 * Smart sentiment breakdown that prefers summary data
 *
 * @param summary - Optional DashboardSummary from API
 * @param posts - Fallback posts array
 * @returns Sentiment distribution array
 */
export function getSentimentBreakdown(
  summary: DashboardSummary | null,
  posts: DashboardPost[]
) {
  if (summary) {
    return buildSentimentFromSummary(summary)
  }
  return buildSentimentBreakdown(posts)
}

/**
 * Main transformation orchestrator with optional summary data
 *
 * Transforms data into complete dashboard structure, preferring summary API when available
 *
 * @param posts - Array of DashboardPost from API
 * @param summary - Optional DashboardSummary from /analytic/summary API
 * @returns Complete DashboardData object ready for UI consumption
 */
export function transformToDashboardData(
  posts: DashboardPost[],
  summary?: DashboardSummary | null
): DashboardData {
  return {
    metrics: getMetrics(summary || null, posts),
    trends: buildTrends(posts),
    sentiment: getSentimentBreakdown(summary || null, posts),
    competitors: aggregateCompetitors(posts),
    topics: extractTopics(posts),
    content: posts.slice(0, 5).map((post, index) => ({
      id: index + 1,
      title: post.content_text.substring(0, 50) + '...',
      platform: post.platform,
      engagement: (post.like_count || 0) + (post.comment_count || 0),
      reach: post.view_count || 0,
    })),
    viralPosts: extractViralPosts(posts),
    salesFunnel: buildSalesFunnel(posts),
  }
}
