import { DashboardPost } from '@/lib/api/services/dashboard.service'

/**
 * Trend Topic extracted from posts
 */
export interface TrendTopic {
  id: string
  name: string
  volume: number
  delta: number
  confidence: number
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  platforms: string[]
  keywords: string[]
  samplePosts: TrendPost[]
  createdAt: Date
  // Additional metrics from real data
  avgEngagement: number
  viralCount: number
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

/**
 * Trend Post from API data
 */
export interface TrendPost {
  id: string
  title: string
  content: string
  canonicalUrl: string
  platform: string
  author: string
  publishedAt: Date
  metrics: {
    likes: number
    shares: number
    comments: number
    views: number
  }
  sentiment: {
    label: 'positive' | 'neutral' | 'negative'
    score: number
  }
  // Additional fields from API
  impactScore: number
  riskLevel: string
  isViral: boolean
  isKol: boolean
}

/**
 * Trend Hashtag extracted from content
 */
export interface TrendHashtag {
  id: string
  hashtag: string
  volume: number
  engagementRate: number
  samplePosts: TrendPost[]  // Changed from string[] to TrendPost[]
  platforms: string[]
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
}

/**
 * Extract hashtags from content text
 */
function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g
  const matches = content.match(hashtagRegex) || []
  return matches.map(tag => tag.toLowerCase())
}

/**
 * Convert sentiment string to label
 */
function getSentimentLabel(sentiment: string): 'positive' | 'neutral' | 'negative' {
  switch (sentiment?.toUpperCase()) {
    case 'POSITIVE': return 'positive'
    case 'NEGATIVE': return 'negative'
    default: return 'neutral'
  }
}

/**
 * Transform DashboardPost to TrendPost
 */
export function transformToTrendPost(post: DashboardPost): TrendPost {
  return {
    id: post.id?.toString() || `post-${Date.now()}-${Math.random()}`,
    title: post.content_text?.substring(0, 100) || 'Untitled',
    content: post.content_text || '',
    canonicalUrl: post.permalink || '',
    platform: post.platform?.toLowerCase() || 'unknown',
    author: post.author_username || post.author_name || 'Unknown',
    publishedAt: new Date(post.published_at),
    metrics: {
      likes: post.like_count || 0,
      shares: 0, // Not in current API
      comments: post.comment_count || 0,
      views: post.view_count || 0,
    },
    sentiment: {
      label: getSentimentLabel(post.overall_sentiment),
      score: post.overall_sentiment_score || 0,
    },
    impactScore: post.impact_score || 0,
    riskLevel: post.risk_level || 'LOW',
    isViral: post.is_viral || false,
    isKol: post.is_kol || false,
  }
}

/**
 * Transform posts to TrendPost array
 */
export function transformToTrendPosts(posts: DashboardPost[]): TrendPost[] {
  return posts.map(transformToTrendPost)
}


/**
 * Extract and aggregate topics from posts by keyword
 */
export function extractTrendTopics(posts: DashboardPost[]): TrendTopic[] {
  const topicMap = new Map<string, {
    posts: DashboardPost[]
    platforms: Set<string>
    hashtags: Set<string>
  }>()

  // Group posts by keyword
  posts.forEach(post => {
    const keyword = post.keyword?.toLowerCase() || 'general'
    
    if (!topicMap.has(keyword)) {
      topicMap.set(keyword, {
        posts: [],
        platforms: new Set(),
        hashtags: new Set(),
      })
    }

    const topic = topicMap.get(keyword)!
    topic.posts.push(post)
    topic.platforms.add(post.platform?.toLowerCase() || 'unknown')
    
    // Extract hashtags from content
    const hashtags = extractHashtags(post.content_text || '')
    hashtags.forEach(tag => topic.hashtags.add(tag))
  })

  // Transform to TrendTopic array
  const topics: TrendTopic[] = []
  let index = 0

  topicMap.forEach((data, keyword) => {
    const { posts: topicPosts, platforms, hashtags } = data
    
    // Calculate sentiment distribution
    let positive = 0, neutral = 0, negative = 0
    topicPosts.forEach(post => {
      switch (post.overall_sentiment?.toUpperCase()) {
        case 'POSITIVE': positive++; break
        case 'NEGATIVE': negative++; break
        default: neutral++
      }
    })
    const total = topicPosts.length || 1
    
    // Calculate risk distribution
    const riskDist = { low: 0, medium: 0, high: 0, critical: 0 }
    topicPosts.forEach(post => {
      switch (post.risk_level?.toUpperCase()) {
        case 'LOW': riskDist.low++; break
        case 'MEDIUM': riskDist.medium++; break
        case 'HIGH': riskDist.high++; break
        case 'CRITICAL': riskDist.critical++; break
      }
    })

    // Calculate volume (total engagement)
    const volume = topicPosts.reduce((sum, post) => 
      sum + (post.like_count || 0) + (post.comment_count || 0) + (post.view_count || 0), 0
    )

    // Calculate average engagement rate
    const avgEngagement = topicPosts.reduce((sum, post) => {
      const views = post.view_count || 1
      const engagement = (post.like_count || 0) + (post.comment_count || 0)
      return sum + (engagement / views) * 100
    }, 0) / total

    // Calculate confidence (average impact score normalized)
    const avgImpact = topicPosts.reduce((sum, post) => sum + (post.impact_score || 0), 0) / total
    const confidence = Math.min(avgImpact / 100, 1)

    // Count viral posts
    const viralCount = topicPosts.filter(post => post.is_viral).length

    // Calculate delta (mock for now - would need historical data)
    const delta = (Math.random() * 30 - 10) // -10% to +20%

    // Get sample posts (top 5 by engagement)
    const sortedPosts = [...topicPosts].sort((a, b) => {
      const engA = (a.like_count || 0) + (a.comment_count || 0)
      const engB = (b.like_count || 0) + (b.comment_count || 0)
      return engB - engA
    })

    topics.push({
      id: `topic-${index++}`,
      name: formatTopicName(keyword),
      volume,
      delta: Math.round(delta * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      sentiment: {
        positive: Math.round((positive / total) * 100),
        neutral: Math.round((neutral / total) * 100),
        negative: Math.round((negative / total) * 100),
      },
      platforms: Array.from(platforms),
      keywords: Array.from(hashtags).slice(0, 10),
      samplePosts: sortedPosts.slice(0, 5).map(transformToTrendPost),
      createdAt: new Date(sortedPosts[0]?.published_at || Date.now()),
      avgEngagement: Math.round(avgEngagement * 10) / 10,
      viralCount,
      riskDistribution: riskDist,
    })
  })

  // Sort by volume descending
  return topics.sort((a, b) => b.volume - a.volume)
}

/**
 * Format topic name for display
 */
function formatTopicName(keyword: string): string {
  return keyword
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Extract and aggregate hashtags from posts
 */
export function extractTrendHashtags(posts: DashboardPost[]): TrendHashtag[] {
  const hashtagMap = new Map<string, {
    posts: DashboardPost[]
    platforms: Set<string>
  }>()

  // Extract and group by hashtag
  posts.forEach(post => {
    const hashtags = extractHashtags(post.content_text || '')
    
    hashtags.forEach(hashtag => {
      if (!hashtagMap.has(hashtag)) {
        hashtagMap.set(hashtag, {
          posts: [],
          platforms: new Set(),
        })
      }
      
      const data = hashtagMap.get(hashtag)!
      data.posts.push(post)
      data.platforms.add(post.platform?.toLowerCase() || 'unknown')
    })
  })

  // Transform to TrendHashtag array
  const hashtags: TrendHashtag[] = []
  let index = 0

  hashtagMap.forEach((data, hashtag) => {
    const { posts: hashtagPosts, platforms } = data
    
    // Calculate volume
    const volume = hashtagPosts.reduce((sum, post) => 
      sum + (post.like_count || 0) + (post.comment_count || 0), 0
    )

    // Calculate engagement rate
    const totalViews = hashtagPosts.reduce((sum, post) => sum + (post.view_count || 1), 0)
    const totalEngagement = hashtagPosts.reduce((sum, post) => 
      sum + (post.like_count || 0) + (post.comment_count || 0), 0
    )
    const engagementRate = (totalEngagement / totalViews) * 100

    // Calculate sentiment
    let positive = 0, neutral = 0, negative = 0
    hashtagPosts.forEach(post => {
      switch (post.overall_sentiment?.toUpperCase()) {
        case 'POSITIVE': positive++; break
        case 'NEGATIVE': negative++; break
        default: neutral++
      }
    })
    const total = hashtagPosts.length || 1

    hashtags.push({
      id: `hashtag-${index++}`,
      hashtag,
      volume,
      engagementRate: Math.round(engagementRate * 100) / 100,
      samplePosts: hashtagPosts.slice(0, 5).map(transformToTrendPost),  // Transform to TrendPost
      platforms: Array.from(platforms),
      sentiment: {
        positive: Math.round((positive / total) * 100),
        neutral: Math.round((neutral / total) * 100),
        negative: Math.round((negative / total) * 100),
      },
    })
  })

  // Sort by volume descending
  return hashtags.sort((a, b) => b.volume - a.volume)
}

/**
 * Calculate trend metrics summary
 */
export interface TrendMetricsSummary {
  totalTopics: number
  totalVolume: number
  avgConfidence: number
  avgSentiment: number
  totalHashtags: number
  avgEngagementRate: number
  viralPostsCount: number
  kolPostsCount: number
  platformDistribution: Record<string, number>
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

export function calculateTrendMetrics(
  posts: DashboardPost[],
  topics: TrendTopic[],
  hashtags: TrendHashtag[]
): TrendMetricsSummary {
  // Platform distribution
  const platformDist: Record<string, number> = {}
  posts.forEach(post => {
    const platform = post.platform?.toLowerCase() || 'unknown'
    platformDist[platform] = (platformDist[platform] || 0) + 1
  })

  // Risk distribution
  const riskDist = { low: 0, medium: 0, high: 0, critical: 0 }
  posts.forEach(post => {
    switch (post.risk_level?.toUpperCase()) {
      case 'LOW': riskDist.low++; break
      case 'MEDIUM': riskDist.medium++; break
      case 'HIGH': riskDist.high++; break
      case 'CRITICAL': riskDist.critical++; break
    }
  })

  // Calculate averages
  const totalVolume = topics.reduce((sum, t) => sum + t.volume, 0)
  const avgConfidence = topics.length > 0
    ? topics.reduce((sum, t) => sum + t.confidence, 0) / topics.length
    : 0
  const avgSentiment = topics.length > 0
    ? topics.reduce((sum, t) => sum + t.sentiment.positive, 0) / topics.length
    : 0
  const avgEngagementRate = hashtags.length > 0
    ? hashtags.reduce((sum, h) => sum + h.engagementRate, 0) / hashtags.length
    : 0

  return {
    totalTopics: topics.length,
    totalVolume,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    avgSentiment: Math.round(avgSentiment),
    totalHashtags: hashtags.length,
    avgEngagementRate: Math.round(avgEngagementRate * 10) / 10,
    viralPostsCount: posts.filter(p => p.is_viral).length,
    kolPostsCount: posts.filter(p => p.is_kol).length,
    platformDistribution: platformDist,
    riskDistribution: riskDist,
  }
}
