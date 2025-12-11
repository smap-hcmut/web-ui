import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DryRunOuterPayload, DryRunContent, DryRunMetrics } from '@/lib/types/dryrun'
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Eye, Sparkles } from 'lucide-react'
import PreviewMetricsSummary from './preview/PreviewMetricsSummary'
import PreviewKeywordTabs from './preview/PreviewKeywordTabs'
import PlatformTabs from './preview/PlatformTabs'
import FacebookPostCard from './preview/FacebookPostCard'
import TikTokPostCard from './preview/TikTokPostCard'
import YouTubePostCard from './preview/YouTubePostCard'
import PreviewLoadingState from './preview/PreviewLoadingState'
import PreviewErrorState from './preview/PreviewErrorState'
import { useTranslation } from 'next-i18next'
import { SAMPLE_PREVIEW_DATA } from './preview/sampleData'

type PlatformType = 'facebook' | 'tiktok' | 'youtube'

interface ProjectPreviewStepProps {
  projectData: {
    name: string
    brands: Array<{ keywords: string[] }>
    competitors: Array<{ keywords: string[] }>
  }
  dryRunData: DryRunOuterPayload | null
  isLoading: boolean
  error: string | null
  onBack: () => void
  onNext: () => void
  onRetry?: () => void
  onTriggerRealPreview?: () => void
}

export default function ProjectPreviewStep({
  projectData,
  dryRunData,
  isLoading,
  error,
  onBack,
  onNext,
  onRetry,
  onTriggerRealPreview
}: ProjectPreviewStepProps) {
  const { t } = useTranslation('common')
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all')
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('tiktok')
  const [metrics, setMetrics] = useState<DryRunMetrics | null>(null)
  const [showRealPreview, setShowRealPreview] = useState<boolean>(false)
  const [isSampleData, setIsSampleData] = useState<boolean>(true)

  // Calculate aggregated metrics when data changes
  useEffect(() => {
    if (dryRunData?.payload?.content) {
      const calculated = calculateMetrics(dryRunData.payload.content)
      setMetrics(calculated)
      setIsSampleData(false)

      // Set first keyword as default
      if (calculated.topKeywords.length > 0) {
        setSelectedKeyword('all')
      }
    } else {
      // Show sample data initially
      const calculated = calculateMetrics(SAMPLE_PREVIEW_DATA.payload.content)
      setMetrics(calculated)
      setIsSampleData(true)
    }
  }, [dryRunData])

  // Handle trigger real preview
  const handleTriggerRealPreview = () => {
    setShowRealPreview(true)
    if (onTriggerRealPreview) {
      onTriggerRealPreview()
    }
  }

  // Loading state (only show when trying to fetch real data)
  if (isLoading && showRealPreview) {
    return <PreviewLoadingState />
  }

  // Error state (only show when real preview failed)
  if (error && showRealPreview) {
    return (
      <PreviewErrorState
        error={error}
        onBack={onBack}
        onRetry={onRetry}
      />
    )
  }

  // Determine which data to display
  const displayData = dryRunData || SAMPLE_PREVIEW_DATA

  // Filter posts by selected keyword AND platform
  const filteredPosts = displayData.payload.content.filter(post => {
    const keywordMatch = selectedKeyword === 'all' || post.meta.keyword_source === selectedKeyword
    const platformMatch = selectedPlatform === 'facebook'
      ? false // Facebook not supported yet
      : post.meta.platform === selectedPlatform
    return keywordMatch && platformMatch
  })

  // Calculate platform counts
  const platformCounts = {
    facebook: 0, // Not supported yet
    tiktok: displayData.payload.content.filter(p => p.meta.platform === 'tiktok').length,
    youtube: displayData.payload.content.filter(p => p.meta.platform === 'youtube').length
  }

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

      {/* Sample Data Banner */}
      {isSampleData && !showRealPreview && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200 block">
                {t('preview.sampleDataBanner')}
              </span>
              <span className="text-xs text-blue-700 dark:text-blue-300">
                {t('preview.sampleDataDescription')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Real Data Preview Button */}
      {isSampleData && !showRealPreview && !isLoading && (
        <div className="flex justify-center">
          <button
            onClick={handleTriggerRealPreview}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
          >
            <Eye className="w-5 h-5" />
            {t('preview.viewRealDataButton')}
          </button>
        </div>
      )}

      {/* Success Indicator for Real Data */}
      {!isSampleData && displayData.status === 'success' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-800 dark:text-green-200">
            {t('preview.viewingRealData')}
          </span>
        </div>
      )}

      {/* Errors Display */}
      {displayData.payload.errors && displayData.payload.errors.length > 0 && (
        <div className="space-y-2">
          {displayData.payload.errors.map((err, idx) => (
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

      {/* Platform Tabs */}
      <PlatformTabs
        selectedPlatform={selectedPlatform}
        onSelectPlatform={setSelectedPlatform}
        platformCounts={platformCounts}
      />

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
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-xl">
            <p className="text-gray-600 dark:text-gray-400">
              {selectedPlatform === 'facebook'
                ? 'Facebook chưa được hỗ trợ'
                : 'Không có bài đăng nào'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post, index) => (
            <motion.div
              key={post.meta.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {selectedPlatform === 'facebook' && <FacebookPostCard post={post} />}
              {selectedPlatform === 'tiktok' && <TikTokPostCard post={post} />}
              {selectedPlatform === 'youtube' && <YouTubePostCard post={post} />}
            </motion.div>
          ))
        )}
      </div>

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
