import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react'
import { useDashboard } from './DashboardContext'
import {
  TrendTopic,
  TrendPost,
  TrendHashtag,
  TrendMetricsSummary,
  extractTrendTopics,
  extractTrendHashtags,
  transformToTrendPosts,
  calculateTrendMetrics,
} from '@/lib/utils/trendDataTransform'

// Re-export types for convenience
export type { TrendTopic, TrendPost, TrendHashtag, TrendMetricsSummary }

export interface TrendFilters {
  timeRange: string
  platforms: string[]
  industries: string[]
  keywords: string[]
  minVolume: number
  minConfidence: number
  sentiment: string[]
  customDateRange?: {
    start: Date
    end: Date
  }
}

export interface TrendState {
  topics: TrendTopic[]
  hashtags: TrendHashtag[]
  samplePosts: TrendPost[]
  metrics: TrendMetricsSummary | null
  filters: TrendFilters
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
  selectedTopic: string | null
  searchQuery: string
  viewMode: 'topics' | 'hashtags' | 'posts'
  sortBy: 'volume' | 'delta' | 'confidence' | 'sentiment'
  sortOrder: 'asc' | 'desc'
  savedItems: {
    topics: string[]
    hashtags: string[]
    posts: string[]
  }
}

export type TrendAction =
  | { type: 'SET_TOPICS'; payload: TrendTopic[] }
  | { type: 'SET_HASHTAGS'; payload: TrendHashtag[] }
  | { type: 'SET_SAMPLE_POSTS'; payload: TrendPost[] }
  | { type: 'SET_METRICS'; payload: TrendMetricsSummary }
  | { type: 'SET_FILTERS'; payload: Partial<TrendFilters> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_UPDATE'; payload: Date }
  | { type: 'SET_SELECTED_TOPIC'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: 'topics' | 'hashtags' | 'posts' }
  | { type: 'SET_SORT'; payload: { by: 'volume' | 'delta' | 'confidence' | 'sentiment'; order: 'asc' | 'desc' } }
  | { type: 'RESET_FILTERS' }
  | { type: 'TOGGLE_SAVED_ITEM'; payload: { type: 'topics' | 'hashtags' | 'posts'; id: string } }

const initialFilters: TrendFilters = {
  timeRange: '7d',
  platforms: [],
  industries: [],
  keywords: [],
  minVolume: 0,
  minConfidence: 0,
  sentiment: []
}

const initialState: TrendState = {
  topics: [],
  hashtags: [],
  samplePosts: [],
  metrics: null,
  filters: initialFilters,
  isLoading: false,
  error: null,
  lastUpdate: null,
  selectedTopic: null,
  searchQuery: '',
  viewMode: 'topics',
  sortBy: 'volume',
  sortOrder: 'desc',
  savedItems: {
    topics: [],
    hashtags: [],
    posts: []
  }
}

function trendReducer(state: TrendState, action: TrendAction): TrendState {
  switch (action.type) {
    case 'SET_TOPICS':
      return { ...state, topics: action.payload }
    case 'SET_HASHTAGS':
      return { ...state, hashtags: action.payload }
    case 'SET_SAMPLE_POSTS':
      return { ...state, samplePosts: action.payload }
    case 'SET_METRICS':
      return { ...state, metrics: action.payload }
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_LAST_UPDATE':
      return { ...state, lastUpdate: action.payload }
    case 'SET_SELECTED_TOPIC':
      return { ...state, selectedTopic: action.payload }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'SET_SORT':
      return { ...state, sortBy: action.payload.by, sortOrder: action.payload.order }
    case 'RESET_FILTERS':
      return { ...state, filters: initialFilters }
    case 'TOGGLE_SAVED_ITEM':
      const { type, id } = action.payload
      const currentSaved = state.savedItems[type]
      const isSaved = currentSaved.includes(id)
      return {
        ...state,
        savedItems: {
          ...state.savedItems,
          [type]: isSaved
            ? currentSaved.filter(itemId => itemId !== id)
            : [...currentSaved, id]
        }
      }
    default:
      return state
  }
}


interface TrendContextType {
  state: TrendState
  dispatch: React.Dispatch<TrendAction>
  // Filtered data
  filteredTopics: TrendTopic[]
  filteredHashtags: TrendHashtag[]
  filteredPosts: TrendPost[]
  // Actions
  setFilters: (filters: Partial<TrendFilters>) => void
  setSelectedTopic: (topicId: string | null) => void
  setSearchQuery: (query: string) => void
  setViewMode: (mode: 'topics' | 'hashtags' | 'posts') => void
  setSort: (by: 'volume' | 'delta' | 'confidence' | 'sentiment', order: 'asc' | 'desc') => void
  resetFilters: () => void
  refreshData: () => void
  toggleSavedItem: (type: 'topics' | 'hashtags' | 'posts', id: string) => void
  isItemSaved: (type: 'topics' | 'hashtags' | 'posts', id: string) => boolean
  // Data source info
  isUsingRealData: boolean
}

const TrendContext = createContext<TrendContextType | undefined>(undefined)

interface TrendProviderProps {
  children: ReactNode
}

export function TrendProvider({ children }: TrendProviderProps) {
  const [state, dispatch] = useReducer(trendReducer, initialState)
  
  // Get data from DashboardContext
  const { dashboardPosts, loadingPosts, postsError, refreshPosts } = useDashboard()

  // Transform dashboard posts to trend data when posts change
  useEffect(() => {
    if (loadingPosts) {
      dispatch({ type: 'SET_LOADING', payload: true })
      return
    }

    if (postsError) {
      dispatch({ type: 'SET_ERROR', payload: postsError })
      dispatch({ type: 'SET_LOADING', payload: false })
      return
    }

    if (dashboardPosts && dashboardPosts.length > 0) {
      // Transform posts to trend data
      const topics = extractTrendTopics(dashboardPosts)
      const hashtags = extractTrendHashtags(dashboardPosts)
      const posts = transformToTrendPosts(dashboardPosts)
      const metrics = calculateTrendMetrics(dashboardPosts, topics, hashtags)

      dispatch({ type: 'SET_TOPICS', payload: topics })
      dispatch({ type: 'SET_HASHTAGS', payload: hashtags })
      dispatch({ type: 'SET_SAMPLE_POSTS', payload: posts })
      dispatch({ type: 'SET_METRICS', payload: metrics })
      dispatch({ type: 'SET_LAST_UPDATE', payload: new Date() })
      dispatch({ type: 'SET_ERROR', payload: null })
    }

    dispatch({ type: 'SET_LOADING', payload: false })
  }, [dashboardPosts, loadingPosts, postsError])

  // Filter topics
  const filteredTopics = useMemo(() => {
    let filtered = state.topics

    // Search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(topic =>
        topic.name.toLowerCase().includes(query) ||
        topic.keywords.some(kw => kw.toLowerCase().includes(query))
      )
    }

    // Platform filter
    if (state.filters.platforms.length > 0) {
      filtered = filtered.filter(topic =>
        state.filters.platforms.some(platform =>
          topic.platforms.includes(platform.toLowerCase())
        )
      )
    }

    // Volume filter
    if (state.filters.minVolume > 0) {
      filtered = filtered.filter(topic => topic.volume >= state.filters.minVolume)
    }

    // Confidence filter
    if (state.filters.minConfidence > 0) {
      filtered = filtered.filter(topic => topic.confidence >= state.filters.minConfidence)
    }

    // Sentiment filter
    if (state.filters.sentiment.length > 0) {
      filtered = filtered.filter(topic => {
        const dominant = getDominantSentiment(topic.sentiment)
        return state.filters.sentiment.includes(dominant)
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: number, bValue: number
      switch (state.sortBy) {
        case 'volume': aValue = a.volume; bValue = b.volume; break
        case 'delta': aValue = a.delta; bValue = b.delta; break
        case 'confidence': aValue = a.confidence; bValue = b.confidence; break
        case 'sentiment': aValue = a.sentiment.positive; bValue = b.sentiment.positive; break
        default: aValue = a.volume; bValue = b.volume
      }
      return state.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [state.topics, state.searchQuery, state.filters, state.sortBy, state.sortOrder])

  // Filter hashtags
  const filteredHashtags = useMemo(() => {
    let filtered = state.hashtags

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(hashtag =>
        hashtag.hashtag.toLowerCase().includes(query)
      )
    }

    if (state.filters.platforms.length > 0) {
      filtered = filtered.filter(hashtag =>
        state.filters.platforms.some(platform =>
          hashtag.platforms.includes(platform.toLowerCase())
        )
      )
    }

    // Sort by volume
    filtered.sort((a, b) => {
      const aValue = state.sortBy === 'volume' ? a.volume : a.engagementRate
      const bValue = state.sortBy === 'volume' ? b.volume : b.engagementRate
      return state.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [state.hashtags, state.searchQuery, state.filters.platforms, state.sortBy, state.sortOrder])

  // Filter posts
  const filteredPosts = useMemo(() => {
    let filtered = state.samplePosts

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query)
      )
    }

    if (state.filters.platforms.length > 0) {
      filtered = filtered.filter(post =>
        state.filters.platforms.includes(post.platform.toLowerCase())
      )
    }

    if (state.filters.sentiment.length > 0) {
      filtered = filtered.filter(post =>
        state.filters.sentiment.includes(post.sentiment.label)
      )
    }

    // Sort by engagement
    filtered.sort((a, b) => {
      const engA = a.metrics.likes + a.metrics.comments
      const engB = b.metrics.likes + b.metrics.comments
      return state.sortOrder === 'asc' ? engA - engB : engB - engA
    })

    return filtered
  }, [state.samplePosts, state.searchQuery, state.filters, state.sortOrder])

  // Helper function
  function getDominantSentiment(sentiment: { positive: number; neutral: number; negative: number }): string {
    if (sentiment.positive >= sentiment.neutral && sentiment.positive >= sentiment.negative) return 'positive'
    if (sentiment.negative >= sentiment.neutral && sentiment.negative >= sentiment.positive) return 'negative'
    return 'neutral'
  }

  // Actions
  const setFilters = (filters: Partial<TrendFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }

  const setSelectedTopic = (topicId: string | null) => {
    dispatch({ type: 'SET_SELECTED_TOPIC', payload: topicId })
  }

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
  }

  const setViewMode = (mode: 'topics' | 'hashtags' | 'posts') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  }

  const setSort = (by: 'volume' | 'delta' | 'confidence' | 'sentiment', order: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT', payload: { by, order } })
  }

  const resetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' })
  }

  const refreshData = () => {
    refreshPosts()
  }

  const toggleSavedItem = (type: 'topics' | 'hashtags' | 'posts', id: string) => {
    dispatch({ type: 'TOGGLE_SAVED_ITEM', payload: { type, id } })
  }

  const isItemSaved = (type: 'topics' | 'hashtags' | 'posts', id: string) => {
    return state.savedItems[type].includes(id)
  }

  const isUsingRealData = dashboardPosts && dashboardPosts.length > 0

  const contextValue: TrendContextType = {
    state,
    dispatch,
    filteredTopics,
    filteredHashtags,
    filteredPosts,
    setFilters,
    setSelectedTopic,
    setSearchQuery,
    setViewMode,
    setSort,
    resetFilters,
    refreshData,
    toggleSavedItem,
    isItemSaved,
    isUsingRealData,
  }

  return (
    <TrendContext.Provider value={contextValue}>
      {children}
    </TrendContext.Provider>
  )
}

export const useTrend = () => {
  const context = useContext(TrendContext)
  if (context === undefined) {
    throw new Error('useTrend must be used within a TrendProvider')
  }
  return context
}
