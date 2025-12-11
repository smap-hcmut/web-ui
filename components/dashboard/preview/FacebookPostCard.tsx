import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Globe,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react'
import { DryRunContent } from '@/lib/types/dryrun'
import { useTranslation } from 'next-i18next'

interface FacebookPostCardProps {
  post: DryRunContent
}

export default function FacebookPostCard({ post }: FacebookPostCardProps) {
  const { t } = useTranslation('common')
  const [showComments, setShowComments] = useState(false)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Vừa xong'
      if (diffMins < 60) return `${diffMins} phút`
      if (diffHours < 24) return `${diffHours} giờ`
      if (diffDays < 7) return `${diffDays} ngày`
      return date.toLocaleDateString('vi-VN')
    } catch {
      return dateString
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden flex-shrink-0">
              {post.author.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>

            {/* Author Info */}
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900 dark:text-white text-[15px]">
                  {post.author.name}
                </span>
                {post.author.is_verified && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm4.95 7.636l-5.5 5.5a.5.5 0 01-.707 0l-2.5-2.5a.5.5 0 01.707-.707L9 11.986l5.146-5.147a.5.5 0 01.708.707z" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatDate(post.meta.published_at)}</span>
                <span>·</span>
                <Globe className="w-3 h-3" />
              </div>
            </div>
          </div>

          <button className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Post Content */}
        <div className="text-gray-900 dark:text-white text-[15px] mb-3 whitespace-pre-wrap">
          {post.content.text}
        </div>

        {/* Hashtags */}
        {post.content.hashtags && post.content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.content.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-sm font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Keyword Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full mb-3">
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            Từ khóa: {post.meta.keyword_source}
          </span>
        </div>
      </div>

      {/* Interaction Stats Bar */}
      <div className="px-4 py-2 border-t border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="flex items-center -space-x-1">
              <div className="w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center">
                <ThumbsUp className="w-3 h-3 text-white fill-white" />
              </div>
            </div>
            <span className="ml-2">{formatNumber(post.interaction.likes)}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{formatNumber(post.interaction.comments_count)} bình luận</span>
            <span>{formatNumber(post.interaction.shares)} chia sẻ</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-around">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ThumbsUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-semibold text-gray-600 dark:text-gray-400 text-sm">
              Thích
            </span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-semibold text-gray-600 dark:text-gray-400 text-sm">
              Bình luận
            </span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-semibold text-gray-600 dark:text-gray-400 text-sm">
              Chia sẻ
            </span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {post.comments && post.comments.length > 0 && showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3"
        >
          {post.comments.slice(0, 3).map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden flex-shrink-0">
                {comment.user.avatar_url ? (
                  <img
                    src={comment.user.avatar_url}
                    alt={comment.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    {comment.user.name}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200">
                    {comment.text}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 px-3">
                  <button className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:underline">
                    Thích
                  </button>
                  <button className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:underline">
                    Phản hồi
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDate(comment.published_at)}
                  </span>
                  {comment.likes > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {formatNumber(comment.likes)} ·
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {post.comments.length > 3 && (
            <button className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:underline pl-10">
              Xem thêm bình luận
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}
