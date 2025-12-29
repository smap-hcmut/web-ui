import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import {
  MoreHorizontal,
  Download,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react'
import { CompetitorData } from '@/lib/utils/dashboardDataTransform'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
)

type SOVMetric = 'weighted' | 'volume' | 'engagement'

interface CompetitorChartProps {
  title: string
  data: CompetitorData[]
  animation?: 'bar-stack' | 'fade-in'
  interaction?: 'drill-down' | 'hover-only'
}

const createCustomTooltip = (sovMetric: SOVMetric) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  titleColor: '#374151',
  bodyColor: '#6b7280',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  cornerRadius: 8,
  displayColors: false,
  titleFont: {
    size: 14,
    weight: 'bold' as const
  },
  bodyFont: {
    size: 12
  },
  padding: 12,
  callbacks: {
    title: (context: any) => {
      return context[0]?.label || ''
    },
    label: (context: any) => {
      const dataIndex = context.dataIndex
      const brandData = context.chart.data.datasets[0].brandData[dataIndex]

      const metricLabels = {
        weighted: 'Weighted SOV',
        volume: 'Volume SOV',
        engagement: 'Engagement SOV'
      }

      return [
        `${metricLabels[sovMetric]}: ${brandData.currentSOV.toFixed(2)}%`,
        `Rank: #${brandData.rank}`,
        '',
        'All Metrics:',
        `  Volume: ${brandData.sovVolume.toFixed(2)}%`,
        `  Engagement: ${brandData.sovEngagement.toFixed(2)}%`,
        `  Weighted: ${brandData.sovWeighted.toFixed(2)}%`,
        '',
        `Posts: ${brandData.postCount}`,
        `Total Engagement: ${brandData.totalEngagement.toLocaleString()}`
      ]
    }
  }
})

export default function CompetitorChart({
  title,
  data,
  animation = 'bar-stack',
  interaction = 'hover-only'
}: CompetitorChartProps) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'sov' | 'alphabetical'>('sov')
  const [sovMetric, setSOVMetric] = useState<SOVMetric>('weighted')
  const chartRef = useRef<ChartJS<'bar'>>(null)

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6"
      >
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="text-gray-600 dark:text-gray-400 mb-2">No competitor data available</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Please check your data source</div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Get SOV value based on selected metric
  const getSOVValue = (item: CompetitorData): number => {
    switch (sovMetric) {
      case 'volume':
        return item.sovVolume
      case 'engagement':
        return item.sovEngagement
      case 'weighted':
      default:
        return item.sovWeighted
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'sov') {
      return getSOVValue(b) - getSOVValue(a)
    } else {
      return a.brand.localeCompare(b.brand)
    }
  })

  const rankedData = sortedData.map((item, index) => ({
    ...item,
    rank: index + 1,
    currentSOV: Math.max(0, getSOVValue(item))
  }))

  const chartData = {
    labels: rankedData.map(item => item.brand),
    datasets: [
      {
        label: 'Share of Voice (%)',
        data: rankedData.map(item => item.currentSOV),
        backgroundColor: rankedData.map(item => item.color),
        borderColor: rankedData.map(item => item.color),
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
        brandData: rankedData
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: createCustomTooltip(sovMetric)
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(217, 119, 6, 0.1)'
        },
        ticks: {
          color: '#92400e',
          font: {
            size: 12
          },
          callback: function(value) {
            return `${value}%`
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#92400e',
          font: {
            size: 12
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && interaction === 'drill-down') {
        const elementIndex = elements[0].index
        const brand = rankedData[elementIndex].brand
        setSelectedBrand(selectedBrand === brand ? null : brand)
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    }
  }

  const getMarketLeader = () => {
    return rankedData[0]
  }

  const getYourBrandPosition = () => {
    const yourBrand = rankedData.find(item => item.brand === 'Your Brand')
    return yourBrand ? yourBrand.rank : null
  }

  const marketLeader = getMarketLeader()
  const yourBrandPosition = getYourBrandPosition()

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6"
    >
      {}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </motion.h3>

          {yourBrandPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                Your Brand: #{yourBrandPosition}
              </span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* SOV Metric Toggle */}
          <div className="flex items-center bg-blue-100 dark:bg-blue-900/30 rounded-md p-1 mr-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSOVMetric('weighted')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                sovMetric === 'weighted'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Weighted SOV (40% volume + 60% engagement)"
            >
              Weighted
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSOVMetric('volume')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                sovMetric === 'volume'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Volume SOV (based on post count)"
            >
              Volume
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSOVMetric('engagement')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                sovMetric === 'engagement'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Engagement SOV (based on likes + comments)"
            >
              Engagement
            </motion.button>
          </div>

          {/* Sort Toggle */}
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-md p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSortBy('sov')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                sortBy === 'sov'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              SOV
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSortBy('alphabetical')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                sortBy === 'alphabetical'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              A-Z
            </motion.button>
          </div>

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

      {}
      {marketLeader && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-4 p-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">
              Market Leader: {marketLeader.brand} with {marketLeader.currentSOV.toFixed(2)}% Share of Voice ({sovMetric})
            </span>
          </div>
        </motion.div>
      )}

      {}
      <div className="h-80 w-full">
        <Bar
          ref={chartRef}
          data={chartData}
          options={options}
        />
      </div>

      {}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 space-y-2"
      >
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Brand Rankings</h4>
        {rankedData.map((item, index) => (
          <motion.div
            key={item.brand}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
              selectedBrand === item.brand
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setSelectedBrand(
              selectedBrand === item.brand ? null : item.brand
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold">
                {item.rank}
              </div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.brand}</span>
            </div>
            <div className="text-sm font-bold">{item.currentSOV.toFixed(2)}%</div>
          </motion.div>
        ))}
      </motion.div>

      {}
      {selectedBrand && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 p-4 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg"
        >
          <h4 className="font-medium mb-2">Analysis for {selectedBrand}</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div className="font-semibold">Share of Voice Metrics:</div>
            <div className="ml-2">• Weighted SOV: {rankedData.find(d => d.brand === selectedBrand)?.sovWeighted.toFixed(2)}%</div>
            <div className="ml-2">• Volume SOV: {rankedData.find(d => d.brand === selectedBrand)?.sovVolume.toFixed(2)}%</div>
            <div className="ml-2">• Engagement SOV: {rankedData.find(d => d.brand === selectedBrand)?.sovEngagement.toFixed(2)}%</div>
            <div className="mt-2">Market Position: #{rankedData.find(d => d.brand === selectedBrand)?.rank}</div>
            <div>Total Posts: {rankedData.find(d => d.brand === selectedBrand)?.postCount}</div>
            <div>Total Engagement: {rankedData.find(d => d.brand === selectedBrand)?.totalEngagement.toLocaleString()}</div>
            {selectedBrand === 'Your Brand' && (
              <div className="text-blue-600 font-medium mt-2">
                This is your brand. Consider strategies to increase market share.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
