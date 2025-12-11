import React from 'react'
import { Maximize2, Minimize2, Columns3 } from 'lucide-react'
import { motion } from 'framer-motion'

interface FullscreenToggleProps {
  isFullscreen: boolean
  isComparisonMode: boolean
  onToggleFullscreen: () => void
  onToggleComparison: () => void
}

export default function FullscreenToggle({
  isFullscreen,
  isComparisonMode,
  onToggleFullscreen,
  onToggleComparison
}: FullscreenToggleProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Comparison Mode Toggle (only in fullscreen) */}
      {isFullscreen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onToggleComparison}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            isComparisonMode
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title={isComparisonMode ? 'Tắt chế độ so sánh' : 'Bật chế độ so sánh 3 platforms'}
        >
          <Columns3 className="w-5 h-5" />
          <span className="hidden sm:inline">
            {isComparisonMode ? 'So sánh: Bật' : 'So sánh 3 platforms'}
          </span>
        </motion.button>
      )}

      {/* Fullscreen Toggle */}
      <button
        onClick={onToggleFullscreen}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
          isFullscreen
            ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={isFullscreen ? 'Thu nhỏ' : 'Phóng to toàn màn hình'}
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="w-5 h-5" />
            <span className="hidden sm:inline">Thu nhỏ</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-5 h-5" />
            <span className="hidden sm:inline">Toàn màn hình</span>
          </>
        )}
      </button>
    </div>
  )
}
