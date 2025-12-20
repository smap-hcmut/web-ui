import { useState, useEffect, useCallback, useRef } from 'react'
import {
  dashboardService,
  DashboardPost,
  DashboardSummary,
  TopKeywordsResponse,
} from '@/lib/api/services/dashboard.service'
import { transformToDashboardData, DashboardData } from '@/lib/utils/dashboardDataTransform'

/**
 * Cache entry structure for each data type
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  projectId: string
}

/**
 * Hook state interface with three-phase loading
 */
interface UseDashboardDataState {
  // Combined dashboard data (for backward compatibility)
  data: DashboardData | null

  // Individual data sources
  summary: DashboardSummary | null
  keywords: TopKeywordsResponse['data'] | null
  posts: DashboardPost[] | null

  // Loading states for each phase
  loadingSummary: boolean
  loadingKeywords: boolean
  loadingPosts: boolean

  // Revalidation states
  revalidatingSummary: boolean
  revalidatingKeywords: boolean
  revalidatingPosts: boolean

  // Error states for each API
  summaryError: string | null
  keywordsError: string | null
  postsError: string | null

  // Last update timestamps
  summaryLastUpdate: Date | null
  keywordsLastUpdate: Date | null
  postsLastUpdate: Date | null
}

/**
 * Hook options
 */
interface UseDashboardDataOptions {
  projectId: string | null
  enabled?: boolean
  projectKeywords?: string[] // Project keywords for include_rank_for parameter

  // Cache TTL for each API (in milliseconds)
  summaryCacheTTL?: number // Default: 3 minutes
  keywordsCacheTTL?: number // Default: 5 minutes
  postsCacheTTL?: number // Default: 10 minutes

  // Stale time for each API
  summaryStaleTime?: number // Default: 5 minutes
  keywordsStaleTime?: number // Default: 8 minutes
  postsStaleTime?: number // Default: 15 minutes
}

/**
 * In-memory cache stores for each data type
 */
const summaryCache = new Map<string, CacheEntry<DashboardSummary>>()
const keywordsCache = new Map<string, CacheEntry<TopKeywordsResponse['data']>>()
const postsCache = new Map<string, CacheEntry<DashboardPost[]>>()

/**
 * Get cache key for a project and data type
 */
function getCacheKey(projectId: string, type: 'summary' | 'keywords' | 'posts'): string {
  return `dashboard:${type}:${projectId}`
}

/**
 * Get cached data if valid
 */
function getCachedData<T>(
  projectId: string,
  type: 'summary' | 'keywords' | 'posts',
  staleTime: number
): CacheEntry<T> | null {
  const cacheKey = getCacheKey(projectId, type)
  let cached: CacheEntry<T> | undefined

  if (type === 'summary') {
    cached = summaryCache.get(cacheKey) as CacheEntry<T> | undefined
  } else if (type === 'keywords') {
    cached = keywordsCache.get(cacheKey) as CacheEntry<T> | undefined
  } else {
    cached = postsCache.get(cacheKey) as CacheEntry<T> | undefined
  }

  if (!cached) return null

  const age = Date.now() - cached.timestamp
  if (age > staleTime) {
    // Cache is stale, but return it anyway (stale-while-revalidate)
    return cached
  }

  return cached
}

/**
 * Set cache data
 */
function setCacheData<T>(projectId: string, type: 'summary' | 'keywords' | 'posts', data: T): void {
  const cacheKey = getCacheKey(projectId, type)
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    projectId,
  }

  if (type === 'summary') {
    summaryCache.set(cacheKey, entry as CacheEntry<DashboardSummary>)
  } else if (type === 'keywords') {
    keywordsCache.set(cacheKey, entry as CacheEntry<TopKeywordsResponse['data']>)
  } else {
    postsCache.set(cacheKey, entry as CacheEntry<DashboardPost[]>)
  }
}

/**
 * Clear all caches for a specific project
 */
function clearAllCaches(projectId: string): void {
  summaryCache.delete(getCacheKey(projectId, 'summary'))
  keywordsCache.delete(getCacheKey(projectId, 'keywords'))
  postsCache.delete(getCacheKey(projectId, 'posts'))
}

/**
 * Custom hook for dashboard data with three-phase loading strategy
 *
 * Phase 1 (Priority - <500ms): Fetch summary API for metrics cards
 * Phase 2 (Fast - <1s): Fetch top-keywords API for TopicCloud
 * Phase 3 (Background - 2-5s): Fetch posts API for viral posts and time-series
 *
 * Features:
 * - Three-phase progressive loading
 * - Independent caching for each API with different TTLs
 * - Stale-while-revalidate for all APIs
 * - Graceful degradation and fallback logic
 * - Separate error handling for each API
 *
 * @example
 * ```typescript
 * const {
 *   data,
 *   summary,
 *   keywords,
 *   posts,
 *   loadingSummary,
 *   loadingKeywords,
 *   loadingPosts,
 *   refresh,
 * } = useDashboardData({
 *   projectId: 'project-123',
 *   projectKeywords: ['kiro', 'xe'],
 * })
 * ```
 */
export function useDashboardData(options: UseDashboardDataOptions) {
  const {
    projectId,
    enabled = true,
    projectKeywords = [],
    summaryCacheTTL = 3 * 60 * 1000, // 3 minutes
    keywordsCacheTTL = 5 * 60 * 1000, // 5 minutes
    postsCacheTTL = 10 * 60 * 1000, // 10 minutes
    summaryStaleTime = 5 * 60 * 1000, // 5 minutes
    keywordsStaleTime = 8 * 60 * 1000, // 8 minutes
    postsStaleTime = 15 * 60 * 1000, // 15 minutes
  } = options

  const [state, setState] = useState<UseDashboardDataState>({
    data: null,
    summary: null,
    keywords: null,
    posts: null,
    loadingSummary: false,
    loadingKeywords: false,
    loadingPosts: false,
    revalidatingSummary: false,
    revalidatingKeywords: false,
    revalidatingPosts: false,
    summaryError: null,
    keywordsError: null,
    postsError: null,
    summaryLastUpdate: null,
    keywordsLastUpdate: null,
    postsLastUpdate: null,
  })

  const abortControllersRef = useRef<{
    summary: AbortController | null
    keywords: AbortController | null
    posts: AbortController | null
  }>({
    summary: null,
    keywords: null,
    posts: null,
  })

  const retryCountsRef = useRef({ summary: 0, keywords: 0, posts: 0 })
  const maxRetries = 2

  /**
   * Phase 1: Fetch summary data
   */
  const fetchSummary = useCallback(
    async (isRevalidation = false): Promise<void> => {
      if (!projectId || !enabled) return

      // Cancel ongoing request
      if (abortControllersRef.current.summary) {
        abortControllersRef.current.summary.abort()
      }
      abortControllersRef.current.summary = new AbortController()

      setState((prev) => ({
        ...prev,
        loadingSummary: !isRevalidation,
        revalidatingSummary: isRevalidation,
        summaryError: null,
      }))

      try {
        const summary = await dashboardService.getDashboardSummary(projectId)

        // Update cache
        setCacheData(projectId, 'summary', summary)
        retryCountsRef.current.summary = 0

        setState((prev) => ({
          ...prev,
          summary,
          loadingSummary: false,
          revalidatingSummary: false,
          summaryError: null,
          summaryLastUpdate: new Date(),
        }))
      } catch (error: any) {
        console.error('Failed to fetch summary:', error)

        // Retry logic
        if (retryCountsRef.current.summary < maxRetries && error.error_code !== 404) {
          retryCountsRef.current.summary++
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCountsRef.current.summary), 5000)
          setTimeout(() => fetchSummary(isRevalidation), backoffDelay)
          return
        }

        setState((prev) => ({
          ...prev,
          loadingSummary: false,
          revalidatingSummary: false,
          summaryError: error.message || 'Failed to load summary',
        }))
      }
    },
    [projectId, enabled]
  )

  /**
   * Phase 2: Fetch top keywords data
   */
  const fetchKeywords = useCallback(
    async (isRevalidation = false): Promise<void> => {
      if (!projectId || !enabled) return

      if (abortControllersRef.current.keywords) {
        abortControllersRef.current.keywords.abort()
      }
      abortControllersRef.current.keywords = new AbortController()

      setState((prev) => ({
        ...prev,
        loadingKeywords: !isRevalidation,
        revalidatingKeywords: isRevalidation,
        keywordsError: null,
      }))

      try {
        const keywords = await dashboardService.getTopKeywords(projectId, {
          limit: 20,
          includeRankFor: projectKeywords.length > 0 ? projectKeywords : undefined,
        })

        setCacheData(projectId, 'keywords', keywords)
        retryCountsRef.current.keywords = 0

        setState((prev) => ({
          ...prev,
          keywords,
          loadingKeywords: false,
          revalidatingKeywords: false,
          keywordsError: null,
          keywordsLastUpdate: new Date(),
        }))
      } catch (error: any) {
        console.error('Failed to fetch keywords:', error)

        if (retryCountsRef.current.keywords < maxRetries && error.error_code !== 404) {
          retryCountsRef.current.keywords++
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCountsRef.current.keywords), 5000)
          setTimeout(() => fetchKeywords(isRevalidation), backoffDelay)
          return
        }

        setState((prev) => ({
          ...prev,
          loadingKeywords: false,
          revalidatingKeywords: false,
          keywordsError: error.message || 'Failed to load keywords',
        }))
      }
    },
    [projectId, enabled, projectKeywords]
  )

  /**
   * Phase 3: Fetch posts data (background)
   */
  const fetchPosts = useCallback(
    async (isRevalidation = false): Promise<void> => {
      if (!projectId || !enabled) return

      if (abortControllersRef.current.posts) {
        abortControllersRef.current.posts.abort()
      }
      abortControllersRef.current.posts = new AbortController()

      setState((prev) => ({
        ...prev,
        loadingPosts: !isRevalidation,
        revalidatingPosts: isRevalidation,
        postsError: null,
      }))

      try {
        const posts = await dashboardService.getDashboardPosts(projectId)

        setCacheData(projectId, 'posts', posts)
        retryCountsRef.current.posts = 0

        setState((prev) => ({
          ...prev,
          posts,
          loadingPosts: false,
          revalidatingPosts: false,
          postsError: null,
          postsLastUpdate: new Date(),
        }))
      } catch (error: any) {
        console.error('Failed to fetch posts:', error)

        if (retryCountsRef.current.posts < maxRetries && error.error_code !== 404) {
          retryCountsRef.current.posts++
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCountsRef.current.posts), 10000)
          setTimeout(() => fetchPosts(isRevalidation), backoffDelay)
          return
        }

        setState((prev) => ({
          ...prev,
          loadingPosts: false,
          revalidatingPosts: false,
          postsError: error.message || 'Failed to load posts',
        }))
      }
    },
    [projectId, enabled]
  )

  /**
   * Transform individual data sources to combined DashboardData
   */
  useEffect(() => {
    if (!state.posts || state.posts.length === 0) {
      setState((prev) => ({ ...prev, data: null }))
      return
    }

    // Transform with summary data if available
    const dashboardData = transformToDashboardData(state.posts, state.summary)

    setState((prev) => ({ ...prev, data: dashboardData }))
  }, [state.summary, state.posts])

  /**
   * Manual refresh - clears all caches and refetches
   */
  const refresh = useCallback(() => {
    if (!projectId) return

    clearAllCaches(projectId)
    retryCountsRef.current = { summary: 0, keywords: 0, posts: 0 }

    fetchSummary(false)
    fetchKeywords(false)
    fetchPosts(false)
  }, [projectId, fetchSummary, fetchKeywords, fetchPosts])

  /**
   * Three-phase loading on mount or project change
   */
  useEffect(() => {
    if (!projectId || !enabled) {
      setState({
        data: null,
        summary: null,
        keywords: null,
        posts: null,
        loadingSummary: false,
        loadingKeywords: false,
        loadingPosts: false,
        revalidatingSummary: false,
        revalidatingKeywords: false,
        revalidatingPosts: false,
        summaryError: null,
        keywordsError: null,
        postsError: null,
        summaryLastUpdate: null,
        keywordsLastUpdate: null,
        postsLastUpdate: null,
      })
      return
    }

    // Phase 1: Check summary cache and fetch
    const cachedSummary = getCachedData<DashboardSummary>(projectId, 'summary', summaryStaleTime)
    if (cachedSummary) {
      setState((prev) => ({
        ...prev,
        summary: cachedSummary.data,
        summaryLastUpdate: new Date(cachedSummary.timestamp),
      }))

      const summaryAge = Date.now() - cachedSummary.timestamp
      if (summaryAge > summaryCacheTTL) {
        fetchSummary(true) // Background revalidation
      }
    } else {
      fetchSummary(false)
    }

    // Phase 2: Check keywords cache and fetch
    const cachedKeywords = getCachedData<TopKeywordsResponse['data']>(
      projectId,
      'keywords',
      keywordsStaleTime
    )
    if (cachedKeywords) {
      setState((prev) => ({
        ...prev,
        keywords: cachedKeywords.data,
        keywordsLastUpdate: new Date(cachedKeywords.timestamp),
      }))

      const keywordsAge = Date.now() - cachedKeywords.timestamp
      if (keywordsAge > keywordsCacheTTL) {
        fetchKeywords(true)
      }
    } else {
      fetchKeywords(false)
    }

    // Phase 3: Check posts cache and fetch (background)
    const cachedPosts = getCachedData<DashboardPost[]>(projectId, 'posts', postsStaleTime)
    if (cachedPosts) {
      setState((prev) => ({
        ...prev,
        posts: cachedPosts.data,
        postsLastUpdate: new Date(cachedPosts.timestamp),
      }))

      const postsAge = Date.now() - cachedPosts.timestamp
      if (postsAge > postsCacheTTL) {
        fetchPosts(true)
      }
    } else {
      fetchPosts(false)
    }

    // Cleanup on unmount
    return () => {
      if (abortControllersRef.current.summary) abortControllersRef.current.summary.abort()
      if (abortControllersRef.current.keywords) abortControllersRef.current.keywords.abort()
      if (abortControllersRef.current.posts) abortControllersRef.current.posts.abort()
    }
  }, [
    projectId,
    enabled,
    summaryCacheTTL,
    keywordsCacheTTL,
    postsCacheTTL,
    summaryStaleTime,
    keywordsStaleTime,
    postsStaleTime,
    fetchSummary,
    fetchKeywords,
    fetchPosts,
  ])

  return {
    // Combined data (backward compatibility)
    data: state.data,
    isLoading: state.loadingSummary || state.loadingKeywords || state.loadingPosts,
    error: state.summaryError || state.keywordsError || state.postsError,

    // Individual data sources
    summary: state.summary,
    keywords: state.keywords,
    posts: state.posts,

    // Individual loading states
    loadingSummary: state.loadingSummary,
    loadingKeywords: state.loadingKeywords,
    loadingPosts: state.loadingPosts,

    // Revalidation states
    revalidatingSummary: state.revalidatingSummary,
    revalidatingKeywords: state.revalidatingKeywords,
    revalidatingPosts: state.revalidatingPosts,

    // Individual errors
    summaryError: state.summaryError,
    keywordsError: state.keywordsError,
    postsError: state.postsError,

    // Last update timestamps
    summaryLastUpdate: state.summaryLastUpdate,
    keywordsLastUpdate: state.keywordsLastUpdate,
    postsLastUpdate: state.postsLastUpdate,

    // Actions
    refresh,
    refreshSummary: () => {
      if (projectId) {
        summaryCache.delete(getCacheKey(projectId, 'summary'))
        retryCountsRef.current.summary = 0
        fetchSummary(false)
      }
    },
    refreshKeywords: () => {
      if (projectId) {
        keywordsCache.delete(getCacheKey(projectId, 'keywords'))
        retryCountsRef.current.keywords = 0
        fetchKeywords(false)
      }
    },
    refreshPosts: () => {
      if (projectId) {
        postsCache.delete(getCacheKey(projectId, 'posts'))
        retryCountsRef.current.posts = 0
        fetchPosts(false)
      }
    },
  }
}
