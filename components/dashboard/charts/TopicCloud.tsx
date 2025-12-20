import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Maximize2, TrendingUp, Hash } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { WordCloudController, WordElement } from 'chartjs-chart-wordcloud'
import { useDashboard } from '@/contexts/DashboardContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  WordCloudController,
  WordElement
)

interface TopicData {
  text: string
  value: number
  sentiment?: number
  confidence?: number
  trend?: 'rising' | 'falling' | 'stable'
  mentions?: number
  engagement?: number
}

interface TopicCloudProps {
  title: string
  data: TopicData[]
  animation?: 'word-cloud' | 'fade-in'
  interaction?: 'click-filter' | 'hover-only'
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

export default function TopicCloud({
  title,
  data,
  animation = 'word-cloud',
  interaction = 'click-filter',
  onTopicClick
}: TopicCloudProps) {
  const chartRef = useRef<ChartJS<'wordCloud', any, string> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [canvasKey, setCanvasKey] = useState(0)
  const [renderFallback, setRenderFallback] = useState(false)

  // Get keywords from API
  const { dashboardKeywords } = useDashboard()

  // Use API keywords if available, fallback to props data
  const keywordsFromAPI = dashboardKeywords?.keywords || []
  const shouldUseAPI = keywordsFromAPI.length > 0

  // Convert API keywords to TopicData format
  const apiTopicData: TopicData[] = keywordsFromAPI.map(kw => ({
    text: kw.keyword,
    value: kw.count,
    sentiment: kw.avg_sentiment_score,
  }))

  // Use API data if available, otherwise fallback to props
  const displayData = shouldUseAPI ? apiTopicData : data

  const getColorByAspect = (keyword: string): string => {
    if (!shouldUseAPI) {
      // Fallback: sentiment-based colors
      const item = data.find(d => d.text === keyword)
      const sentiment = item?.sentiment || 0
      if (sentiment > 0.3) return '#10b981'
      if (sentiment > 0.1) return '#34d399'
      if (sentiment < -0.3) return '#ef4444'
      if (sentiment < -0.1) return '#f87171'
      return '#6b7280'
    }

    // API mode: aspect-based colors
    const apiKeyword = keywordsFromAPI.find(kw => kw.keyword === keyword)
    const aspect = apiKeyword?.aspect as keyof typeof ASPECT_COLORS | undefined
    return aspect ? ASPECT_COLORS[aspect] : ASPECT_COLORS.null
  }

  useEffect(() => {
    if (!displayData.length) return

    setRenderFallback(false)
    setCanvasKey(prev => prev + 1)
  }, [displayData, dashboardKeywords])

  useEffect(() => {
    if (!canvasRef.current || !displayData.length) {
      setRenderFallback(true)
      return
    }

    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    const sortedData = [...displayData]
      .filter(item => item.text && item.text.trim().length > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 50)

    if (sortedData.length === 0) {
      setRenderFallback(true)
      return
    }

    const words = sortedData.map(item => ({
      text: item.text.trim(),
      weight: Math.max(1, Math.min(item.value, 50)),
      sentiment: item.sentiment || 0,
      trend: item.trend || 'stable',
      mentions: item.mentions || 0,
      engagement: item.engagement || 0,
      color: getColorByAspect(item.text)
    }))

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      try {
        chartRef.current = new ChartJS(canvasRef.current, {
        type: 'wordCloud',
        data: {
          labels: words.map(d => d.text),
          datasets: [
            {
              label: '',
              data: words.map(d => ({
                x: d.text,
                y: d.weight
              })),
              color: words.map(d => d.color),
              size: (ctx: any) => {
                const value = ctx.parsed.y
                return Math.max(12, Math.min(value * 2, 48))
              },
              rotation: () => Math.random() > 0.5 ? 0 : 90,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              padding: 2,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (event, elements) => {
            if (elements.length > 0 && onTopicClick && interaction === 'click-filter') {
              const elementIndex = elements[0].index
              const clickedTopic = sortedData[elementIndex]
              if (clickedTopic) {
                onTopicClick(clickedTopic)
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: (context) => {
                  const index = context[0].dataIndex
                  return words[index]?.text || ''
                },
                label: (context) => {
                  const index = context.dataIndex
                  const word = words[index]
                  if (!word) return []

                  const lines = []

                  // Show aspect if using API data
                  if (shouldUseAPI) {
                    const apiKeyword = keywordsFromAPI.find(kw => kw.keyword === word.text)
                    if (apiKeyword?.aspect) {
                      lines.push(`Aspect: ${apiKeyword.aspect}`)
                    }
                  }

                  lines.push(
                    `Sentiment: ${word.sentiment > 0 ? '+' : ''}${word.sentiment.toFixed(2)}`,
                    `Count: ${word.weight}`,
                    `Mentions: ${word.mentions}`,
                    `Engagement: ${word.engagement}`
                  )

                  if (interaction === 'click-filter') {
                    lines.push('Click to view details')
                  }

                  return lines.filter(Boolean)
                }
              }
            }
          },
          scales: {
            x: {
              display: false
            },
            y: {
              display: false
            }
          }
        }
      })
      } catch (error) {
        console.warn('WordCloud rendering failed:', error)
        setRenderFallback(true)
      }
    }, 50)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasKey, displayData, dashboardKeywords, shouldUseAPI, keywordsFromAPI])

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
        {renderFallback ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-600 dark:text-gray-400 mb-2">📊</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Word cloud unavailable</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Showing top topics below</div>
            </div>
          </div>
        ) : (
          <canvas
            key={canvasKey}
            ref={canvasRef}
            className={`w-full h-full ${
              interaction === 'click-filter' && onTopicClick ? 'cursor-pointer' : ''
            }`}
          />
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
            ? keywordsFromAPI.find(kw => kw.keyword === topic.text)
            : null
          const aspectColor = getColorByAspect(topic.text)

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
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: aspectColor }}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {topic.text}
                  </span>
                  {shouldUseAPI && apiKeyword?.aspect && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {apiKeyword.aspect}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {topic.value} mentions
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
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
