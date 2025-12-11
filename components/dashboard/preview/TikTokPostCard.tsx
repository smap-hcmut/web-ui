import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Music2,
  Play,
  MoreHorizontal,
  User,
  ChevronDown,
  ChevronUp,
  Hash
} from 'lucide-react'
import { DryRunContent } from '@/lib/types/dryrun'
import { useTranslation } from 'next-i18next'

interface TikTokPostCardProps {
  post: DryRunContent
}

export default function TikTokPostCard({ post }: TikTokPostCardProps) {
  const { t } = useTranslation('common')
  const [showSummary, setShowSummary] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col md:flex-row gap-4 p-4">
        {/* Left: Video Preview (Thumbnail/Placeholder) */}
        <div className="flex-shrink-0">
          <div className="relative w-full md:w-[280px] h-[480px] bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 rounded-xl overflow-hidden group cursor-pointer">
            {/* Video Thumbnail Placeholder */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-white mx-auto mb-2 drop-shadow-lg" />
                <p className="text-white text-sm font-semibold">Video Preview</p>
                {post.content.duration && (
                  <p className="text-white/80 text-xs mt-1">{formatDuration(post.content.duration)}</p>
                )}
              </div>
            </div>

            {/* Stats Overlay (TikTok style) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white rounded-full overflow-hidden border-2 border-white">
                  {post.author.avatar_url ? (
                    <img src={post.author.avatar_url} alt={post.author.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
                <span className="text-white font-semibold text-sm">@{post.author.username}</span>
                {post.author.is_verified && (
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm4.95 7.636l-5.5 5.5a.5.5 0 01-.707 0l-2.5-2.5a.5.5 0 01.707-.707L9 11.986l5.146-5.147a.5.5 0 01.708.707z" />
                  </svg>
                )}
              </div>
              {post.content.sound_name && (
                <div className="flex items-center gap-1 text-white text-xs">
                  <Music2 className="w-3 h-3" />
                  <span className="truncate">{post.content.sound_name}</span>
                </div>
              )}
            </div>

            {/* Action Icons (TikTok Style - Right Side) */}
            <div className="absolute right-3 bottom-20 flex flex-col gap-4">
              <div className="flex flex-col items-center">
                <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Heart className="w-6 h-6 text-white" />
                </button>
                <span className="text-white text-xs font-semibold mt-1">{formatNumber(post.interaction.likes)}</span>
              </div>
              <div className="flex flex-col items-center">
                <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <MessageCircle className="w-6 h-6 text-white" />
                </button>
                <span className="text-white text-xs font-semibold mt-1">{formatNumber(post.interaction.comments_count)}</span>
              </div>
              {post.interaction.saves && (
                <div className="flex flex-col items-center">
                  <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Bookmark className="w-6 h-6 text-white" />
                  </button>
                  <span className="text-white text-xs font-semibold mt-1">{formatNumber(post.interaction.saves)}</span>
                </div>
              )}
              <div className="flex flex-col items-center">
                <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Share2 className="w-6 h-6 text-white" />
                </button>
                <span className="text-white text-xs font-semibold mt-1">{formatNumber(post.interaction.shares)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Content Details */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Author Info Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                {post.author.avatar_url ? (
                  <img src={post.author.avatar_url} alt={post.author.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{post.author.name}</h3>
                  {post.author.is_verified && (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm4.95 7.636l-5.5 5.5a.5.5 0 01-.707 0l-2.5-2.5a.5.5 0 01.707-.707L9 11.986l5.146-5.147a.5.5 0 01.708.707z" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">@{post.author.username}</p>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Author Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{formatNumber(post.author.followers)} Người theo dõi</span>
            <span>·</span>
            <span>{formatNumber(post.author.likes)} Lượt thích</span>
          </div>

          {/* Content Text */}
          <div className="flex-1">
            <p className="text-gray-900 dark:text-white text-sm leading-relaxed mb-3">
              {post.content.text}
            </p>

            {/* Hashtags */}
            {post.content.hashtags && post.content.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.content.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Keyword Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-200 dark:border-pink-800 rounded-full mb-3">
              <span className="text-xs font-semibold text-pink-700 dark:text-pink-400">
                🎯 Khớp từ khóa: {post.meta.keyword_source}
              </span>
            </div>

            {/* Video Summary */}
            {post.content.transcription && (
              <div className="mb-3">
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {showSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Xem tóm tắt nội dung video
                </button>
                {showSummary && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {post.content.transcription}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
              <span>{formatDate(post.meta.published_at)}</span>
              <span>·</span>
              <span>{formatNumber(post.interaction.views)} lượt xem</span>
              {post.interaction.engagement_rate && (
                <>
                  <span>·</span>
                  <span>{(post.interaction.engagement_rate * 100).toFixed(1)}% tương tác</span>
                </>
              )}
            </div>
          </div>

          {/* Comments Toggle */}
          {post.comments && post.comments.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-3"
              >
                {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Bình luận ({post.comments.length})
              </button>

              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 max-h-64 overflow-y-auto"
                >
                  {post.comments.slice(0, 5).map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                        {comment.user.avatar_url ? (
                          <img src={comment.user.avatar_url} alt={comment.user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {comment.user.name}
                          </span>
                          {comment.is_author && (
                            <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-400 text-xs font-semibold rounded">
                              Tác giả
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{comment.text}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                          {comment.likes > 0 && <span>{formatNumber(comment.likes)} thích</span>}
                          {comment.replies_count > 0 && <span>{formatNumber(comment.replies_count)} phản hồi</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {post.comments.length > 5 && (
                    <button className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:underline">
                      Xem thêm {post.comments.length - 5} bình luận
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
