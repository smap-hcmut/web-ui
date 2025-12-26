import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  TrendingUp,
  Hash,
  FileText,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Grid,
  List,
  BarChart3,
  Database,
  Wifi,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useTrend } from '@/contexts/TrendContext'
import TrendTopicCard from './TrendTopicCard'
import TrendHashtagCard from './TrendHashtagCard'
import TrendPostCard from './TrendPostCard'
import TrendMetrics from './TrendMetrics'

interface TrendDashboardProps {
  onTopicSelect: (topicId: string) => void
}

const PAGE_SIZE_OPTIONS = [12, 24, 48]

export default function TrendDashboard({ onTopicSelect }: TrendDashboardProps) {
  const { t } = useTranslation('common')
  const {
    state,
    filteredTopics,
    filteredHashtags,
    filteredPosts,
    setSearchQuery,
    setViewMode,
    setSort,
    refreshData,
    isUsingRealData
  } = useTrend()

  const [showMetrics, setShowMetrics] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  // Reset page when view mode, search, or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [state.viewMode, state.searchQuery, state.filters, state.sortBy, state.sortOrder])

  // Get current data based on view mode
  const currentData = useMemo(() => {
    switch (state.viewMode) {
      case 'topics': return filteredTopics
      case 'hashtags': return filteredHashtags
      case 'posts': return filteredPosts
      default: return []
    }
  }, [state.viewMode, filteredTopics, filteredHashtags, filteredPosts])

  // Pagination calculations
  const totalItems = currentData.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  // Paginated data
  const paginatedTopics = useMemo(() => 
    state.viewMode === 'topics' ? filteredTopics.slice(startIndex, endIndex) : [],
    [state.viewMode, filteredTopics, startIndex, endIndex]
  )
  const paginatedHashtags = useMemo(() => 
    state.viewMode === 'hashtags' ? filteredHashtags.slice(startIndex, endIndex) : [],
    [state.viewMode, filteredHashtags, startIndex, endIndex]
  )
  const paginatedPosts = useMemo(() => 
    state.viewMode === 'posts' ? filteredPosts.slice(startIndex, endIndex) : [],
    [state.viewMode, filteredPosts, startIndex, endIndex]
  )

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleSort = (by: 'volume' | 'delta' | 'confidence' | 'sentiment') => {
    const newOrder = state.sortBy === by && state.sortOrder === 'desc' ? 'asc' : 'desc'
    setSort(by, newOrder)
  }

  const SortButton = ({
    field,
    labelKey,
    icon
  }: {
    field: 'volume' | 'delta' | 'confidence' | 'sentiment'
    labelKey: string
    icon: React.ReactNode
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        state.sortBy === field
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
{t(labelKey)}
      {state.sortBy === field && (
        state.sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
      )}
    </button>
  )

  // Pagination component
  const Pagination = () => {
    if (totalItems === 0) return null

    return (
      <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Hiển thị {startIndex + 1}-{endIndex} / {totalItems}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Số lượng:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-border rounded-md bg-background"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="Trang đầu"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 mx-2">
            {/* Show page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="Trang cuối"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Search and Controls */}
      <div className="p-6 border-b border-border bg-card/50">
        <div className="flex items-center gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
               placeholder={t('trendAnalysis.searchPlaceholder')}
              value={state.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('topics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                state.viewMode === 'topics'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
{t('trendAnalysis.topics')}
            </button>
            <button
              onClick={() => setViewMode('hashtags')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                state.viewMode === 'hashtags'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hash className="h-4 w-4" />
{t('trendAnalysis.hashtags')}
            </button>
            <button
              onClick={() => setViewMode('posts')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                state.viewMode === 'posts'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-4 w-4" />
{t('trendAnalysis.posts')}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={state.isLoading}
            className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
             <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
{t('trendAnalysis.refresh')}
          </button>

          {/* Data Source Indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
            isUsingRealData 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {isUsingRealData ? (
              <>
                <Wifi className="h-3 w-3" />
                <span>Live Data</span>
              </>
            ) : (
              <>
                <Database className="h-3 w-3" />
                <span>No Data</span>
              </>
            )}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-muted-foreground">{t('trendAnalysis.sortBy')}:</span>
          <SortButton field="volume" labelKey="trendAnalysis.sortByVolume" icon={<BarChart3 className="h-4 w-4" />} />
          <SortButton field="delta" labelKey="trendAnalysis.sortByDelta" icon={<TrendingUp className="h-4 w-4" />} />
          <SortButton field="confidence" labelKey="trendAnalysis.sortByConfidence" icon={<BarChart3 className="h-4 w-4" />} />
          <SortButton field="sentiment" labelKey="trendAnalysis.sortBySentiment" icon={<TrendingUp className="h-4 w-4" />} />
        </div>
      </div>

      {/* Metrics Section */}
      {showMetrics && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-border"
        >
          <TrendMetrics />
        </motion.div>
      )}

      {/* Content Section */}
      <div>
        {state.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Đang tải dữ liệu xu hướng...</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <AnimatePresence mode="wait">
              {state.viewMode === 'topics' && (
                <motion.div
                  key="topics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                      Trending Topics ({filteredTopics.length})
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowMetrics(!showMetrics)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showMetrics ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                        {showMetrics ? 'Hide' : 'Show'} Metrics
                      </button>
                    </div>
                  </div>

                  {filteredTopics.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Không tìm thấy chủ đề nào</h3>
                      <p className="text-muted-foreground">
                        Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedTopics.map((topic, index) => (
                          <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.05, 0.3) }}
                          >
                            <TrendTopicCard
                              topic={topic}
                              onClick={() => onTopicSelect(topic.id)}
                            />
                          </motion.div>
                        ))}
                      </div>
                      <Pagination />
                    </>
                  )}
                </motion.div>
              )}

              {state.viewMode === 'hashtags' && (
                <motion.div
                  key="hashtags"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-semibold mb-6">
                    Trending Hashtags ({filteredHashtags.length})
                  </h2>

                  {filteredHashtags.length === 0 ? (
                    <div className="text-center py-12">
                      <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Không tìm thấy hashtag nào</h3>
                      <p className="text-muted-foreground">
                        Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedHashtags.map((hashtag, index) => (
                          <motion.div
                            key={hashtag.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.05, 0.3) }}
                          >
                            <TrendHashtagCard hashtag={hashtag} />
                          </motion.div>
                        ))}
                      </div>
                      <Pagination />
                    </>
                  )}
                </motion.div>
              )}

              {state.viewMode === 'posts' && (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-semibold mb-6">
                    Sample Posts ({filteredPosts.length})
                  </h2>

                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Không tìm thấy bài đăng nào</h3>
                      <p className="text-muted-foreground">
                        Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {paginatedPosts.map((post, index) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.05, 0.3) }}
                          >
                            <TrendPostCard post={post} />
                          </motion.div>
                        ))}
                      </div>
                      <Pagination />
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
