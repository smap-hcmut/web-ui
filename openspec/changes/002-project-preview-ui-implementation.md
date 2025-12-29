# Change Proposal 002: Project Preview UI Implementation (WebSocket Data Display)

**Type:** UI Feature - Display Only
**Status:** Proposed
**Created:** 2024-12-11
**Related Spec:** DRY-RUN-DATA-FLOW.md (Section 3.3 - Output from WebSocket)
**Complexity:** Medium
**Estimated Effort:** 5-7 days

---

## Summary

Create a preview step UI component in the project creation wizard (between Step 3 and Step 4) that displays dry-run data received via WebSocket. This is a **display-only** feature that shows sample posts, engagement metrics, and keyword effectiveness based on the WebSocket message format defined in `docs/DRY-RUN-DATA-FLOW.md`.

**Key Point:** No new API calls. Data comes from existing WebSocket connection that receives `dryrun_result` messages.

---

## Data Source

### WebSocket Message Format (from DRY-RUN-DATA-FLOW.md line 632-648)

```json
{
  "type": "dryrun_result",
  "payload": {
    "type": "dryrun_result",
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "platform": "tiktok",
    "status": "success",
    "payload": {
      "content": [
        {
          "meta": {
            "id": "7234567890123456789",
            "platform": "tiktok",
            "job_id": "550e8400-e29b-41d4-a716-446655440000",
            "crawled_at": "2024-01-15T10:30:00Z",
            "published_at": "2024-01-10T08:00:00Z",
            "permalink": "https://www.tiktok.com/@user/video/7234567890123456789",
            "keyword_source": "cooking tutorial",
            "lang": "vi",
            "region": "VN",
            "pipeline_version": "crawler_tiktok_v3",
            "fetch_status": "success",
            "fetch_error": null
          },
          "content": {
            "text": "Easy cooking tutorial! #cooking #food",
            "duration": 45,
            "hashtags": ["cooking", "food"],
            "sound_name": "Original Sound - User",
            "category": "Food",
            "media": {
              "type": "audio",
              "video_path": "",
              "audio_path": "tiktok/job-abc-123/7234567890123456789.mp3",
              "downloaded_at": "2024-01-15T10:31:00Z"
            },
            "transcription": "Today I will show you how to cook..."
          },
          "interaction": {
            "views": 150000,
            "likes": 12000,
            "comments_count": 450,
            "shares": 890,
            "saves": 2300,
            "engagement_rate": 0.0893,
            "updated_at": "2024-01-15T10:30:00Z"
          },
          "author": {
            "id": "user123",
            "name": "Cooking Master",
            "username": "cookingmaster",
            "followers": 500000,
            "following": 123,
            "likes": 5000000,
            "videos": 234,
            "is_verified": true,
            "bio": "Professional chef sharing recipes",
            "avatar_url": null,
            "profile_url": "https://www.tiktok.com/@cookingmaster"
          },
          "comments": [
            {
              "id": "comment123",
              "parent_id": null,
              "post_id": "7234567890123456789",
              "user": {
                "id": null,
                "name": "FoodLover",
                "avatar_url": null
              },
              "text": "Amazing recipe!",
              "likes": 45,
              "replies_count": 2,
              "published_at": "2024-01-10T09:00:00Z",
              "is_author": false,
              "media": null
            }
          ]
        }
      ],
      "errors": []
    }
  },
  "timestamp": "2024-01-15T10:30:05Z"
}
```

---

## TypeScript Interfaces

### File: `lib/types/dryrun.ts` (New File)

```typescript
// WebSocket message wrapper
export interface DryRunWebSocketMessage {
  type: 'dryrun_result'
  payload: DryRunPayload
  timestamp: string
}

// Top-level payload
export interface DryRunPayload {
  type: 'dryrun_result'
  job_id: string
  platform: 'tiktok' | 'youtube'
  status: 'success' | 'failed'
  payload: {
    content: DryRunContent[]
    errors: DryRunError[]
  }
}

// Main content structure
export interface DryRunContent {
  meta: DryRunContentMeta
  content: DryRunContentData
  interaction: DryRunInteraction
  author: DryRunAuthor
  comments: DryRunComment[]
}

export interface DryRunContentMeta {
  id: string
  platform: 'tiktok' | 'youtube'
  job_id: string
  crawled_at: string // ISO 8601
  published_at: string // ISO 8601
  permalink: string
  keyword_source: string
  lang: string
  region: string
  pipeline_version: string
  fetch_status: string
  fetch_error: string | null
}

export interface DryRunContentData {
  text: string
  duration?: number
  hashtags?: string[]
  sound_name?: string
  category?: string | null
  title?: string | null // YouTube only
  media?: {
    type: string
    video_path?: string
    audio_path?: string
    downloaded_at?: string
  }
  transcription?: string | null
}

export interface DryRunInteraction {
  views: number
  likes: number
  comments_count: number
  shares: number
  saves?: number
  engagement_rate?: number
  updated_at: string // ISO 8601
}

export interface DryRunAuthor {
  id: string
  name: string
  username: string
  followers: number
  following: number
  likes: number
  videos: number
  is_verified: boolean
  bio?: string
  avatar_url?: string | null
  profile_url: string
  country?: string | null // YouTube only
  total_view_count?: number | null // YouTube only
}

export interface DryRunComment {
  id: string
  parent_id?: string | null
  post_id: string
  user: {
    id?: string | null
    name: string
    avatar_url?: string | null
  }
  text: string
  likes: number
  replies_count: number
  published_at: string // ISO 8601
  is_author: boolean
  media?: string | null
  is_favorited?: boolean // YouTube only
}

export interface DryRunError {
  code: string
  message: string
  keyword?: string
}

// Aggregated metrics for display
export interface DryRunMetrics {
  totalPosts: number
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  avgEngagement: number
  topKeywords: { keyword: string; count: number }[]
  platforms: { platform: string; count: number }[]
}
```

---

## Changes Required

### 1. New Files to Create

#### 1.1 Types File

**File:** `lib/types/dryrun.ts`
- All TypeScript interfaces (see above)
- **Lines:** ~150-180 lines

---

#### 1.2 Main Preview Component

**File:** `components/dashboard/ProjectPreviewStep.tsx`

```typescript
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DryRunPayload, DryRunContent, DryRunMetrics } from '@/lib/types/dryrun'
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import PreviewMetricsSummary from './preview/PreviewMetricsSummary'
import PreviewKeywordTabs from './preview/PreviewKeywordTabs'
import PreviewPostList from './preview/PreviewPostList'
import PreviewLoadingState from './preview/PreviewLoadingState'
import PreviewErrorState from './preview/PreviewErrorState'
import { useTranslation } from 'next-i18next'

interface ProjectPreviewStepProps {
  projectData: {
    name: string
    brands: Array<{ keywords: string[] }>
    competitors: Array<{ keywords: string[] }>
  }
  dryRunData: DryRunPayload | null
  isLoading: boolean
  error: string | null
  onBack: () => void
  onNext: () => void
  onRetry?: () => void
}

export default function ProjectPreviewStep({
  projectData,
  dryRunData,
  isLoading,
  error,
  onBack,
  onNext,
  onRetry
}: ProjectPreviewStepProps) {
  const { t } = useTranslation('common')
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all')
  const [metrics, setMetrics] = useState<DryRunMetrics | null>(null)

  // Calculate aggregated metrics when data changes
  useEffect(() => {
    if (dryRunData?.payload?.content) {
      const calculated = calculateMetrics(dryRunData.payload.content)
      setMetrics(calculated)

      // Set first keyword as default
      if (calculated.topKeywords.length > 0) {
        setSelectedKeyword('all')
      }
    }
  }, [dryRunData])

  // Loading state
  if (isLoading) {
    return <PreviewLoadingState />
  }

  // Error state
  if (error || !dryRunData) {
    return (
      <PreviewErrorState
        error={error || t('preview.noData')}
        onBack={onBack}
        onRetry={onRetry}
      />
    )
  }

  // Filter posts by selected keyword
  const filteredPosts = selectedKeyword === 'all'
    ? dryRunData.payload.content
    : dryRunData.payload.content.filter(
        post => post.meta.keyword_source === selectedKeyword
      )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
          {t('preview.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('preview.subtitle')}
        </p>
      </div>

      {/* Success Indicator */}
      {dryRunData.status === 'success' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-800 dark:text-green-200">
            {t('preview.dataLoaded')}
          </span>
        </div>
      )}

      {/* Errors Display */}
      {dryRunData.payload.errors && dryRunData.payload.errors.length > 0 && (
        <div className="space-y-2">
          {dryRunData.payload.errors.map((err, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 px-4 py-3 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  {err.code}
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  {err.message}
                  {err.keyword && ` (Keyword: ${err.keyword})`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Summary */}
      {metrics && <PreviewMetricsSummary metrics={metrics} />}

      {/* Keyword Filter Tabs */}
      {metrics && (
        <PreviewKeywordTabs
          keywords={['all', ...metrics.topKeywords.map(k => k.keyword)]}
          selectedKeyword={selectedKeyword}
          onSelectKeyword={setSelectedKeyword}
          keywordCounts={metrics.topKeywords}
        />
      )}

      {/* Posts List */}
      <PreviewPostList
        posts={filteredPosts}
        platform={dryRunData.platform}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          {t('common.next')}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

// Helper function to calculate metrics
function calculateMetrics(content: DryRunContent[]): DryRunMetrics {
  const keywordMap = new Map<string, number>()
  const platformMap = new Map<string, number>()

  let totalViews = 0
  let totalLikes = 0
  let totalComments = 0
  let totalShares = 0
  let totalEngagement = 0

  content.forEach(post => {
    // Count keywords
    const keyword = post.meta.keyword_source
    keywordMap.set(keyword, (keywordMap.get(keyword) || 0) + 1)

    // Count platforms
    const platform = post.meta.platform
    platformMap.set(platform, (platformMap.get(platform) || 0) + 1)

    // Sum interactions
    totalViews += post.interaction.views || 0
    totalLikes += post.interaction.likes || 0
    totalComments += post.interaction.comments_count || 0
    totalShares += post.interaction.shares || 0
    totalEngagement += post.interaction.engagement_rate || 0
  })

  return {
    totalPosts: content.length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    avgEngagement: content.length > 0 ? totalEngagement / content.length : 0,
    topKeywords: Array.from(keywordMap.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count),
    platforms: Array.from(platformMap.entries())
      .map(([platform, count]) => ({ platform, count }))
  }
}
```

**Lines:** ~250-300 lines

---

#### 1.3 Sub-Components

**File:** `components/dashboard/preview/PreviewMetricsSummary.tsx`

```typescript
import React from 'react'
import { motion } from 'framer-motion'
import { Eye, Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react'
import { DryRunMetrics } from '@/lib/types/dryrun'
import { useTranslation } from 'next-i18next'

interface PreviewMetricsSummaryProps {
  metrics: DryRunMetrics
}

export default function PreviewMetricsSummary({ metrics }: PreviewMetricsSummaryProps) {
  const { t } = useTranslation('common')

  const metricCards = [
    {
      icon: Eye,
      label: t('preview.metrics.views'),
      value: metrics.totalViews,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/40'
    },
    {
      icon: Heart,
      label: t('preview.metrics.likes'),
      value: metrics.totalLikes,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/40'
    },
    {
      icon: MessageCircle,
      label: t('preview.metrics.comments'),
      value: metrics.totalComments,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/40'
    },
    {
      icon: Share2,
      label: t('preview.metrics.shares'),
      value: metrics.totalShares,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/40'
    },
    {
      icon: TrendingUp,
      label: t('preview.metrics.avgEngagement'),
      value: `${(metrics.avgEngagement * 100).toFixed(2)}%`,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/40'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {metricCards.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-xl p-4 shadow-brutal"
        >
          <div className={`w-10 h-10 ${metric.bg} rounded-lg flex items-center justify-center mb-3`}>
            <metric.icon className={`w-5 h-5 ${metric.color}`} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{metric.label}</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
```

**Lines:** ~80-100 lines

---

**File:** `components/dashboard/preview/PreviewKeywordTabs.tsx`

```typescript
import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'next-i18next'

interface PreviewKeywordTabsProps {
  keywords: string[]
  selectedKeyword: string
  onSelectKeyword: (keyword: string) => void
  keywordCounts: { keyword: string; count: number }[]
}

export default function PreviewKeywordTabs({
  keywords,
  selectedKeyword,
  onSelectKeyword,
  keywordCounts
}: PreviewKeywordTabsProps) {
  const { t } = useTranslation('common')

  const getCount = (keyword: string) => {
    if (keyword === 'all') {
      return keywordCounts.reduce((sum, k) => sum + k.count, 0)
    }
    return keywordCounts.find(k => k.keyword === keyword)?.count || 0
  }

  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map(keyword => {
        const isActive = selectedKeyword === keyword
        const count = getCount(keyword)

        return (
          <button
            key={keyword}
            onClick={() => onSelectKeyword(keyword)}
            className={`relative px-4 py-2 rounded-lg font-semibold transition-all ${
              isActive
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-brutal'
                : 'bg-white/60 dark:bg-gray-900/60 border border-amber-300/60 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            <span>{keyword === 'all' ? t('preview.allKeywords') : keyword}</span>
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                isActive
                  ? 'bg-white/20 dark:bg-gray-900/20'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
```

**Lines:** ~60-80 lines

---

**File:** `components/dashboard/preview/PreviewPostList.tsx`

```typescript
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DryRunContent } from '@/lib/types/dryrun'
import PreviewPostCard from './PreviewPostCard'
import { useTranslation } from 'next-i18next'

interface PreviewPostListProps {
  posts: DryRunContent[]
  platform: 'tiktok' | 'youtube'
}

export default function PreviewPostList({ posts, platform }: PreviewPostListProps) {
  const { t } = useTranslation('common')

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-xl">
        <p className="text-gray-600 dark:text-gray-400">{t('preview.noPosts')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black text-gray-900 dark:text-white">
        {t('preview.samplePosts')} ({posts.length})
      </h3>

      <AnimatePresence mode="popLayout">
        {posts.map((post, index) => (
          <motion.div
            key={post.meta.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
          >
            <PreviewPostCard post={post} platform={platform} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

**Lines:** ~50-60 lines

---

**File:** `components/dashboard/preview/PreviewPostCard.tsx`

```typescript
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bookmark,
  User,
  Calendar,
  Hash
} from 'lucide-react'
import { DryRunContent } from '@/lib/types/dryrun'
import { useTranslation } from 'next-i18next'
import { formatDistanceToNow } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'

interface PreviewPostCardProps {
  post: DryRunContent
  platform: 'tiktok' | 'youtube'
}

export default function PreviewPostCard({ post, platform }: PreviewPostCardProps) {
  const { t, i18n } = useTranslation('common')
  const [showComments, setShowComments] = useState(false)
  const [showTranscription, setShowTranscription] = useState(false)

  const locale = i18n.language === 'vi' ? vi : enUS

  // Platform icon/badge
  const platformBadge = {
    tiktok: { label: 'TikTok', color: 'bg-black text-white' },
    youtube: { label: 'YouTube', color: 'bg-red-600 text-white' }
  }[platform]

  // Format date
  const publishedDate = formatDistanceToNow(new Date(post.meta.published_at), {
    addSuffix: true,
    locale
  })

  return (
    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-xl p-6 shadow-brutal hover:shadow-brutal-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Author Avatar */}
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {post.author.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={post.author.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            )}
          </div>

          {/* Author Info */}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 dark:text-white">
                {post.author.name}
              </p>
              {post.author.is_verified && (
                <span className="text-blue-500">✓</span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              @{post.author.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {publishedDate}
            </p>
          </div>
        </div>

        {/* Platform Badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${platformBadge.color}`}>
          {platformBadge.label}
        </span>
      </div>

      {/* Content */}
      <div className="mb-4">
        {/* Title (YouTube only) */}
        {post.content.title && (
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {post.content.title}
          </h4>
        )}

        {/* Text Content */}
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {post.content.text}
        </p>

        {/* Hashtags */}
        {post.content.hashtags && post.content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.content.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded text-xs font-semibold"
              >
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Keyword Source */}
        <div className="mt-3 text-sm">
          <span className="text-gray-600 dark:text-gray-400">{t('preview.matchedKeyword')}:</span>
          <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded font-semibold">
            {post.meta.keyword_source}
          </span>
        </div>

        {/* Transcription Toggle */}
        {post.content.transcription && (
          <div className="mt-3">
            <button
              onClick={() => setShowTranscription(!showTranscription)}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showTranscription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {t('preview.transcription')}
            </button>
            {showTranscription && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                {post.content.transcription}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Interaction Stats */}
      <div className="flex items-center gap-6 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Eye className="w-5 h-5" />
          <span className="text-sm font-semibold">{post.interaction.views.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Heart className="w-5 h-5" />
          <span className="text-sm font-semibold">{post.interaction.likes.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{post.interaction.comments_count.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{post.interaction.shares.toLocaleString()}</span>
        </div>
        {post.interaction.saves && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Bookmark className="w-5 h-5" />
            <span className="text-sm font-semibold">{post.interaction.saves.toLocaleString()}</span>
          </div>
        )}
        {post.interaction.engagement_rate && (
          <div className="ml-auto">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded-full text-xs font-semibold">
              {(post.interaction.engagement_rate * 100).toFixed(2)}% {t('preview.engagement')}
            </span>
          </div>
        )}
      </div>

      {/* Author Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <span>{post.author.followers.toLocaleString()} {t('preview.followers')}</span>
        <span>•</span>
        <span>{post.author.videos} {t('preview.videos')}</span>
        {post.author.bio && (
          <>
            <span>•</span>
            <span className="truncate">{post.author.bio}</span>
          </>
        )}
      </div>

      {/* Comments Section */}
      {post.comments && post.comments.length > 0 && (
        <div>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {t('preview.viewComments')} ({post.comments.length})
          </button>

          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3"
            >
              {post.comments.slice(0, 5).map(comment => (
                <div
                  key={comment.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      {comment.user.avatar_url ? (
                        <img
                          src={comment.user.avatar_url}
                          alt={comment.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {comment.user.name}
                        </p>
                        {comment.is_author && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded text-xs font-semibold">
                            {t('preview.author')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {comment.text}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {comment.likes}
                        </span>
                        {comment.replies_count > 0 && (
                          <span>{comment.replies_count} {t('preview.replies')}</span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(comment.published_at), {
                            addSuffix: true,
                            locale
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {post.comments.length > 5 && (
                <p className="text-sm text-gray-500 dark:text-gray-500 text-center">
                  +{post.comments.length - 5} {t('preview.moreComments')}
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* View Original Link */}
      <div className="mt-4">
        <a
          href={post.meta.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          {t('preview.viewOriginal')}
        </a>
      </div>
    </div>
  )
}
```

**Lines:** ~350-400 lines

---

**File:** `components/dashboard/preview/PreviewLoadingState.tsx`

```typescript
import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'next-i18next'

export default function PreviewLoadingState() {
  const { t } = useTranslation('common')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Loading Indicator */}
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {t('preview.loading')}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('preview.loadingSubtext')}
        </p>
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-xl p-4 animate-pulse"
          >
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg mb-3" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
            <div className="h-6 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>

      {/* Posts Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-xl p-6 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
```

**Lines:** ~80-100 lines

---

**File:** `components/dashboard/preview/PreviewErrorState.tsx`

```typescript
import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useTranslation } from 'next-i18next'

interface PreviewErrorStateProps {
  error: string
  onBack: () => void
  onRetry?: () => void
}

export default function PreviewErrorState({
  error,
  onBack,
  onRetry
}: PreviewErrorStateProps) {
  const { t } = useTranslation('common')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 space-y-6"
    >
      {/* Error Icon */}
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>

      {/* Error Message */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white">
          {t('preview.errorTitle')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          {error}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('common.back')}
        </button>

        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            {t('preview.retry')}
          </button>
        )}
      </div>
    </motion.div>
  )
}
```

**Lines:** ~70-80 lines

---

### 2. Files to Modify

#### 2.1 ProjectSetupWizard.tsx

**File:** `components/dashboard/ProjectSetupWizard.tsx`

**Changes:**

```diff
+ import ProjectPreviewStep from './ProjectPreviewStep'
+ import { DryRunPayload } from '@/lib/types/dryrun'
+ import { dashboardWebSocket } from '@/services/websocketService'

  const steps = [
    { id: 1, title: 'Thông tin cơ bản', description: 'Đặt tên và mô tả project' },
    { id: 2, title: 'Thương hiệu của bạn', description: 'Thêm thương hiệu cần theo dõi' },
    { id: 3, title: 'Đối thủ cạnh tranh', description: 'Thêm các đối thủ để so sánh' },
+   { id: 4, title: 'Xem trước dữ liệu', description: 'Kiểm tra mẫu dữ liệu thu thập được' },
-   { id: 4, title: 'Xác nhận', description: 'Kiểm tra và tạo project' }
+   { id: 5, title: 'Xác nhận', description: 'Kiểm tra và tạo project' }
  ]

  export default function ProjectSetupWizard({ isOpen, onClose, onComplete }: ProjectSetupWizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [projectData, setProjectData] = useState<ProjectData>({ /* ... */ })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)

+   // Dry-run preview state
+   const [dryRunData, setDryRunData] = useState<DryRunPayload | null>(null)
+   const [isLoadingPreview, setIsLoadingPreview] = useState(false)
+   const [previewError, setPreviewError] = useState<string | null>(null)
+   const [dryRunJobId, setDryRunJobId] = useState<string | null>(null)

+   // WebSocket listener for dry-run results
+   useEffect(() => {
+     const handleDryRunResult = (message: any) => {
+       if (message.type === 'dryrun_result' && message.payload) {
+         const payload = message.payload as DryRunPayload
+
+         // Only process if it's for our current job
+         if (dryRunJobId && payload.job_id === dryRunJobId) {
+           setDryRunData(payload)
+           setIsLoadingPreview(false)
+           setPreviewError(null)
+         }
+       }
+     }
+
+     // Subscribe to WebSocket message event
+     dashboardWebSocket.on('dryrun_result', handleDryRunResult)
+
+     return () => {
+       dashboardWebSocket.off('dryrun_result', handleDryRunResult)
+     }
+   }, [dryRunJobId])

    const handleNext = async () => {
      if (validateStep(currentStep)) {
+       // Trigger dry-run when moving from step 3 to 4
+       if (currentStep === 3) {
+         await triggerDryRun()
+       }
        setCurrentStep(prev => Math.min(prev + 1, steps.length))
      }
    }

+   const triggerDryRun = async () => {
+     setIsLoadingPreview(true)
+     setPreviewError(null)
+     setDryRunData(null)
+
+     try {
+       // Collect all keywords from brands and competitors
+       const keywords = [
+         ...projectData.brands.flatMap(b => b.keywords),
+         ...projectData.competitors.flatMap(c => c.keywords)
+       ]
+
+       // Call dry-run API
+       const response = await projectService.createDryRun({ keywords })
+       setDryRunJobId(response.job_id)
+
+       // Wait for WebSocket message (handled by useEffect)
+       // Set timeout for 30 seconds
+       setTimeout(() => {
+         if (!dryRunData) {
+           setIsLoadingPreview(false)
+           setPreviewError('Timeout waiting for preview data')
+         }
+       }, 30000)
+
+     } catch (error: any) {
+       console.error('Dry-run trigger error:', error)
+       setPreviewError(error.message || 'Không thể khởi chạy preview')
+       setIsLoadingPreview(false)
+     }
+   }
+
+   const handleRetryPreview = () => {
+     triggerDryRun()
+   }

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="...">
            {/* ... existing steps ... */}

+           {/* Step 4: Preview */}
+           {currentStep === 4 && (
+             <ProjectPreviewStep
+               projectData={projectData}
+               dryRunData={dryRunData}
+               isLoading={isLoadingPreview}
+               error={previewError}
+               onBack={handlePrevious}
+               onNext={handleNext}
+               onRetry={handleRetryPreview}
+             />
+           )}

            {/* Step 5: Confirmation (previously step 4) */}
-           {currentStep === 4 && (
+           {currentStep === 5 && (
              <motion.div /* ... confirmation step ... */>
                {/* ... existing confirmation content ... */}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    )
  }
```

**Changes Summary:**
- Import types and WebSocket service
- Add dry-run state variables
- Add WebSocket listener useEffect
- Add `triggerDryRun()` function to call API
- Update `handleNext()` to trigger dry-run
- Add step 4 rendering with ProjectPreviewStep
- Update step 5 condition

**Estimated Lines Changed:** ~100-120 lines added

---

#### 2.2 project.service.ts

**File:** `lib/api/services/project.service.ts`

**Changes:**

```diff
+ export interface CreateDryRunPayload {
+   keywords: string[]
+ }
+
+ export interface DryRunResponse {
+   job_id: string
+   status: string
+   message: string
+ }

  export const projectService = {
    // ... existing methods ...

+   // Create dry-run (trigger keyword preview)
+   createDryRun: async (payload: CreateDryRunPayload): Promise<DryRunResponse> => {
+     const response = await apiClient.post<{
+       error_code: number
+       message: string
+       data: DryRunResponse
+     }>('/project/projects/dryrun', {
+       keywords: payload.keywords
+     })
+
+     if (response.data.error_code !== 0) {
+       throw new Error(response.data.message || 'Failed to create dry-run')
+     }
+
+     return response.data.data
+   },
  }
```

**Changes Summary:**
- Add `CreateDryRunPayload` interface
- Add `DryRunResponse` interface
- Add `createDryRun()` method

**Estimated Lines Changed:** ~25-30 lines added

---

#### 2.3 Translation Files

**File:** `public/locales/en/common.json`

```diff
  {
    "projects": {
      /* ... existing ... */
+   },
+   "preview": {
+     "title": "Preview Sample Data",
+     "subtitle": "Review sample posts collected from keywords",
+     "loading": "Loading preview data...",
+     "loadingSubtext": "This may take a few moments...",
+     "dataLoaded": "Preview data loaded successfully",
+     "noData": "No preview data available",
+     "noPosts": "No posts found for this keyword",
+     "samplePosts": "Sample Posts",
+     "allKeywords": "All Keywords",
+     "matchedKeyword": "Matched Keyword",
+     "transcription": "Transcription",
+     "viewComments": "View Comments",
+     "viewOriginal": "View Original Post",
+     "moreComments": "more comments",
+     "author": "Author",
+     "replies": "replies",
+     "followers": "followers",
+     "videos": "videos",
+     "engagement": "engagement",
+     "errorTitle": "Unable to Load Preview",
+     "retry": "Retry",
+     "metrics": {
+       "views": "Views",
+       "likes": "Likes",
+       "comments": "Comments",
+       "shares": "Shares",
+       "avgEngagement": "Avg. Engagement"
+     }
    }
  }
```

**File:** `public/locales/vi/common.json`

```diff
  {
    "projects": {
      /* ... existing ... */
+   },
+   "preview": {
+     "title": "Xem Trước Dữ Liệu Mẫu",
+     "subtitle": "Xem các bài đăng mẫu thu thập từ từ khóa",
+     "loading": "Đang tải dữ liệu xem trước...",
+     "loadingSubtext": "Quá trình này có thể mất vài phút...",
+     "dataLoaded": "Đã tải dữ liệu xem trước thành công",
+     "noData": "Không có dữ liệu xem trước",
+     "noPosts": "Không tìm thấy bài đăng cho từ khóa này",
+     "samplePosts": "Bài Đăng Mẫu",
+     "allKeywords": "Tất Cả Từ Khóa",
+     "matchedKeyword": "Từ Khóa Khớp",
+     "transcription": "Bản Chép Lời",
+     "viewComments": "Xem Bình Luận",
+     "viewOriginal": "Xem Bài Gốc",
+     "moreComments": "bình luận khác",
+     "author": "Tác Giả",
+     "replies": "phản hồi",
+     "followers": "người theo dõi",
+     "videos": "video",
+     "engagement": "tương tác",
+     "errorTitle": "Không Thể Tải Xem Trước",
+     "retry": "Thử Lại",
+     "metrics": {
+       "views": "Lượt Xem",
+       "likes": "Lượt Thích",
+       "comments": "Bình Luận",
+       "shares": "Chia Sẻ",
+       "avgEngagement": "Tương Tác TB"
+     }
    }
  }
```

---

### 3. Package Dependencies

#### Install date-fns (for date formatting)

```bash
npm install date-fns
```

**package.json:**
```diff
  "dependencies": {
    /* ... existing ... */
+   "date-fns": "^3.0.0"
  }
```

---

## Implementation Checklist

### Phase 1: Types & Setup (Day 1)
- [ ] Create `lib/types/dryrun.ts` with all interfaces
- [ ] Add `createDryRun()` to `project.service.ts`
- [ ] Add translation keys
- [ ] Install date-fns dependency

### Phase 2: Sub-Components (Day 2-3)
- [ ] Implement `PreviewLoadingState.tsx`
- [ ] Implement `PreviewErrorState.tsx`
- [ ] Implement `PreviewMetricsSummary.tsx`
- [ ] Implement `PreviewKeywordTabs.tsx`
- [ ] Style with Neobrutalism theme

### Phase 3: Post Display (Day 4)
- [ ] Implement `PreviewPostList.tsx`
- [ ] Implement `PreviewPostCard.tsx`
- [ ] Handle platform-specific fields (TikTok vs YouTube)
- [ ] Add expand/collapse for comments and transcription

### Phase 4: Main Component & Integration (Day 5)
- [ ] Implement `ProjectPreviewStep.tsx`
- [ ] Add metrics calculation logic
- [ ] Add keyword filtering
- [ ] Update `ProjectSetupWizard.tsx`
- [ ] Add WebSocket listener
- [ ] Wire up state management

### Phase 5: Testing & Polish (Day 6-7)
- [ ] Test with mock WebSocket data
- [ ] Test error states
- [ ] Test loading states
- [ ] Test keyword filtering
- [ ] Mobile responsiveness
- [ ] Accessibility review
- [ ] Performance optimization

---

## Testing Strategy

### Mock WebSocket Data

Create test file: `__tests__/mocks/dryRunData.ts`

```typescript
import { DryRunPayload } from '@/lib/types/dryrun'

export const mockDryRunPayload: DryRunPayload = {
  type: 'dryrun_result',
  job_id: '550e8400-e29b-41d4-a716-446655440000',
  platform: 'tiktok',
  status: 'success',
  payload: {
    content: [
      // ... (copy from DRY-RUN-DATA-FLOW.md)
    ],
    errors: []
  }
}
```

### Test Scenarios

1. **Loading State**
   - Trigger dry-run
   - Show loading skeleton
   - Show loading text

2. **Success State**
   - Receive WebSocket message
   - Display metrics summary
   - Display keyword tabs
   - Display post cards
   - Test keyword filtering

3. **Error State**
   - API call fails
   - WebSocket timeout
   - Display error message
   - Retry button works

4. **Edge Cases**
   - No posts returned
   - Missing optional fields
   - Long text content
   - Many comments (>5)
   - Multiple platforms

---

## Rollback Plan

If issues arise:

1. **Remove step 4 from wizard**
   - Comment out step 4 rendering
   - Revert steps array to 4 steps
   - Deploy within 5 minutes

2. **Feature flag**
```typescript
const ENABLE_PREVIEW = process.env.NEXT_PUBLIC_ENABLE_PREVIEW === 'true'

const steps = ENABLE_PREVIEW ? [/* 5 steps */] : [/* 4 steps */]
```

---

## Performance Considerations

- Lazy load `ProjectPreviewStep` component
- Virtualize long post lists (if >20 posts)
- Debounce keyword filter changes
- Optimize re-renders with React.memo
- Cache metrics calculations

---

## Security Considerations

- Sanitize post content (XSS prevention)
- Validate WebSocket message structure
- Rate limit dry-run API calls
- Don't expose sensitive job_id info

---

## Success Metrics

- Preview step loads within 5 seconds
- 90%+ users complete preview step
- <5% error rate
- Users spend 30-60 seconds reviewing

---

## Notes

- No new API endpoint needed (uses existing `/project/projects/dryrun`)
- Data comes via existing WebSocket connection
- Display-only feature, no data modification
- Platform-agnostic (works for TikTok and YouTube)

---

## Approval

**Developer:** _________________________ Date: _______

**Tech Lead:** _________________________ Date: _______

**Product Owner:** _____________________ Date: _______
