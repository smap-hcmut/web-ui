import React from 'react'
import { motion } from 'framer-motion'
import MetricCard from './MetricCard'
import UnifiedChart from './charts/UnifiedChart'
import CompetitorChart from './charts/CompetitorChart'
import TopicCloud from './charts/TopicCloud'
import TopViralPosts from './charts/TopViralPosts'
import SalesFunnel from './charts/SalesFunnel'
import DataTable from './DataTable'
import TopicDetailModal from './TopicDetailModal'
import { useDashboard } from '../../contexts/DashboardContext'
import { useTranslation } from 'next-i18next'
import { Users, MessageCircle, ShoppingCart, DollarSign } from 'lucide-react'
import { transformToUnifiedData, createSampleUnifiedData } from '../../lib/utils/chartDataTransform'

export default function DashboardGrid() {
  const {
    state,
    isLoading,
    setSelectedTopic,
    refreshDashboard,
    // Individual data sources
    dashboardSummary,
    dashboardKeywords,
    dashboardPosts,
    // Individual loading states
    loadingSummary,
    loadingKeywords,
    loadingPosts,
    // Individual errors
    summaryError,
    keywordsError,
    postsError,
    // Individual refresh actions
    refreshSummary,
    refreshKeywords,
    refreshPosts,
  } = useDashboard()
  const { i18n } = useTranslation()

  // Use dashboard data from API instead of filteredData/mock
  const dashboardData = state.dashboardData

  const getTooltip = (key: string) => {
    const tooltips = {
      sov: {
        vi: 'Tỷ lệ phần trăm thảo luận về thương hiệu của bạn so với tổng số thảo luận của tất cả các thương hiệu được theo dõi trong cùng một dự án.',
        en: 'Percentage of discussions about your brand compared to total discussions of all tracked brands in the same project.'
      },
      sentiment: {
        vi: 'Chỉ số thể hiện cảm xúc ròng của cộng đồng đối với thương hiệu, được tính bằng tỷ lệ phần trăm thảo luận tích cực trừ đi tỷ lệ phần trăm thảo luận tiêu cực.',
        en: 'Index showing the net sentiment of the community towards the brand, calculated as the percentage of positive discussions minus the percentage of negative discussions.'
      },
      mentions: {
        vi: 'Tổng số lần thương hiệu được nhắc đến trên các nền tảng mạng xã hội trong khoảng thời gian được chọn.',
        en: 'Total number of times the brand is mentioned on social media platforms during the selected time period.'
      },
      engagement: {
        vi: 'Tỷ lệ tương tác của người dùng với nội dung thương hiệu, bao gồm like, share, comment và các hành động tương tác khác.',
        en: 'User interaction rate with brand content, including likes, shares, comments and other interactive actions.'
      },
      tti: {
        vi: 'Thời gian từ lúc người dùng thực hiện hành động yêu cầu thông tin cho đến khi họ nhìn thấy được kết quả hoặc insight tương ứng hiển thị trên hệ thống.',
        en: 'Time from when a user performs an action requesting information until they see the corresponding result or insight displayed on the system.'
      },
      confidence: {
        vi: 'Độ tin cậy của phân tích AI, thể hiện mức độ chính xác của kết quả phân tích dữ liệu.',
        en: 'AI analysis confidence level, indicating the accuracy of data analysis results.'
      }
    }

    const currentLang = i18n.language || 'vi'
    return tooltips[key as keyof typeof tooltips]?.[currentLang as keyof typeof tooltips[keyof typeof tooltips]] || tooltips[key as keyof typeof tooltips]?.vi
  }

  // Fallback to empty data if no dashboard data yet
  const data = dashboardData || {
    metrics: { sov: 0, sentiment: 0, mentions: 0, engagement: 0 },
    trends: [],
    sentiment: [],
    competitors: [],
    topics: [],
    content: [],
    viralPosts: [],
    salesFunnel: [],
  }

  const metrics = [
    {
      id: 'sov',
      title: 'Share of Voice',
      value: `${data.metrics.sov.toFixed(1)}%`,
      delta: '+2.3%',
      trend: 'up' as const,
      animation: 'counter' as const,
      color: 'text-blue-600',
      tooltip: getTooltip('sov')
    },
    {
      id: 'sentiment',
      title: 'Net Sentiment',
      value: data.metrics.sentiment > 0 ? `+${data.metrics.sentiment.toFixed(2)}` : data.metrics.sentiment.toFixed(2),
      delta: '-0.12',
      trend: data.metrics.sentiment > 0 ? 'up' as const : 'down' as const,
      animation: 'gauge' as const,
      color: data.metrics.sentiment > 0 ? 'text-green-600' : 'text-red-600',
      tooltip: getTooltip('sentiment')
    },
    {
      id: 'mentions',
      title: 'Total Mentions',
      value: data.metrics.mentions >= 1000 ? `${(data.metrics.mentions / 1000).toFixed(1)}K` : data.metrics.mentions.toString(),
      delta: '+12.3%',
      trend: 'up' as const,
      animation: 'counter' as const,
      color: 'text-purple-600',
      tooltip: getTooltip('mentions')
    },
    {
      id: 'engagement',
      title: 'Engagement Rate',
      value: `${data.metrics.engagement.toFixed(1)}%`,
      delta: '+0.3%',
      trend: 'up' as const,
      animation: 'progress' as const,
      color: 'text-orange-600',
      tooltip: getTooltip('engagement')
    }
  ]

  // Helper component: Metric Card Skeleton
  const MetricCardSkeleton = () => (
    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    </div>
  )

  // Helper component: Chart Skeleton
  const ChartSkeleton = ({ height = 'h-80' }: { height?: string }) => (
    <div className={`${height} bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg animate-pulse`} />
  )

  // Helper component: Error Banner with Retry
  const ErrorBanner = ({ error, onRetry, title }: { error: string; onRetry: () => void; title: string }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">{title}</h4>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )

  // Empty state (only show if no loading and no data at all)
  if (!loadingSummary && !loadingKeywords && !loadingPosts && !dashboardData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center h-96 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg">
          <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            No analyzed posts found for this project yet. Please run an analysis job or wait for data to be processed.
          </p>
        </div>
      </div>
    )
  }
  return (
    <>
    <div className="p-6 space-y-6">
      {/* Phase 1: Metrics Cards (from Summary API) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {loadingSummary ? (
          // Show skeleton while loading summary
          Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MetricCardSkeleton />
            </motion.div>
          ))
        ) : summaryError ? (
          // Show error banner if summary fails
          <div className="col-span-full">
            <ErrorBanner
              error={summaryError}
              onRetry={refreshSummary}
              title="Failed to load metrics"
            />
          </div>
        ) : (
          // Show actual metrics when loaded
          metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Phase 3: Unified Chart at the Top (from Posts API) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {loadingPosts ? (
          <ChartSkeleton height="h-80" />
        ) : postsError ? (
          <ErrorBanner
            error={postsError}
            onRetry={refreshPosts}
            title="Failed to load chart data"
          />
        ) : (
          <UnifiedChart
            title="Unified Analytics Dashboard"
            data={createSampleUnifiedData()}
            animation="line-draw"
            interaction="hover-only"
          />
        )}
      </motion.div>

      {/* Phase 2: TopicCloud & CompetitorChart (from Keywords & Posts API) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {loadingPosts ? (
            <ChartSkeleton height="h-80" />
          ) : postsError ? (
            <ErrorBanner
              error={postsError}
              onRetry={refreshPosts}
              title="Failed to load competitor data"
            />
          ) : data.competitors && data.competitors.length > 0 ? (
            <CompetitorChart
              title="Share of Voice Comparison"
              data={data.competitors}
              animation="bar-stack"
              interaction="drill-down"
            />
          ) : (
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6">
              <div className="flex items-center justify-center h-80">
                <div className="text-center">
                  <div className="text-gray-600 dark:text-gray-400 mb-2">No competitor data available</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Please check your data source</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {loadingKeywords ? (
            <ChartSkeleton height="h-80" />
          ) : keywordsError ? (
            <ErrorBanner
              error={keywordsError}
              onRetry={refreshKeywords}
              title="Failed to load keywords"
            />
          ) : (
            <TopicCloud
              title="Trending Topics"
              data={data.topics}
              animation="word-cloud"
              interaction="click-filter"
              onTopicClick={setSelectedTopic}
            />
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        {loadingPosts ? (
          <ChartSkeleton height="h-64" />
        ) : postsError ? (
          <ErrorBanner
            error={postsError}
            onRetry={refreshPosts}
            title="Failed to load sales funnel"
          />
        ) : (
          <SalesFunnel
            title="Sales Funnel (INTENT Tracking)"
            data={data.salesFunnel}
            animation="bar-grow"
            interaction="hover-details"
          />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        {loadingPosts ? (
          <ChartSkeleton height="h-96" />
        ) : postsError ? (
          <ErrorBanner
            error={postsError}
            onRetry={refreshPosts}
            title="Failed to load viral posts"
          />
        ) : (
          <TopViralPosts
            title="Top Viral Posts (by Impact Score)"
            data={data.viralPosts}
            animation="row-reveal"
            interaction="sort-filter"
          />
        )}
      </motion.div>

      {/* Revalidation Indicator */}
      {state.isDashboardRevalidating && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Updating data...</span>
        </div>
      )}
    </div>

    {}
    <TopicDetailModal
      topic={state.selectedTopic}
      isOpen={!!state.selectedTopic}
      onClose={() => setSelectedTopic(null)}
    />
  </>
  )
}
