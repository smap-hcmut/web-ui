import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  MoreHorizontal,
  Download,
  Maximize2,
  Filter,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface TrendData {
  date: string
  mentions: number
  sentiment: number
}

interface TrendChartProps {
  title: string
  data: TrendData[]
  animation?: 'line-draw' | 'fade-in'
  interaction?: 'zoom-pan' | 'hover-only'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg p-3 shadow-lg"
      >
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.dataKey}:</span>
            <span className="font-medium">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </motion.div>
    )
  }
  return null
}

export default function TrendChart({
  title,
  data,
  animation = 'line-draw',
  interaction = 'hover-only'
}: TrendChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'mentions' | 'sentiment'>('mentions')
  const [chartType, setChartType] = useState<'line' | 'area'>('area')

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getLatestChange = () => {
    if (data.length < 2) return { change: 0, trend: 'neutral' }

    const latest = data[data.length - 1]
    const previous = data[data.length - 2]
    const change = ((latest[selectedMetric] - previous[selectedMetric]) / previous[selectedMetric]) * 100

    return {
      change: Math.abs(change),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    }
  }

  const { change, trend } = getLatestChange()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-card border border-border rounded-lg p-6"
    >
      {}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-semibold"
          >
            {title}
          </motion.h3>

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
              'text-muted-foreground'
            }`}>
              {change.toFixed(1)}% vs previous
            </span>
          </motion.div>
        </div>

        <div className="flex items-center gap-2">
          {}
          <div className="flex items-center bg-muted rounded-md p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMetric('mentions')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedMetric === 'mentions'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mentions
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMetric('sentiment')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedMetric === 'sentiment'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sentiment
            </motion.button>
          </div>

          {}
          <div className="flex items-center bg-muted rounded-md p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('area')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === 'area'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Area
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType('line')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Line
            </motion.button>
          </div>

          {}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Filter className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Download className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          {chartType === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={formatXAxisLabel}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => value.toLocaleString()}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#trendGradient)"
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={formatXAxisLabel}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => value.toLocaleString()}
              />

              <Tooltip content={<CustomTooltip />} />

              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
