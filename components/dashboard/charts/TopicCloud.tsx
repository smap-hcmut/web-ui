import { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Download, Maximize2, TrendingUp, Hash, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { useDashboard } from '@/contexts/DashboardContext'

interface TopicData {
  text: string
  value: number
  sentiment?: number
  confidence?: number
  trend?: 'rising' | 'falling' | 'stable'
  mentions?: number
  engagement?: number
}

interface KeywordData {
  keyword: string
  count: number
  avg_sentiment_score: number
  aspect: string | null
}

interface TopicCloudProps {
  title: string
  data: TopicData[]
  onTopicClick?: (topic: TopicData) => void
}

// Aspect color mapping
const ASPECT_COLORS = {
  PRICE: '#f59e0b',        // Orange
  PERFORMANCE: '#3b82f6',  // Blue
  DESIGN: '#8b5cf6',       // Purple
  SERVICE: '#10b981',      // Green
  null: '#6b7280',         // Gray
} as const

interface WordDisplay {
  text: string
  value: number
  fontSize: number
  color: string
  sentiment?: number
  trend?: 'rising' | 'falling' | 'stable'
  mentions?: number
  aspect?: string | null
  left: number
  top: number
}

export default function TopicCloud({
  title,
  data,
  onTopicClick
}: TopicCloudProps) {
  // Get keywords from API
  const { dashboardKeywords } = useDashboard()

  // Use API keywords if available, fallback to props data
  const keywordsFromAPI: KeywordData[] = useMemo(() =>
    dashboardKeywords?.keywords || [], [dashboardKeywords?.keywords]
  )
  const shouldUseAPI = keywordsFromAPI.length > 0

  // Convert API keywords to TopicData format
  const apiTopicData: TopicData[] = useMemo(() =>
    keywordsFromAPI.map((kw: KeywordData) => ({
      text: kw.keyword,
      value: kw.count,
      sentiment: kw.avg_sentiment_score,
      mentions: kw.count,
      trend: kw.avg_sentiment_score > 0.1 ? 'rising' : kw.avg_sentiment_score < -0.1 ? 'falling' : 'stable'
    })), [keywordsFromAPI]
  )

  // Use API data if available, otherwise fallback to props or create sample data
  const displayData = useMemo(() =>
    shouldUseAPI && apiTopicData.length > 0
      ? apiTopicData
      : data.length > 0
        ? data
        : [
            // Sample data to always show something
            { text: 'Loading...', value: 10, sentiment: 0, trend: 'stable' as const, mentions: 10, engagement: 0 },
            { text: 'Keywords', value: 8, sentiment: 0.2, trend: 'rising' as const, mentions: 8, engagement: 15 },
            { text: 'Analysis', value: 6, sentiment: -0.1, trend: 'falling' as const, mentions: 6, engagement: 8 },
            { text: 'Trending', value: 5, sentiment: 0.3, trend: 'rising' as const, mentions: 5, engagement: 20 },
            { text: 'Topics', value: 4, sentiment: 0.1, trend: 'stable' as const, mentions: 4, engagement: 12 },
          ], [shouldUseAPI, apiTopicData, data]
  )

  const getColorByAspect = useCallback((keyword: string): string => {
    if (!shouldUseAPI) {
      // Fallback: sentiment-based colors
      const item = data.find(d => d.text === keyword)
      const sentiment = item?.sentiment || 0
      if (sentiment > 0.3) return '#10b981' // Green for very positive
      if (sentiment > 0.1) return '#34d399' // Light green for positive
      if (sentiment < -0.3) return '#ef4444' // Red for very negative
      if (sentiment < -0.1) return '#f87171' // Light red for negative
      return '#6b7280' // Gray for neutral
    }

    // API mode: aspect-based colors
    const apiKeyword = keywordsFromAPI.find((kw: KeywordData) => kw.keyword === keyword)
    const aspect = apiKeyword?.aspect as keyof typeof ASPECT_COLORS | undefined
    return aspect ? ASPECT_COLORS[aspect] : ASPECT_COLORS.null
  }, [shouldUseAPI, data, keywordsFromAPI])

  // Transform data for custom word cloud with collision-free positioning
  const words: WordDisplay[] = useMemo(() => {
    const sortedData = [...displayData]
      .filter(item => item.text && item.text.trim().length > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 30)

    if (sortedData.length === 0) {
      return []
    }

    // Calculate font sizes
    const maxValue = Math.max(...sortedData.map(d => d.value))
    const minValue = Math.min(...sortedData.map(d => d.value))
    const range = maxValue - minValue || 1

    // Create grid-based packed layout with collision detection
    const words: WordDisplay[] = []
    const occupiedSpaces: Array<{ left: number; top: number; width: number; height: number }> = []

    // Shuffle array deterministically based on text content for natural look
    const shuffledData = [...sortedData].sort((a, b) => {
      const seedA = a.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const seedB = b.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return seedA - seedB
    })

    // Grid configuration
    const maxWidth = 95 // Maximum width (percentage)
    const maxHeight = 85 // Maximum height (percentage)
    const minSpacing = 3 // Minimum spacing between words (percentage)

    // Helper function to check collision with existing words
    const checkCollision = (left: number, top: number, width: number, height: number): boolean => {
      return occupiedSpaces.some((space) => {
        const horizontalOverlap =
          left - width / 2 < space.left + space.width / 2 + minSpacing &&
          left + width / 2 + minSpacing > space.left - space.width / 2
        const verticalOverlap =
          top - height / 2 < space.top + space.height / 2 + minSpacing &&
          top + height / 2 + minSpacing > space.top - space.height / 2
        return horizontalOverlap && verticalOverlap
      })
    }

    // Helper function to find available position using spiral search
    const findPosition = (width: number, height: number): { left: number; top: number } | null => {
      // Start from center
      const centerX = 50
      const centerY = 45

      // Spiral search parameters
      const angleStep = 0.5 // Radians to rotate per step
      const radiusStep = 2 // Percentage units to expand radius per step
      let radius = 0
      let angle = 0
      const maxAttempts = 500

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const left = centerX + radius * Math.cos(angle)
        const top = centerY + radius * Math.sin(angle)

        // Check if within bounds
        if (
          left - width / 2 >= 0 &&
          left + width / 2 <= maxWidth &&
          top - height / 2 >= 5 &&
          top + height / 2 <= maxHeight
        ) {
          // Check collision
          if (!checkCollision(left, top, width, height)) {
            return { left, top }
          }
        }

        // Update spiral
        angle += angleStep
        radius += radiusStep
      }

      return null // No position found
    }

    shuffledData.forEach((item) => {
      const apiKeyword = shouldUseAPI
        ? keywordsFromAPI.find((kw: KeywordData) => kw.keyword === item.text)
        : null

      // Font size calculation: 16px to 44px range (slightly reduced for better fit)
      const normalizedValue = (item.value - minValue) / range
      const fontSize = Math.floor(16 + normalizedValue * 28)

      // Improved word dimension estimation (percentage of container)
      // Average character width is approximately 0.6 of font size
      const estimatedWidth = item.text.length * fontSize * 0.08 // In percentage units
      const estimatedHeight = fontSize * 0.15 // In percentage units

      // Find non-colliding position
      const position = findPosition(estimatedWidth, estimatedHeight)

      if (position) {
        words.push({
          text: item.text.trim(),
          value: item.value,
          fontSize,
          color: getColorByAspect(item.text),
          sentiment: item.sentiment || 0,
          trend: item.trend || 'stable',
          mentions: item.mentions || item.value,
          aspect: apiKeyword?.aspect || null,
          left: position.left,
          top: position.top,
        })

        // Mark space as occupied
        occupiedSpaces.push({
          left: position.left,
          top: position.top,
          width: estimatedWidth,
          height: estimatedHeight,
        })
      }
    })

    return words
  }, [displayData, shouldUseAPI, keywordsFromAPI, getColorByAspect])

  const topTopics = [...displayData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-2"
          >
            <Hash className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              {displayData.length} keywords
            </span>
          </motion.div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="relative h-80 w-full mb-6 overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-800">
        {words.length > 0 ? (
          <div className="relative w-full h-full">
            {words.map((word, index) => (
              <motion.button
                key={`${word.text}-${index}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform font-semibold select-none"
                style={{
                  left: `${word.left}%`,
                  top: `${word.top}%`,
                  fontSize: `${word.fontSize}px`,
                  color: word.color,
                }}
                onClick={() => {
                  if (onTopicClick) {
                    const topicData: TopicData = {
                      text: word.text,
                      value: word.value,
                      sentiment: word.sentiment,
                      trend: word.trend,
                      mentions: word.mentions,
                    }
                    onTopicClick(topicData)
                  }
                }}
                title={`${word.text}${word.aspect ? ` - ${word.aspect}` : ''}\nSentiment: ${word.sentiment?.toFixed(2) || 0}\nCount: ${word.value}\nMentions: ${word.mentions}\nTrend: ${word.trend}\nClick to view details`}
              >
                {word.text}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No keywords available</p>
          </div>
        )}
      </div>

      {/* Aspect Legend - only show when using API data */}
      {shouldUseAPI && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center gap-4 mb-6 flex-wrap"
        >
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Aspects:</span>
          {Object.entries(ASPECT_COLORS)
            .filter(([key]) => key !== 'null')
            .map(([aspect, color]) => (
              <div key={aspect} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{aspect}</span>
              </div>
            ))}
        </motion.div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Top Trending Keywords
          </h4>
        </div>

        {topTopics.map((topic, index) => {
          const apiKeyword = shouldUseAPI
            ? keywordsFromAPI.find((kw: KeywordData) => kw.keyword === topic.text)
            : null
          const aspectColor = getColorByAspect(topic.text)

          // Get trend icon
          const getTrendIcon = (trend?: string) => {
            switch (trend) {
              case 'rising':
                return <ArrowUp className="h-3 w-3 text-green-600" />
              case 'falling':
                return <ArrowDown className="h-3 w-3 text-red-600" />
              default:
                return <Minus className="h-3 w-3 text-gray-600" />
            }
          }

          return (
            <motion.div
              key={topic.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 + index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-md bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => onTopicClick && onTopicClick(topic)}
            >
              <div className="flex items-center gap-3">
                {/* Ranking Number */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300">
                  #{index + 1}
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: aspectColor }}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {topic.text}
                    </span>
                    {getTrendIcon(topic.trend)}
                  </div>
                  {shouldUseAPI && apiKeyword?.aspect && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {apiKeyword.aspect}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {topic.mentions || topic.value} mentions
                </div>
                {topic.sentiment !== undefined && (
                  <div
                    className={`text-sm font-medium ${
                      topic.sentiment > 0 ? 'text-green-600' : topic.sentiment < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}
                  >
                    {topic.sentiment > 0 ? '+' : ''}{topic.sentiment.toFixed(2)}
                  </div>
                )}
                {topic.confidence !== undefined && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(topic.confidence * 100)}% confidence
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
