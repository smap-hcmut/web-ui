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
 * Competitor Share of Voice data with multi-metric support
 */
export interface CompetitorData {
  brand: string
  sov: number // Primary SOV (defaults to weighted)
  sovVolume: number // Volume-based SOV percentage
  sovEngagement: number // Engagement-based SOV percentage
  sovWeighted: number // Weighted SOV percentage
  postCount: number // Raw post count
  totalEngagement: number // Sum of all engagement (likes + comments + shares)
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
  permalink?: string
  is_viral: boolean
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
 * Platform distribution data
 */
export interface PlatformData {
  name: string
  value: number
  percentage: number
  change: number
  color: string
  posts?: number
  engagement?: number
  [key: string]: string | number | undefined
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
 * Crisis/Critical event data point for unified chart
 */
export interface CrisisDataPoint {
  id: string
  timestamp: number
  date: string
  impact_score: number
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  platform: string
  mentions: number
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
  platformDistribution: PlatformData[]
  crisisData: CrisisDataPoint[]
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
 * Normalize impact score to 0-100 range
 * Handles API responses that may return impact_score in different formats:
 * - 0-1 decimal (e.g., 0.094) → multiply by 100
 * - 1-100 values (e.g., 1.351, 10.01, 85) → already in correct range
 * - >100 values (e.g., 10000) → divide by 100 until in range
 *
 * @param score - Raw impact score from API
 * @returns Normalized score in 0-100 range (not rounded, preserves decimals)
 */
function normalizeImpactScore(score: number | null | undefined): number {
  if (score === null || score === undefined || isNaN(score)) {
    return 0
  }

  let normalized = score

  // If value is in 0-1 range (decimal), scale up to 0-100
  if (normalized >= 0 && normalized <= 1) {
    normalized = normalized * 100
  }
  // If value is > 100, scale down by dividing by 100 until in 0-100 range
  else if (normalized > 100) {
    while (normalized > 100) {
      normalized = normalized / 100
    }
    // After scaling down, if now in 0-1 range, scale back up
    if (normalized >= 0 && normalized <= 1) {
      normalized = normalized * 100
    }
  }
  // Values between 1-100 are already in correct range, no change needed

  // Clamp to 0-100 range (do NOT round, preserve decimals for later rounding)
  return Math.max(0, Math.min(100, normalized))
}

/**
 * Calculate risk level based on impact score
 * Used as fallback when API doesn't provide risk_level
 *
 * @param impactScore - Normalized impact score (0-100)
 * @returns Risk level
 */
function calculateRiskLevel(impactScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (impactScore >= 80) return 'CRITICAL'
  if (impactScore >= 60) return 'HIGH'
  if (impactScore >= 40) return 'MEDIUM'
  return 'LOW'
}

/**
 * Validate and sanitize risk level from API
 *
 * @param riskLevel - Risk level from API
 * @param impactScore - Normalized impact score for fallback calculation
 * @returns Valid risk level
 */
function validateRiskLevel(
  riskLevel: string | null | undefined,
  impactScore: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

  if (riskLevel && validRiskLevels.includes(riskLevel)) {
    return riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }

  // Fallback to calculated risk level
  return calculateRiskLevel(impactScore)
}

/**
 * Extract viral posts sorted by impact score
 *
 * Normalizes impact scores to 0-100 range, rounds to 2 decimal places, and returns top 100 by impact
 * Uses risk_level from API with validation
 * Pagination is handled by the component (10 posts per page, max 10 pages)
 */
export function extractViralPosts(posts: DashboardPost[]): ViralPostData[] {
  const viralPosts = posts
    .map((post, index) => {
      // Normalize impact score to 0-100 range
      const normalizedScore = normalizeImpactScore(post.impact_score)

      // Round to 2 decimal places
      const roundedImpactScore = Math.round(normalizedScore * 100) / 100

      // Validate risk level from API - use risk_level field directly
      const validatedRisk = validateRiskLevel(post.risk_level, normalizedScore)

      // Get is_viral directly from API response (boolean field)
      const isViral = post.is_viral === true

      return {
        id: index + 1, // Use index as numeric ID
        title: post.content_text.substring(0, 100) + (post.content_text.length > 100 ? '...' : ''),
        platform: post.platform,
        engagement: (post.like_count || 0) + (post.comment_count || 0),
        reach: post.view_count || 0,
        impact_score: roundedImpactScore,
        risk: validatedRisk,
        virality_index: roundedImpactScore,
        timestamp: new Date(post.published_at).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        permalink: post.permalink || undefined,
        is_viral: isViral,
      }
    })
    .sort((a, b) => b.impact_score - a.impact_score)
    .slice(0, 100) // Max 100 posts (10 pages x 10 posts per page)

  return viralPosts
}

/**
 * Calculate Volume-based Share of Voice
 *
 * Formula: SOV_volume(brand) = (posts_count(brand) / total_posts) × 100%
 *
 * @param brandCounts - Record of brand name to post count
 * @param totalPosts - Total number of posts across all brands
 * @returns Record of brand name to volume SOV percentage
 */
function calculateVolumeSOV(
  brandCounts: Record<string, number>,
  totalPosts: number
): Record<string, number> {
  if (totalPosts === 0) return {}

  const volumeSOV: Record<string, number> = {}
  Object.entries(brandCounts).forEach(([brand, count]) => {
    volumeSOV[brand] = Math.round((count / totalPosts) * 1000) / 10
  })

  return volumeSOV
}

/**
 * Calculate Engagement-based Share of Voice
 *
 * Formula: SOV_engagement(brand) = (total_engagement(brand) / total_engagement_all) × 100%
 * where engagement = like_count + comment_count + share_count
 *
 * @param brandEngagement - Record of brand name to total engagement
 * @param totalEngagement - Total engagement across all brands
 * @returns Record of brand name to engagement SOV percentage
 */
function calculateEngagementSOV(
  brandEngagement: Record<string, number>,
  totalEngagement: number
): Record<string, number> {
  if (totalEngagement === 0) return {}

  const engagementSOV: Record<string, number> = {}
  Object.entries(brandEngagement).forEach(([brand, engagement]) => {
    engagementSOV[brand] = Math.round((engagement / totalEngagement) * 1000) / 10
  })

  return engagementSOV
}

/**
 * Calculate Weighted Share of Voice
 *
 * Formula: SOV_weighted = (w_volume × SOV_volume) + (w_engagement × SOV_engagement)
 * Default weights: 40% volume, 60% engagement
 *
 * @param volumeSOV - Volume-based SOV percentages
 * @param engagementSOV - Engagement-based SOV percentages
 * @param volumeWeight - Weight for volume metric (default: 0.4)
 * @param engagementWeight - Weight for engagement metric (default: 0.6)
 * @returns Record of brand name to weighted SOV percentage
 */
function calculateWeightedSOV(
  volumeSOV: Record<string, number>,
  engagementSOV: Record<string, number>,
  volumeWeight: number = 0.4,
  engagementWeight: number = 0.6
): Record<string, number> {
  const weightedSOV: Record<string, number> = {}

  // Get all brands from both SOV records
  const brands = new Set([...Object.keys(volumeSOV), ...Object.keys(engagementSOV)])

  brands.forEach((brand) => {
    const volSOV = volumeSOV[brand] || 0
    const engSOV = engagementSOV[brand] || 0

    // If engagement data is missing for all brands, fall back to volume
    const hasEngagementData = Object.keys(engagementSOV).length > 0

    if (!hasEngagementData) {
      weightedSOV[brand] = volSOV
    } else {
      weightedSOV[brand] = Math.round((volumeWeight * volSOV + engagementWeight * engSOV) * 10) / 10
    }
  })

  return weightedSOV
}

/**
 * Aggregate competitor Share of Voice with multi-metric support
 *
 * Calculates three types of SOV: Volume, Engagement, and Weighted
 * Handles edge cases: zero posts, missing engagement data, single brand
 */
export function aggregateCompetitors(posts: DashboardPost[]): CompetitorData[] {
  // Edge case: empty posts array
  if (posts.length === 0) {
    return []
  }

  const brandCounts: Record<string, number> = {}
  const brandEngagement: Record<string, number> = {}

  // Aggregate post counts and engagement per brand
  posts.forEach((post) => {
    const brand = post.brand_name
    brandCounts[brand] = (brandCounts[brand] || 0) + 1

    // Calculate engagement: likes + comments + shares
    // Handle null/undefined values by treating as 0
    const likes = Math.max(0, post.like_count || 0)
    const comments = Math.max(0, post.comment_count || 0)
    const shares = 0 // share_count not in current DashboardPost type, reserve for future
    const engagement = likes + comments + shares

    brandEngagement[brand] = (brandEngagement[brand] || 0) + engagement
  })

  const totalPosts = posts.length
  const totalEngagement = Object.values(brandEngagement).reduce((sum, eng) => sum + eng, 0)

  // Calculate all three SOV metrics
  const volumeSOV = calculateVolumeSOV(brandCounts, totalPosts)
  const engagementSOV = calculateEngagementSOV(brandEngagement, totalEngagement)
  const weightedSOV = calculateWeightedSOV(volumeSOV, engagementSOV)

  // Modern, professional color palette matching the amber/gold theme
  const colors = ['#d97706', '#92400e', '#78350f', '#451a03', '#fbbf24']

  // Build competitor data with all metrics
  const competitors: CompetitorData[] = Object.entries(brandCounts)
    .map(([brand, count], index) => ({
      brand,
      sov: weightedSOV[brand] || 0, // Default to weighted SOV
      sovVolume: volumeSOV[brand] || 0,
      sovEngagement: engagementSOV[brand] || 0,
      sovWeighted: weightedSOV[brand] || 0,
      postCount: count,
      totalEngagement: brandEngagement[brand] || 0,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.sov - a.sov) // Sort by primary SOV (weighted)

  return competitors
}

/**
 * Build platform distribution from posts
 *
 * Aggregates posts by platform with engagement metrics
 */
export function buildPlatformDistribution(posts: DashboardPost[]): PlatformData[] {
  if (posts.length === 0) {
    return []
  }

  const platformMap: Record<
    string,
    {
      count: number
      engagement: number
      views: number
    }
  > = {}

  // Aggregate posts by platform
  posts.forEach((post) => {
    const platform = post.platform
    if (!platformMap[platform]) {
      platformMap[platform] = {
        count: 0,
        engagement: 0,
        views: 0,
      }
    }

    platformMap[platform].count++
    platformMap[platform].engagement += (post.like_count || 0) + (post.comment_count || 0)
    platformMap[platform].views += post.view_count || 0
  })

  const totalMentions = posts.length

  // Platform colors - adjusted for better harmony with amber theme
  const platformColors: Record<string, string> = {
    facebook: '#4267B2',
    tiktok: '#1a1a1a',
    youtube: '#CD201F',
    instagram: '#C13584',
    twitter: '#1DA1F2',
  }

  // Build platform data
  const platforms: PlatformData[] = Object.entries(platformMap).map(([platform, data]) => {
    const percentage = (data.count / totalMentions) * 100
    const avgEngagement = data.views > 0 ? (data.engagement / data.views) * 100 : 0

    return {
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: data.count,
      percentage: Math.round(percentage * 10) / 10,
      change: Math.random() * 20 - 10, // Mock change data (replace with real calculation later)
      color: platformColors[platform.toLowerCase()] || '#6b7280',
      posts: data.count,
      engagement: Math.round(avgEngagement * 10) / 10,
    }
  })

  // Sort by value descending
  return platforms.sort((a, b) => b.value - a.value)
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
      color: '#fbbf24',
      icon: Users,
    },
    {
      stage: 'Interest (1-3 days)',
      count: interestCount,
      percentage: total > 0 ? (interestCount / total) * 100 : 0,
      change: interestCount > awarenessCount ? 8.3 : -5.2,
      color: '#f59e0b',
      icon: MessageCircle,
    },
    {
      stage: 'Consideration (3-7 days)',
      count: considerationCount,
      percentage: total > 0 ? (considerationCount / total) * 100 : 0,
      change: considerationCount > interestCount ? 5.0 : -2.1,
      color: '#d97706',
      icon: ShoppingCart,
    },
    {
      stage: 'Intent (7-14 days)',
      count: intentCount,
      percentage: total > 0 ? (intentCount / total) * 100 : 0,
      change: intentCount > considerationCount ? 3.7 : -1.5,
      color: '#92400e',
      icon: DollarSign,
    },
    {
      stage: 'Purchase (14+ days)',
      count: purchaseCount,
      percentage: total > 0 ? (purchaseCount / total) * 100 : 0,
      change: purchaseCount > intentCount ? 2.2 : -0.8,
      color: '#78350f',
      icon: DollarSign,
    },
  ]
}

/**
 * Build time-series trend data with continuous date range
 *
 * Aggregates posts by date for trend charts and fills gaps with zero values
 * to ensure continuous timeline visualization
 */
function buildTrends(posts: DashboardPost[]): TrendData[] {
  if (posts.length === 0) {
    return []
  }

  // Aggregate posts by date
  const trendMap: Record<string, { count: number; sentimentSum: number }> = {}

  posts.forEach((post) => {
    const date = new Date(post.published_at).toISOString().split('T')[0]
    if (!trendMap[date]) {
      trendMap[date] = { count: 0, sentimentSum: 0 }
    }
    trendMap[date].count++
    trendMap[date].sentimentSum += post.overall_sentiment_score
  })

  // Find date range
  const dates = Object.keys(trendMap).sort()
  if (dates.length === 0) {
    return []
  }

  const minDate = new Date(dates[0])
  const maxDate = new Date(dates[dates.length - 1])

  // Fill gaps: create entry for each day in range
  const result: TrendData[] = []
  const currentDate = new Date(minDate)

  while (currentDate <= maxDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const data = trendMap[dateStr]

    result.push({
      date: dateStr,
      mentions: data ? data.count : 0,
      sentiment: data ? data.sentimentSum / data.count : 0,
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
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
      { name: 'Positive', value: 0, color: '#16a34a' },
      { name: 'Neutral', value: 0, color: '#64748b' },
      { name: 'Negative', value: 0, color: '#dc2626' },
    ]
  }

  return [
    {
      name: 'Positive',
      value: Math.round((summary.sentiment_distribution.POSITIVE / total) * 100),
      color: '#16a34a',
    },
    {
      name: 'Neutral',
      value: Math.round((summary.sentiment_distribution.NEUTRAL / total) * 100),
      color: '#64748b',
    },
    {
      name: 'Negative',
      value: Math.round((summary.sentiment_distribution.NEGATIVE / total) * 100),
      color: '#dc2626',
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
      color: '#16a34a',
    },
    {
      name: 'Neutral',
      value: Math.round((sentimentCounts.NEUTRAL / total) * 100),
      color: '#64748b',
    },
    {
      name: 'Negative',
      value: Math.round((sentimentCounts.NEGATIVE / total) * 100),
      color: '#dc2626',
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
 * Extract crisis/critical events from posts
 *
 * Filters posts with HIGH or CRITICAL risk_level for display on unified chart
 * Returns data formatted for the UnifiedChart critical events overlay
 *
 * @param posts - Array of DashboardPost from API
 * @returns Array of CrisisDataPoint for chart overlay
 */
export function extractCrisisData(posts: DashboardPost[]): CrisisDataPoint[] {
  return posts
    .filter((post) => {
      const riskLevel = post.risk_level?.toUpperCase()
      return riskLevel === 'HIGH' || riskLevel === 'CRITICAL'
    })
    .map((post, index) => {
      const publishedDate = new Date(post.published_at)
      const normalizedScore = normalizeImpactScore(post.impact_score)
      const validatedRisk = validateRiskLevel(post.risk_level, normalizedScore)

      return {
        id: `crisis-${index}-${post.published_at}`,
        timestamp: publishedDate.getTime(),
        date: publishedDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        impact_score: Math.round(normalizedScore * 100) / 100,
        risk: validatedRisk,
        title: post.content_text.substring(0, 80) + (post.content_text.length > 80 ? '...' : ''),
        platform: post.platform,
        mentions: 1, // Each post counts as 1 mention
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
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
    platformDistribution: buildPlatformDistribution(posts),
    crisisData: extractCrisisData(posts),
  }
}
