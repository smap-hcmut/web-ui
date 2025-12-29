import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Calendar,
  Smartphone,
  Hash,
  Filter,
  RotateCcw,
  ChevronDown
} from 'lucide-react'
import { useTrend } from '@/contexts/TrendContext'

interface TrendFiltersProps {
  onClose: () => void
}

export default function TrendFilters({ onClose }: TrendFiltersProps) {
  const { state, setFilters, resetFilters } = useTrend()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['time-range', 'platforms'])
  )

  const timeRanges = [
    { id: '1h', label: 'Last Hour', value: '1h' },
    { id: '24h', label: 'Last 24 Hours', value: '24h' },
    { id: '7d', label: 'Last 7 Days', value: '7d' },
    { id: '30d', label: 'Last 30 Days', value: '30d' },
    { id: '90d', label: 'Last 90 Days', value: '90d' },
    { id: 'custom', label: 'Custom Range', value: 'custom' },
  ]

  const platforms = [
    { id: 'facebook', label: 'Facebook' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'twitter', label: 'Twitter/X' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'youtube', label: 'YouTube' },
  ]

  const sentimentOptions = [
    { id: 'positive', label: 'Positive', color: 'text-green-600' },
    { id: 'neutral', label: 'Neutral', color: 'text-gray-600' },
    { id: 'negative', label: 'Negative', color: 'text-red-600' },
  ]

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const handlePlatformToggle = (platformId: string) => {
    const currentPlatforms = state.filters.platforms || []
    const newPlatforms = currentPlatforms.includes(platformId)
      ? currentPlatforms.filter(p => p !== platformId)
      : [...currentPlatforms, platformId]

    setFilters({ platforms: newPlatforms })
  }

  const handleSentimentToggle = (sentimentId: string) => {
    const currentSentiment = state.filters.sentiment || []
    const newSentiment = currentSentiment.includes(sentimentId)
      ? currentSentiment.filter(s => s !== sentimentId)
      : [...currentSentiment, sentimentId]

    setFilters({ sentiment: newSentiment })
  }

  const FilterSection = ({
    title,
    sectionId,
    icon,
    children
  }: {
    title: string
    sectionId: string
    icon: React.ReactNode
    children: React.ReactNode
  }) => (
    <div className="border-b border-border pb-4 mb-4">
      <button
        onClick={() => toggleSection(sectionId)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            expandedSections.has(sectionId) ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expandedSections.has(sectionId) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3"
        >
          {children}
        </motion.div>
      )}
    </div>
  )

  // Count active filters
  const activeFilterCount = 
    (state.filters.platforms?.length || 0) + 
    (state.filters.sentiment?.length || 0) +
    (state.filters.minVolume > 0 ? 1 : 0) +
    (state.filters.minConfidence > 0 ? 1 : 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Sections */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Time Range */}
        <FilterSection
          title="Time Range"
          sectionId="time-range"
          icon={<Calendar className="h-4 w-4" />}
        >
          <div className="space-y-2">
            {timeRanges.map((range) => (
              <label key={range.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="timeRange"
                  value={range.value}
                  checked={state.filters.timeRange === range.value}
                  onChange={(e) => setFilters({ timeRange: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm">{range.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Platforms */}
        <FilterSection
          title="Platforms"
          sectionId="platforms"
          icon={<Smartphone className="h-4 w-4" />}
        >
          <div className="space-y-2">
            {platforms.map((platform) => (
              <label key={platform.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.filters.platforms?.includes(platform.id) || false}
                  onChange={() => handlePlatformToggle(platform.id)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm">{platform.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Sentiment */}
        <FilterSection
          title="Sentiment"
          sectionId="sentiment"
          icon={<Hash className="h-4 w-4" />}
        >
          <div className="space-y-2">
            {sentimentOptions.map((sentiment) => (
              <label key={sentiment.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.filters.sentiment?.includes(sentiment.id) || false}
                  onChange={() => handleSentimentToggle(sentiment.id)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className={`text-sm ${sentiment.color}`}>{sentiment.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Volume & Confidence */}
        <FilterSection
          title="Thresholds"
          sectionId="volume"
          icon={<Hash className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Volume</label>
              <input
                type="number"
                value={state.filters.minVolume || 0}
                onChange={(e) => setFilters({ minVolume: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Minimum Confidence (0-1)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={state.filters.minConfidence || 0}
                onChange={(e) => setFilters({ minConfidence: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </FilterSection>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <button
            onClick={resetFilters}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
