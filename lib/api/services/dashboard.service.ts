import apiClient from '../config'

/**
 * Post data structure from /analytic/posts/all API
 */
export interface DashboardPost {
  id: string
  platform: 'TIKTOK' | 'YOUTUBE' | 'INSTAGRAM' | 'FACEBOOK'
  permalink: string
  content_text: string
  author_name: string
  author_username: string
  author_is_verified: boolean | null
  overall_sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  overall_sentiment_score: number
  primary_intent: string
  impact_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  is_viral: boolean
  is_kol: boolean
  view_count: number | null
  like_count: number | null
  comment_count: number | null
  published_at: string
  analyzed_at: string
  brand_name: string
  keyword: string
  job_id: string
}

/**
 * API response structure for dashboard posts
 */
export interface DashboardApiResponse {
  success: boolean
  data: DashboardPost[]
}

/**
 * Query parameters for fetching dashboard posts
 */
export interface GetDashboardPostsParams {
  project_id: string
  limit?: number
  sort_by?: 'analyzed_at' | 'published_at' | 'impact_score'
  sort_order?: 'asc' | 'desc'
}

/**
 * Dashboard summary data structure from /analytic/summary API
 */
export interface DashboardSummary {
  total_posts: number
  total_comments: number
  sentiment_distribution: {
    POSITIVE: number
    NEUTRAL: number
    NEGATIVE: number
  }
  avg_sentiment_score: number
  risk_distribution: {
    LOW: number
    MEDIUM: number
    HIGH: number
    CRITICAL: number
  }
  intent_distribution: {
    [key: string]: number // DISCUSSION, SEEDING, LEAD, SUPPORT, etc.
  }
  platform_distribution: {
    [key: string]: number // TIKTOK, YOUTUBE, INSTAGRAM, FACEBOOK, etc.
  }
  engagement_totals: {
    views: number
    likes: number
    comments: number
    shares: number
    saves: number
  }
  viral_count: number
  kol_count: number
  avg_impact_score: number
}

/**
 * API response structure for dashboard summary
 */
export interface DashboardSummaryResponse {
  success: boolean
  data: DashboardSummary
}

/**
 * Keyword data from top-keywords API
 */
export interface KeywordData {
  keyword: string
  count: number
  avg_sentiment_score: number
  aspect: 'PRICE' | 'PERFORMANCE' | 'DESIGN' | 'SERVICE' | null
  sentiment_breakdown: {
    POSITIVE: number
    NEUTRAL: number
    NEGATIVE: number
  }
}

/**
 * Project keyword ranking data
 */
export interface KeywordRank {
  keyword: string
  rank: number | null
  count: number
  avg_sentiment_score: number
  in_top: boolean
  aspect?: 'PRICE' | 'PERFORMANCE' | 'DESIGN' | 'SERVICE' | null
}

/**
 * Top keywords API response structure
 */
export interface TopKeywordsResponse {
  success: boolean
  data: {
    keywords: KeywordData[]
    input_keyword_ranks: KeywordRank[]
  }
}

/**
 * Parameters for fetching top keywords
 */
export interface GetTopKeywordsParams {
  limit?: number
  includeRankFor?: string[] // Array of project keywords to get ranking for
}

/**
 * Dashboard service for fetching and managing analytics data
 */
export const dashboardService = {
  /**
   * Fetch dashboard summary metrics
   *
   * @param projectId - The project ID to fetch summary for
   * @returns Promise with DashboardSummary object
   *
   * @example
   * ```typescript
   * const summary = await dashboardService.getDashboardSummary('project-123')
   * console.log(summary.total_posts, summary.avg_sentiment_score)
   * ```
   */
  getDashboardSummary: async (projectId: string): Promise<DashboardSummary> => {
    try {
      const queryParams = new URLSearchParams({
        project_id: projectId,
      })

      const url = `/analytic/summary?${queryParams.toString()}`

      const response = await apiClient.get<DashboardSummaryResponse>(url, {
        timeout: 5000, // 5 second timeout for summary
      })

      if (!response.data.success) {
        throw new Error('Summary API returned unsuccessful response')
      }

      return response.data.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dashboard summary'
      const errorCode = error.response?.status || 500

      console.error('Dashboard Summary API error:', {
        errorCode,
        errorMessage,
        projectId,
      })

      throw {
        error_code: errorCode,
        message: errorMessage,
        status: error.response?.status,
        statusText: error.response?.statusText || '',
      }
    }
  },

  /**
   * Fetch top trending keywords with optional project keyword rankings
   *
   * @param projectId - The project ID to fetch keywords for
   * @param params - Optional parameters (limit, includeRankFor)
   * @returns Promise with TopKeywordsResponse data
   *
   * @example
   * ```typescript
   * const keywords = await dashboardService.getTopKeywords('project-123', {
   *   limit: 20,
   *   includeRankFor: ['keyword1', 'keyword2']
   * })
   * console.log(keywords.keywords, keywords.input_keyword_ranks)
   * ```
   */
  getTopKeywords: async (
    projectId: string,
    params?: GetTopKeywordsParams
  ): Promise<TopKeywordsResponse['data']> => {
    try {
      const queryParams = new URLSearchParams({
        project_id: projectId,
        limit: (params?.limit || 20).toString(),
      })

      // Add include_rank_for parameter if project keywords provided
      if (params?.includeRankFor && params.includeRankFor.length > 0) {
        queryParams.append('include_rank_for', params.includeRankFor.join(','))
      }

      const url = `/analytic/top-keywords?${queryParams.toString()}`

      const response = await apiClient.get<TopKeywordsResponse>(url, {
        timeout: 3000, // 3 second timeout for keywords
      })

      if (!response.data.success) {
        throw new Error('Top-keywords API returned unsuccessful response')
      }

      return response.data.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch top keywords'
      const errorCode = error.response?.status || 500

      console.error('Top-Keywords API error:', {
        errorCode,
        errorMessage,
        projectId,
        params,
      })

      throw {
        error_code: errorCode,
        message: errorMessage,
        status: error.response?.status,
        statusText: error.response?.statusText || '',
      }
    }
  },

  /**
   * Fetch all analyzed posts for a project
   *
   * @param projectId - The project ID to fetch posts for
   * @param params - Optional query parameters (limit, sort_by, sort_order)
   * @returns Promise with array of DashboardPost objects
   *
   * @example
   * ```typescript
   * const posts = await dashboardService.getDashboardPosts('project-123', { limit: 500 })
   * ```
   */
  getDashboardPosts: async (
    projectId: string,
    params?: Omit<GetDashboardPostsParams, 'project_id'>
  ): Promise<DashboardPost[]> => {
    try {
      const queryParams = new URLSearchParams({
        project_id: projectId,
        limit: (params?.limit || 1000).toString(),
        sort_by: params?.sort_by || 'analyzed_at',
        sort_order: params?.sort_order || 'desc',
      })

      const url = `/analytic/posts/all?${queryParams.toString()}`

      const response = await apiClient.get<DashboardApiResponse>(url, {
        timeout: 15000, // 15 second timeout for large datasets
      })

      if (!response.data.success) {
        throw new Error('API returned unsuccessful response')
      }

      return response.data.data || []
    } catch (error: any) {
      // Enhanced error handling
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dashboard data'
      const errorCode = error.response?.status || 500

      console.error('Dashboard API error:', {
        errorCode,
        errorMessage,
        projectId,
        params,
      })

      throw {
        error_code: errorCode,
        message: errorMessage,
        status: error.response?.status,
        statusText: error.response?.statusText || '',
      }
    }
  },
}
