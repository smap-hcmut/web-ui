import { useState, useMemo, Component, ErrorInfo, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Scatter,
  ScatterChart,
  Cell,
  ZAxis
} from 'recharts'
import {
  MoreHorizontal,
  Download,
  Maximize2,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  ChevronDown,
  X,
  Loader2,
  RefreshCw,
  Database
} from 'lucide-react'
import { useResponsive } from '../../../hooks/useResponsive'

// Type definitions for the unified chart data structure
export interface CriticalEvent {
  id: string
  timestamp: number
  impact_score: number
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  platform: string
}

export interface SentimentBreakdown {
  positive: number
  negative: number
  neutral: number
}

export interface UnifiedChartData {
  date: string
  mentions: number
  sentiment: SentimentBreakdown
  criticalEvents?: CriticalEvent[]
}

export interface UnifiedChartProps {
  title: string
  data: UnifiedChartData[]
  animation?: 'line-draw' | 'fade-in'
  interaction?: 'zoom-pan' | 'hover-only'
  onExport?: () => void
  onFullscreen?: () => void
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}

// Custom tooltip component that shows sentiment breakdown
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as UnifiedChartData
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 border border-amber-300/60 dark:border-white/20 rounded-lg p-2 sm:p-3 shadow-lg max-w-xs text-xs sm:text-sm"
      >
        <p className="text-sm font-medium mb-2 text-gray-900 dark:text-white">{label}</p>
        
        {/* Mention data */}
        <div className="flex items-center gap-2 text-sm mb-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Mentions:</span>
          <span className="font-medium text-gray-900 dark:text-white">{data.mentions.toLocaleString()}</span>
        </div>

        {/* Sentiment breakdown */}
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="font-medium text-gray-900 dark:text-white mb-1">Sentiment Breakdown:</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Positive: {data.sentiment.positive}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span>Neutral: {data.sentiment.neutral}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Negative: {data.sentiment.negative}%</span>
          </div>
        </div>

        {/* Critical events for this date */}
        {data.criticalEvents && data.criticalEvents.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-900 dark:text-white mb-1">
              Critical Events ({data.criticalEvents.length}):
            </div>
            {data.criticalEvents.slice(0, 2).map((event) => (
              <div key={event.id} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                <div className="flex items-center gap-1">
                  {event.risk === 'CRITICAL' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                  {event.risk === 'HIGH' && <AlertCircle className="h-3 w-3 text-orange-500" />}
                  {event.risk === 'MEDIUM' && <Info className="h-3 w-3 text-yellow-500" />}
                  {event.risk === 'LOW' && <Info className="h-3 w-3 text-blue-500" />}
                  <span className="font-medium">{event.risk}</span>
                </div>
                <div className="truncate">{event.title}</div>
              </div>
            ))}
            {data.criticalEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{data.criticalEvents.length - 2} more...
              </div>
            )}
          </div>
        )}
      </motion.div>
    )
  }
  return null
}

// Helper function to get risk color for critical events
const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'CRITICAL':
      return '#ef4444' // red-500
    case 'HIGH':
      return '#f97316' // orange-500
    case 'MEDIUM':
      return '#eab308' // yellow-500
    case 'LOW':
      return '#3b82f6' // blue-500
    default:
      return '#6b7280' // gray-500
  }
}

// Error boundary for chart rendering failures
interface ChartErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ChartErrorBoundary extends Component<
  { children: ReactNode; onRetry?: () => void },
  ChartErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onRetry?: () => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chart rendering error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-80 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Chart Rendering Error
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center max-w-md">
            There was an error rendering the chart. This might be due to invalid data or a temporary issue.
          </p>
          {this.props.onRetry && (
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                this.props.onRetry?.()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// Data validation helpers
const validateChartData = (data: UnifiedChartData[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!Array.isArray(data)) {
    errors.push('Data must be an array')
    return { isValid: false, errors }
  }

  if (data.length === 0) {
    return { isValid: true, errors: [] } // Empty data is valid, will show empty state
  }

  data.forEach((item, index) => {
    if (!item.date) {
      errors.push(`Item ${index}: Missing date field`)
    } else if (isNaN(new Date(item.date).getTime())) {
      errors.push(`Item ${index}: Invalid date format`)
    }

    if (typeof item.mentions !== 'number' || item.mentions < 0) {
      errors.push(`Item ${index}: Invalid mentions value`)
    }

    if (item.sentiment) {
      const { positive, negative, neutral } = item.sentiment
      if (
        typeof positive !== 'number' ||
        typeof negative !== 'number' ||
        typeof neutral !== 'number' ||
        positive < 0 || negative < 0 || neutral < 0 ||
        positive > 100 || negative > 100 || neutral > 100
      ) {
        errors.push(`Item ${index}: Invalid sentiment values`)
      }
    }

    if (item.criticalEvents) {
      if (!Array.isArray(item.criticalEvents)) {
        errors.push(`Item ${index}: Critical events must be an array`)
      } else {
        item.criticalEvents.forEach((event, eventIndex) => {
          if (!event.id || !event.title || !event.risk) {
            errors.push(`Item ${index}, Event ${eventIndex}: Missing required fields`)
          }
        })
      }
    }
  })

  return { isValid: errors.length === 0, errors }
}

// Sanitize data by providing defaults for missing values
const sanitizeChartData = (data: UnifiedChartData[]): UnifiedChartData[] => {
  return data.map(item => ({
    date: item.date || new Date().toISOString(),
    mentions: typeof item.mentions === 'number' && item.mentions >= 0 ? item.mentions : 0,
    sentiment: item.sentiment ? {
      positive: Math.max(0, Math.min(100, item.sentiment.positive || 0)),
      negative: Math.max(0, Math.min(100, item.sentiment.negative || 0)),
      neutral: Math.max(0, Math.min(100, item.sentiment.neutral || 0))
    } : { positive: 0, negative: 0, neutral: 100 },
    criticalEvents: Array.isArray(item.criticalEvents) ? item.criticalEvents.filter(event => 
      event.id && event.title && event.risk
    ) : []
  }))
}

// Loading component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-80 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Loading Chart Data
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Please wait while we process your analytics data...
    </p>
  </div>
)

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-80 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
    <Database className="h-12 w-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      No Data Available
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
      There&apos;s no data to display for the selected time range. Try adjusting your filters or check back later.
    </p>
  </div>
)

// Error state component
const ErrorState = ({ error, onRetry }: { error: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center h-80 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-dashed border-red-300 dark:border-red-600">
    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Data Error
    </h3>
    <p className="text-sm text-red-600 dark:text-red-400 mb-4 text-center max-w-md">
      {error}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    )}
  </div>
)

// Time range options
const TIME_RANGES = [
  { value: '7d', label: 'Last 7 Days', days: 7 },
  { value: '30d', label: 'Last 30 Days', days: 30 },
  { value: '90d', label: 'Last 90 Days', days: 90 },
  { value: '1y', label: 'Last Year', days: 365 },
  { value: 'all', label: 'All Time', days: null }
]

export default function UnifiedChart({
  title,
  data,
  animation = 'line-draw',
  interaction = 'hover-only',
  onExport,
  onFullscreen,
  isLoading = false,
  error = null,
  onRetry
}: UnifiedChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('area')
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [isTimeRangeOpen, setIsTimeRangeOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Responsive state
  const { isMobile, isTablet, screenWidth, breakpoint } = useResponsive()

  // Validate and sanitize data
  const { validatedData, dataError } = useMemo(() => {
    if (!data) {
      return { validatedData: [], dataError: null }
    }

    const validation = validateChartData(data)
    if (!validation.isValid) {
      return { 
        validatedData: [], 
        dataError: `Data validation failed: ${validation.errors.join(', ')}` 
      }
    }

    return { 
      validatedData: sanitizeChartData(data), 
      dataError: null 
    }
  }, [data])

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (selectedTimeRange === 'all') {
      return validatedData
    }

    const range = TIME_RANGES.find(r => r.value === selectedTimeRange)
    if (!range || !range.days) {
      return validatedData
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - range.days)

    return validatedData.filter(dataPoint => {
      const pointDate = new Date(dataPoint.date)
      return pointDate >= cutoffDate
    })
  }, [validatedData, selectedTimeRange])

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem)
    // Use shorter format on mobile devices
    if (isMobile) {
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Responsive chart dimensions
  const getChartHeight = () => {
    if (isFullscreen) return 'h-screen'
    if (isMobile) return 'h-64' // Shorter on mobile
    if (isTablet) return 'h-72' // Medium on tablet
    return 'h-80' // Full height on desktop
  }

  // Responsive font sizes
  const getAxisFontSize = () => {
    if (isMobile) return 10
    if (isTablet) return 11
    return 12
  }

  // Touch-friendly interaction settings
  const getInteractionProps = () => {
    if (isMobile) {
      return {
        allowDeactivation: false, // Prevent accidental deactivation on touch
        activationTolerance: 8, // Larger touch target
      }
    }
    return {}
  }

  const getLatestChange = () => {
    if (filteredData.length < 2) return { change: 0, trend: 'neutral' }

    const latest = filteredData[filteredData.length - 1]
    const previous = filteredData[filteredData.length - 2]
    const change = ((latest.mentions - previous.mentions) / previous.mentions) * 100

    return {
      change: Math.abs(change),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    }
  }

  const { change, trend } = getLatestChange()

  // Flatten critical events for scatter plot overlay
  const criticalEventsForScatter = filteredData.flatMap(dataPoint => 
    (dataPoint.criticalEvents || []).map(event => ({
      ...event,
      date: dataPoint.date,
      mentions: dataPoint.mentions,
      x: new Date(dataPoint.date).getTime(),
      y: dataPoint.mentions,
      // Add size based on impact score for better visualization
      size: Math.max(6, Math.min(12, event.impact_score / 10))
    }))
  )

  // Handle export functionality
  const handleExport = () => {
    if (onExport) {
      onExport()
    } else {
      // Default export behavior - download as JSON
      const dataStr = JSON.stringify(filteredData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-data.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  // Handle fullscreen functionality
  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen()
    } else {
      setIsFullscreen(!isFullscreen)
    }
  }

  // Handle time range selection
  const handleTimeRangeSelect = (range: string) => {
    setSelectedTimeRange(range)
    setIsTimeRangeOpen(false)
  }

  const selectedRangeLabel = TIME_RANGES.find(r => r.value === selectedTimeRange)?.label || 'Select Range'

  // Handle loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6 ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        <LoadingState />
      </motion.div>
    )
  }

  // Handle error states
  if (error || dataError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6 ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        <ErrorState error={error || dataError || 'Unknown error'} onRetry={onRetry} />
      </motion.div>
    )
  }

  // Handle empty data state
  if (!filteredData || filteredData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6 ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {/* Time Range Selector - still functional in empty state */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsTimeRangeOpen(!isTimeRangeOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
              >
                <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {TIME_RANGES.find(r => r.value === selectedTimeRange)?.label || 'Select Range'}
                </span>
                <ChevronDown className={`h-3 w-3 text-gray-600 dark:text-gray-400 transition-transform ${isTimeRangeOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {isTimeRangeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50"
                  >
                    <div className="p-2">
                      {TIME_RANGES.map((range) => (
                        <motion.button
                          key={range.value}
                          whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                          onClick={() => handleTimeRangeSelect(range.value)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                            range.value === selectedTimeRange
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <Calendar className="h-4 w-4" />
                          <span>{range.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Backdrop to close dropdown */}
              <AnimatePresence>
                {isTimeRangeOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsTimeRangeOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <EmptyState />
      </motion.div>
    )
  }

  return (
    <ChartErrorBoundary onRetry={onRetry}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6 ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
        }`}
      >
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mb-6`}>
        <div className={`flex items-center ${isMobile ? 'justify-between' : 'gap-4'}`}>
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}
          >
            {title}
          </motion.h3>

          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2"
            >
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : null}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' :
                trend === 'down' ? 'text-red-600' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {change.toFixed(1)}% vs previous
              </span>
            </motion.div>
          )}
        </div>

        {/* Mobile trend indicator */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 self-start"
          >
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ) : null}
            <span className={`text-xs font-medium ${
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-600' :
              'text-gray-600 dark:text-gray-400'
            }`}>
              {change.toFixed(1)}% vs previous
            </span>
          </motion.div>
        )}

        <div className={`flex items-center ${isMobile ? 'flex-wrap' : ''} gap-2`}>
          {/* Time Range Selector */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsTimeRangeOpen(!isTimeRangeOpen)}
              className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1' : 'px-3 py-2'} bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors`}
            >
              <Calendar className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-600 dark:text-gray-400`} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900 dark:text-white ${isMobile ? 'hidden sm:inline' : ''}`}>
                {isMobile ? TIME_RANGES.find(r => r.value === selectedTimeRange)?.label.split(' ')[1] || selectedRangeLabel : selectedRangeLabel}
              </span>
              <ChevronDown className={`${isMobile ? 'h-2 w-2' : 'h-3 w-3'} text-gray-600 dark:text-gray-400 transition-transform ${isTimeRangeOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {isTimeRangeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50"
                >
                  <div className="p-2">
                    {TIME_RANGES.map((range) => (
                      <motion.button
                        key={range.value}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                        onClick={() => handleTimeRangeSelect(range.value)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                          range.value === selectedTimeRange
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        <span>{range.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Backdrop to close dropdown */}
            <AnimatePresence>
              {isTimeRangeOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsTimeRangeOpen(false)}
                  className="fixed inset-0 z-40"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Chart type toggle */}
          <div className={`flex items-center bg-gray-200 dark:bg-gray-700 rounded-md ${isMobile ? 'p-0.5' : 'p-1'}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('area')}
              className={`${isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'} font-medium rounded-md transition-colors ${
                chartType === 'area'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Area
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('line')}
              className={`${isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'} font-medium rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Line
            </motion.button>
          </div>

          {/* Control buttons */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400`}
            title="Export data"
          >
            <Download className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFullscreen}
            className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400`}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <X className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} /> : <Maximize2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />}
          </motion.button>
        </div>
      </div>

      {/* Chart */}
      <div className={`${getChartHeight()} w-full`}>
        <ResponsiveContainer 
          width="100%" 
          height="100%" 
          minHeight={isMobile ? 200 : 300}
        >
          {chartType === 'area' ? (
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="unifiedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: getAxisFontSize(), fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={formatXAxisLabel}
                interval={isMobile ? 'preserveStartEnd' : 'preserveStart'}
                minTickGap={isMobile ? 30 : 20}
              />
              <YAxis
                tick={{ fontSize: getAxisFontSize(), fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => isMobile ? `${(value / 1000).toFixed(0)}k` : value.toLocaleString()}
                width={isMobile ? 40 : 60}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="mentions"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#unifiedGradient)"
                animationDuration={2000}
                animationEasing="ease-out"
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  const criticalEvents = payload?.criticalEvents || []
                  
                  if (criticalEvents.length === 0) return null
                  
                  return (
                    <g>
                      {criticalEvents.map((event: CriticalEvent, index: number) => (
                        <circle
                          key={`critical-dot-${event.id}-${index}`}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={getRiskColor(event.risk)}
                          stroke="#fff"
                          strokeWidth={2}
                          className="cursor-pointer"
                        />
                      ))}
                    </g>
                  )
                }}
              />
            </AreaChart>
          ) : (
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: getAxisFontSize(), fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={formatXAxisLabel}
                interval={isMobile ? 'preserveStartEnd' : 'preserveStart'}
                minTickGap={isMobile ? 30 : 20}
              />
              <YAxis
                tick={{ fontSize: getAxisFontSize(), fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => isMobile ? `${(value / 1000).toFixed(0)}k` : value.toLocaleString()}
                width={isMobile ? 40 : 60}
              />

              <Tooltip content={<CustomTooltip />} />

              <Line
                type="monotone"
                dataKey="mentions"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  const criticalEvents = payload?.criticalEvents || []
                  
                  // Always show the regular line dot
                  const regularDot = (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="#3b82f6"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  )
                  
                  if (criticalEvents.length === 0) {
                    return regularDot
                  }
                  
                  return (
                    <g>
                      {regularDot}
                      {criticalEvents.map((event: CriticalEvent, index: number) => (
                        <circle
                          key={`critical-dot-${event.id}-${index}`}
                          cx={cx}
                          cy={cy}
                          r={8}
                          fill={getRiskColor(event.risk)}
                          stroke="#fff"
                          strokeWidth={2}
                          className="cursor-pointer"
                          opacity={0.9}
                        />
                      ))}
                    </g>
                  )
                }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
    </ChartErrorBoundary>
  )
}