import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import {
  Download,
  Maximize2,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface PlatformData {
  name: string
  value: number
  percentage: number
  change: number
  color: string
  posts?: number
  engagement?: number
  [key: string]: string | number | undefined
}

interface PlatformDistributionProps {
  title: string
  data: PlatformData[]
  animation?: 'fade-in' | 'scale-up'
  interaction?: 'hover-details' | 'click-platform'
  onPlatformClick?: (platform: PlatformData) => void
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 border border-amber-300/60 dark:border-white/20 rounded-lg p-3 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {data.name}
          </span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>Mentions: <span className="font-medium">{data.value.toLocaleString()}</span></div>
          <div>Share: <span className="font-medium">{data.percentage.toFixed(1)}%</span></div>
          {data.posts !== undefined && (
            <div>Posts: <span className="font-medium">{data.posts.toLocaleString()}</span></div>
          )}
          {data.engagement !== undefined && (
            <div>Avg Engagement: <span className="font-medium">{data.engagement.toFixed(1)}%</span></div>
          )}
          <div className="flex items-center gap-1">
            Change:
            {data.change > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={`font-medium ${data.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
            </span>
          </div>
        </div>
      </motion.div>
    )
  }
  return null
}

const CustomLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null // Don't show label for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function PlatformDistribution({
  title,
  data = [],
  animation = 'scale-up',
  interaction = 'hover-details',
  onPlatformClick
}: PlatformDistributionProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'pie' | 'bar'>('pie')

  // Add null check
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-80">
          <div className="text-center text-gray-600 dark:text-gray-400">No platform data available</div>
        </div>
      </div>
    )
  }

  const handlePlatformClick = (data: any) => {
    if (interaction === 'click-platform') {
      setSelectedPlatform(selectedPlatform === data.name ? null : data.name)
      if (onPlatformClick) onPlatformClick(data)
    }
  }

  const totalMentions = data.reduce((sum, platform) => sum + platform.value, 0)
  const topPlatform = data.reduce((max, platform) =>
    platform.value > max.value ? platform : max
  , data[0])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-amber-300/60 dark:border-white/20 rounded-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full"
          >
            <span className="text-sm font-medium text-blue-600">
              {topPlatform.name} leads ({topPlatform.percentage.toFixed(1)}%)
            </span>
          </motion.div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-md p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('pie')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'pie'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Pie
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('bar')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'bar'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Bar
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
          >
            <Download className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
          >
            <Maximize2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          {viewMode === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={<CustomLabel />}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                onClick={handlePlatformClick}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    opacity={selectedPlatform === entry.name || selectedPlatform === null ? 1 : 0.5}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
                )}
              />
            </PieChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
              <Bar
                dataKey="value"
                onClick={handlePlatformClick}
                animationDuration={1000}
                animationEasing="ease-out"
                radius={[8, 8, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    opacity={selectedPlatform === entry.name || selectedPlatform === null ? 1 : 0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Platform Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 space-y-3"
      >
        {data.map((platform, index) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className={`p-3 rounded-lg transition-colors cursor-pointer ${
              selectedPlatform === platform.name
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => setSelectedPlatform(selectedPlatform === platform.name ? null : platform.name)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
                <div>
                  <div className="font-medium text-sm">{platform.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {platform.value.toLocaleString()} mentions
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="text-sm font-bold" style={{ color: platform.color }}>
                    {platform.percentage.toFixed(1)}%
                  </div>
                  <div className={`text-xs flex items-center gap-1 ${platform.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {platform.change > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {platform.change > 0 ? '+' : ''}{platform.change.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${platform.percentage}%`,
                  backgroundColor: platform.color
                }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-amber-300/60 dark:border-white/20"
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {totalMentions.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Mentions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {data.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Platforms</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: topPlatform.color }}>
            {topPlatform.name}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Top Platform</div>
        </div>
      </motion.div>
    </motion.div>
  )
}
