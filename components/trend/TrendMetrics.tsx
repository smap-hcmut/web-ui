import React from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Hash,
  MessageSquare,
  Users,
  BarChart3,
  Target,
  Clock,
  Zap,
  AlertTriangle,
  Star
} from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useTrend } from '@/contexts/TrendContext'

export default function TrendMetrics() {
  const { t } = useTranslation('common')
  const { state, filteredTopics, filteredHashtags, filteredPosts, isUsingRealData } = useTrend()

  // Use metrics from state if available, otherwise calculate from filtered data
  const metrics = state.metrics

  const totalVolume = metrics?.totalVolume || filteredTopics.reduce((sum, topic) => sum + topic.volume, 0)
  const avgConfidence = metrics?.avgConfidence || (filteredTopics.length > 0
    ? filteredTopics.reduce((sum, topic) => sum + topic.confidence, 0) / filteredTopics.length
    : 0)
  const avgSentiment = metrics?.avgSentiment || (filteredTopics.length > 0
    ? filteredTopics.reduce((sum, topic) => sum + topic.sentiment.positive, 0) / filteredTopics.length
    : 0)
  const avgEngagementRate = metrics?.avgEngagementRate || (filteredHashtags.length > 0
    ? filteredHashtags.reduce((sum, hashtag) => sum + hashtag.engagementRate, 0) / filteredHashtags.length
    : 0)
  const viralCount = metrics?.viralPostsCount || 0
  const kolCount = metrics?.kolPostsCount || 0

  const metricCards = [
    {
      id: 'total-topics',
      title: t('trendAnalysis.activeTopics', 'Active Topics'),
      value: filteredTopics.length.toString(),
      delta: '+12%',
      trend: 'up' as const,
      icon: <Target className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      id: 'total-volume',
      title: t('trendAnalysis.totalVolume', 'Total Volume'),
      value: totalVolume >= 1000000 
        ? `${(totalVolume / 1000000).toFixed(1)}M` 
        : totalVolume >= 1000 
          ? `${(totalVolume / 1000).toFixed(1)}K` 
          : totalVolume.toString(),
      delta: '+8.3%',
      trend: 'up' as const,
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      id: 'avg-confidence',
      title: t('trendAnalysis.avgConfidence', 'Avg Confidence'),
      value: `${(avgConfidence * 100).toFixed(0)}%`,
      delta: '+2.1%',
      trend: 'up' as const,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      id: 'avg-sentiment',
      title: t('trendAnalysis.avgSentiment', 'Positive Sentiment'),
      value: `${avgSentiment.toFixed(0)}%`,
      delta: avgSentiment >= 50 ? '+5%' : '-3%',
      trend: avgSentiment >= 50 ? 'up' as const : 'down' as const,
      icon: <MessageSquare className="h-5 w-5" />,
      color: avgSentiment >= 50 ? 'text-green-600' : 'text-orange-600',
      bgColor: avgSentiment >= 50 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      id: 'hashtag-count',
      title: t('trendAnalysis.trendingHashtags', 'Trending Hashtags'),
      value: filteredHashtags.length.toString(),
      delta: '+15.7%',
      trend: 'up' as const,
      icon: <Hash className="h-5 w-5" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30'
    },
    {
      id: 'engagement-rate',
      title: t('trendAnalysis.engagementRate', 'Engagement Rate'),
      value: `${avgEngagementRate.toFixed(1)}%`,
      delta: '+0.8%',
      trend: 'up' as const,
      icon: <Users className="h-5 w-5" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
    }
  ]

  // Get top platform from metrics
  const topPlatform = metrics?.platformDistribution 
    ? Object.entries(metrics.platformDistribution).sort((a, b) => b[1] - a[1])[0]
    : null

  // Get risk summary
  const riskSummary = metrics?.riskDistribution || { low: 0, medium: 0, high: 0, critical: 0 }
  const totalRisk = riskSummary.low + riskSummary.medium + riskSummary.high + riskSummary.critical

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('trendAnalysis.trendOverview', 'Trend Overview')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isUsingRealData 
              ? t('trendAnalysis.realTimeInsights', 'Real-time insights from API data')
              : t('trendAnalysis.noDataAvailable', 'No data available')}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {state.lastUpdate 
              ? `${t('trendAnalysis.lastUpdated', 'Last updated')}: ${state.lastUpdate.toLocaleTimeString()}`
              : t('trendAnalysis.never', 'Never')}
          </span>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${metric.bgColor} ${metric.color}`}>
                {metric.icon}
              </div>
              <div className="flex items-center gap-1">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={`text-xs font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.delta}
                </span>
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Top Platform */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            {t('trendAnalysis.topPlatform', 'Top Platform')}
          </h4>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {topPlatform 
                ? `${topPlatform[0]} (${topPlatform[1]} posts)`
                : t('trendAnalysis.noData', 'No data')}
            </span>
          </div>
        </div>

        {/* Viral Posts */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            {t('trendAnalysis.viralPosts', 'Viral Posts')}
          </h4>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {viralCount} {t('trendAnalysis.viralDetected', 'viral detected')}
            </span>
          </div>
        </div>

        {/* KOL Posts */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            {t('trendAnalysis.kolPosts', 'KOL Posts')}
          </h4>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {kolCount} {t('trendAnalysis.fromInfluencers', 'from influencers')}
            </span>
          </div>
        </div>

        {/* Risk Summary */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            {t('trendAnalysis.riskSummary', 'Risk Summary')}
          </h4>
          {totalRisk > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${(riskSummary.low / totalRisk) * 100}%` }} 
                />
                <div 
                  className="h-full bg-yellow-500" 
                  style={{ width: `${(riskSummary.medium / totalRisk) * 100}%` }} 
                />
                <div 
                  className="h-full bg-orange-500" 
                  style={{ width: `${(riskSummary.high / totalRisk) * 100}%` }} 
                />
                <div 
                  className="h-full bg-red-500" 
                  style={{ width: `${(riskSummary.critical / totalRisk) * 100}%` }} 
                />
              </div>
              {(riskSummary.high + riskSummary.critical) > 0 && (
                <AlertTriangle className="h-4 w-4 text-orange-500 ml-2" />
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('trendAnalysis.noRiskData', 'No risk data')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
