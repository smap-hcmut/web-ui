import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  PauseCircle,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useDashboard } from '@/contexts/DashboardContext'
import { useProjectWebSocket } from '@/hooks/useProjectWebSocket'
import type { PhaseProgress } from '@/lib/types/websocket'
import {
  ProjectStatus,
  Progress,
  formatETA,
  mapLegacyProjectStatus,
} from '@/lib/types/websocket'

/**
 * PhaseProgressBar - Display progress for a single phase (crawl/analyze)
 */
interface PhaseProgressBarProps {
  label: string
  phase?: PhaseProgress | null
  colorClass?: string
}

const PhaseProgressBar: React.FC<PhaseProgressBarProps> = ({
  label,
  phase,
  colorClass = 'from-blue-600 to-violet-600',
}) => {
  const { t } = useTranslation('common')

  if (!phase) return null

  const percent = Math.round(phase.progress_percent)
  const hasErrors = phase.errors > 0

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {phase.done}/{phase.total} ({percent}%)
          </span>
          {hasErrors && (
            <span className="text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {phase.errors} {t('dashboard.processing.errors')}
            </span>
          )}
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-2 rounded-full bg-gradient-to-r ${hasErrors ? 'from-orange-500 to-red-500' : colorClass}`}
        />
      </div>
    </div>
  )
}

interface ProjectProcessingStateProps {
  projectId: string
  /** URL to redirect to on completion (default: /dashboard?project={projectId}) */
  redirectUrl?: string
  /** Auto-redirect delay in seconds (default: 5, set to 0 to disable) */
  redirectDelay?: number
}

export default function ProjectProcessingState({
  projectId,
  redirectUrl,
  redirectDelay = 5,
}: ProjectProcessingStateProps) {
  const router = useRouter()
  const { t } = useTranslation('common')
  const { currentProject, state, updateProject } = useDashboard()

  // Local state
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  // Get project from state
  const project = projectId
    ? state.projects.find((p) => p.id === projectId)
    : currentProject

  // WebSocket connection with new hook (supports both legacy and phase-based format)
  const {
    isConnected,
    status,
    progress,
    crawlProgress,
    analyzeProgress,
    overallPercent,
    error
  } = useProjectWebSocket({
    projectId, // Pass projectId explicitly to the hook
    onCompleted: async () => {
      console.log('Project completed:', projectId)
      // Update project status
      if (project) {
        updateProject({ ...project, status: 'completed' })
      }

      // Placeholder: Fetch full project data when API is ready
      // TODO: Implement when backend API is available
      try {
        // const fullData = await projectService.getProjectFullData(projectId)
        // updateProjectData(fullData)
        console.log('[Placeholder] Fetch full project data API - projectId:', projectId)
      } catch (err) {
        console.error('Failed to fetch full project data:', err)
      }

      // Start countdown for redirect
      if (redirectDelay > 0) {
        setCountdown(redirectDelay)
      }
    },
    onFailed: (errors) => {
      console.log('Project failed:', projectId, errors)
      // Note: Project status remains 'process' - UI shows failed state via WebSocket status
    },
    onPaused: () => {
      console.log('Project paused:', projectId)
    },
  })

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown === null || countdown <= 0) return

    const timer = setTimeout(() => {
      if (countdown === 1) {
        // Redirect
        const url = redirectUrl || `/dashboard?project=${projectId}`
        router.push(url)
      } else {
        setCountdown(countdown - 1)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, redirectUrl, projectId, router])

  // Cancel redirect
  const cancelRedirect = useCallback(() => {
    setCountdown(null)
  }, [])

  // Get status message
  const getStatusMessage = useCallback(
    (status: ProjectStatus | null): string => {
      switch (status) {
        case 'PROCESSING':
          return t('dashboard.processing.statusProcessing')
        case 'COMPLETED':
          return t('dashboard.processing.statusCompleted')
        case 'FAILED':
          return t('dashboard.processing.statusFailed')
        case 'PAUSED':
          return t('dashboard.processing.statusPaused')
        default:
          return isConnected
            ? t('dashboard.processing.statusWaiting')
            : t('dashboard.processing.statusConnecting')
      }
    },
    [isConnected, t]
  )

  // Get status icon
  const getStatusIcon = useCallback((status: ProjectStatus | null) => {
    switch (status) {
      case 'PROCESSING':
        return <Loader2 className="h-10 w-10 text-white animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="h-10 w-10 text-white" />
      case 'FAILED':
        return <XCircle className="h-10 w-10 text-white" />
      case 'PAUSED':
        return <PauseCircle className="h-10 w-10 text-white" />
      default:
        return <Loader2 className="h-10 w-10 text-white animate-spin" />
    }
  }, [])

  // Get header gradient based on status
  const getHeaderGradient = useCallback((status: ProjectStatus | null) => {
    switch (status) {
      case 'COMPLETED':
        return 'from-green-600 to-emerald-600'
      case 'FAILED':
        return 'from-red-600 to-rose-600'
      case 'PAUSED':
        return 'from-yellow-600 to-amber-600'
      default:
        return 'from-blue-600 to-violet-600'
    }
  }, [])

  // Calculate progress percentage (prefer phase-based, fallback to legacy)
  const progressPercent = overallPercent > 0 ? overallPercent : (progress?.percentage ?? 0)
  const hasPartialResults = progress && progress.current > 0

  // Check if we have phase-based progress data
  const hasPhaseProgress = crawlProgress !== null || analyzeProgress !== null

  // Processing steps based on status
  const getProcessingSteps = useCallback(
    (currentStatus: ProjectStatus | null) => {
      const isProcessing = currentStatus === 'PROCESSING'
      const isCompleted = currentStatus === 'COMPLETED'
      const isPaused = currentStatus === 'PAUSED'

      return [
        {
          id: 'data-collection',
          title: t('dashboard.processing.steps.dataCollection.title'),
          description: t('dashboard.processing.steps.dataCollection.description'),
          icon: <TrendingUp className="h-5 w-5" />,
          status: isProcessing
            ? 'processing'
            : isCompleted
              ? 'completed'
              : isPaused
                ? 'paused'
                : 'pending',
        },
        {
          id: 'brand-analysis',
          title: t('dashboard.processing.steps.brandAnalysis.title'),
          description: t('dashboard.processing.steps.brandAnalysis.description'),
          icon: <Target className="h-5 w-5" />,
          status: isProcessing
            ? 'processing'
            : isCompleted
              ? 'completed'
              : 'pending',
        },
        {
          id: 'sentiment-analysis',
          title: t('dashboard.processing.steps.sentimentAnalysis.title'),
          description: t('dashboard.processing.steps.sentimentAnalysis.description'),
          icon: <Users className="h-5 w-5" />,
          status: isProcessing
            ? 'processing'
            : isCompleted
              ? 'completed'
              : 'pending',
        },
        {
          id: 'dashboard-setup',
          title: t('dashboard.processing.steps.dashboardSetup.title'),
          description: t('dashboard.processing.steps.dashboardSetup.description'),
          icon: <BarChart3 className="h-5 w-5" />,
          status: isCompleted ? 'completed' : 'pending',
        },
      ]
    },
    [t]
  )

  // Early return if no project or not processing
  if (!project || (project.status !== 'process' && status !== 'PROCESSING')) {
    return null
  }

  const processingSteps = getProcessingSteps(status)


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${getHeaderGradient(status)} rounded-full mb-6`}
          >
            {getStatusIcon(status)}
          </motion.div>

          <h1
            className={`text-3xl font-bold bg-gradient-to-r ${getHeaderGradient(status)} bg-clip-text text-transparent mb-4`}
          >
            {status === 'COMPLETED'
              ? t('dashboard.processing.titleCompleted')
              : status === 'FAILED'
                ? t('dashboard.processing.titleFailed')
                : status === 'PAUSED'
                  ? t('dashboard.processing.titlePaused')
                  : t('dashboard.processing.titleProcessing')}
          </h1>

          <p className="text-lg text-muted-foreground">
            {status === 'COMPLETED' ? (
              <span dangerouslySetInnerHTML={{ __html: t('dashboard.processing.descriptionCompleted', { projectName: project.name }) }} />
            ) : status === 'FAILED' ? (
              <span dangerouslySetInnerHTML={{ __html: t('dashboard.processing.descriptionFailed', { projectName: project.name }) }} />
            ) : (
              <span dangerouslySetInnerHTML={{ __html: t('dashboard.processing.descriptionProcessing', { projectName: project.name }) }} />
            )}
          </p>
        </motion.div>

        {/* Auto-redirect countdown */}
        <AnimatePresence>
          {countdown !== null && countdown > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 dark:text-green-300">
                    {t('dashboard.processing.redirectingIn', { seconds: countdown })}
                  </span>
                </div>
                <button
                  onClick={cancelRedirect}
                  className="px-3 py-1 text-sm bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
                >
                  {t('dashboard.processing.cancel')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error list for FAILED status */}
        <AnimatePresence>
          {status === 'FAILED' && progress?.errors && progress.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowErrors(!showErrors)}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700 dark:text-red-300 font-medium">
                    {t('dashboard.processing.errorsOccurred', { count: progress.errors.length })}
                  </span>
                </div>
                <span className="text-sm text-red-600">
                  {showErrors ? t('dashboard.processing.hideDetails') : t('dashboard.processing.showDetails')}
                </span>
              </div>
              <AnimatePresence>
                {showErrors && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 max-h-40 overflow-y-auto"
                  >
                    <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                      {progress.errors.map((err, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Partial results notice for FAILED */}
        {status === 'FAILED' && hasPartialResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-700 dark:text-yellow-300">
                {t('dashboard.processing.partialResults', { current: progress?.current, total: progress?.total })}
              </span>
            </div>
          </motion.div>
        )}

        {/* PAUSED state notice */}
        {status === 'PAUSED' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <PauseCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-700 dark:text-yellow-300">
                {t('dashboard.processing.pausedNotice', { current: progress?.current ?? 0, total: progress?.total ?? 0 })}
              </span>
            </div>
          </motion.div>
        )}

        {/* Processing Steps - only show when PROCESSING */}
        {(status === 'PROCESSING' || status === null) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-4"
          >
            {processingSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                className={`flex items-center gap-4 p-4 bg-card border rounded-lg ${step.status === 'paused'
                  ? 'border-yellow-300 dark:border-yellow-700 opacity-75'
                  : 'border-border'
                  }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${step.status === 'processing'
                    ? 'bg-primary/20 text-primary'
                    : step.status === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : step.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {step.status === 'processing' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : step.status === 'paused' ? (
                    <PauseCircle className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>

                {step.status === 'processing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-primary font-medium"
                  >
                    {t('dashboard.processing.processing')}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Phase Progress Bars (new format) */}
        {hasPhaseProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-8 p-4 bg-card border rounded-lg"
          >
            <h4 className="text-sm font-semibold mb-4 text-muted-foreground">{t('dashboard.processing.progressDetails')}</h4>
            <PhaseProgressBar
              label={t('dashboard.processing.dataCrawl')}
              phase={crawlProgress}
              colorClass="from-cyan-600 to-blue-600"
            />
            <PhaseProgressBar
              label={t('dashboard.processing.dataAnalyze')}
              phase={analyzeProgress}
              colorClass="from-violet-600 to-purple-600"
            />
          </motion.div>
        )}

        {/* Overall Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t('dashboard.processing.progress')}</span>
            <div className="flex items-center gap-3">
              {/* ETA Display */}
              {progress?.eta && progress.eta > 0 && status === 'PROCESSING' && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatETA(progress.eta)}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {progress?.current ?? 0} / {progress?.total ?? 0} ({Math.round(progressPercent)}%)
              </span>
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-2 rounded-full ${status === 'COMPLETED'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                : status === 'FAILED'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600'
                  : status === 'PAUSED'
                    ? 'bg-gradient-to-r from-yellow-600 to-amber-600'
                    : 'bg-gradient-to-r from-blue-600 to-violet-600'
                }`}
            />
          </div>
        </motion.div>

        {/* Status Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-6 text-center"
        >
          <div
            className={`inline-flex items-center gap-2 text-sm rounded-full px-4 py-2 ${status === 'COMPLETED'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : status === 'FAILED'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : status === 'PAUSED'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-muted/50 text-muted-foreground'
              }`}
          >
            {status === 'COMPLETED' ? (
              <CheckCircle className="h-4 w-4" />
            ) : status === 'FAILED' ? (
              <XCircle className="h-4 w-4" />
            ) : status === 'PAUSED' ? (
              <PauseCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{getStatusMessage(status)}</span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="mt-6 flex justify-center gap-3"
        >
          {status === 'COMPLETED' && (
            <>
              <button
                onClick={() => router.push(`/dashboard?project=${projectId}`)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {t('dashboard.processing.viewResults')}
              </button>
            </>
          )}

          {status === 'FAILED' && (
            <>
              {hasPartialResults && (
                <button
                  onClick={() => router.push(`/dashboard?project=${projectId}`)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('dashboard.processing.viewPartialResults')}
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('dashboard.processing.retry')}
              </button>
            </>
          )}

          {status === 'PAUSED' && (
            <>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                {t('dashboard.processing.continue')}
              </button>
              <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">
                {t('dashboard.processing.cancelAction')}
              </button>
            </>
          )}
        </motion.div>

        {/* Project Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="mt-8 bg-muted/50 rounded-lg p-6"
        >
          <h3 className="font-semibold mb-4">{t('dashboard.processing.projectInfo')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                {t('dashboard.processing.yourBrands')}
              </h4>
              <div className="space-y-1">
                {project.brands.map((brand) => (
                  <div key={brand.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                {t('dashboard.processing.competitors')}
              </h4>
              <div className="space-y-1">
                {project.competitors.map((competitor) => (
                  <div key={competitor.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-sm">{competitor.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Connection status indicator */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-sm text-red-500"
          >
            {t('dashboard.processing.connectionError')} {error}
          </motion.div>
        )}
      </div>
    </div>
  )
}
