import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Users,
  Target
} from 'lucide-react'
import { useDashboard } from '@/contexts/DashboardContext'
import { createProjectWebSocket } from '@/services/websocketService'
import type { WebSocketService } from '@/services/websocketService'

interface ProjectProcessingStateProps {
  projectId: string
}

interface ProgressPayload {
  project_id: string
  status: 'INITIALIZING' | 'CRAWLING' | 'PROCESSING' | 'DONE' | 'FAILED'
  total: number
  done: number
  errors: number
  progress_percent?: number
}

export default function ProjectProcessingState({ projectId }: ProjectProcessingStateProps) {
  const { currentProject, state, updateProject } = useDashboard()
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('Initializing...')
  const [currentStep, setCurrentStep] = useState<'INITIALIZING' | 'CRAWLING' | 'PROCESSING' | 'DONE' | 'FAILED'>('INITIALIZING')
  const wsServiceRef = useRef<WebSocketService | null>(null)

  // Use the provided projectId or fall back to currentProject
  const project = projectId
    ? state.projects.find(p => p.id === projectId)
    : currentProject

  const getStatusMessage = useCallback((status: string): string => {
    switch (status) {
      case 'INITIALIZING': return 'Initializing data collection...'
      case 'CRAWLING': return 'Collecting data from social media...'
      case 'PROCESSING': return 'Processing and analyzing data...'
      case 'DONE': return 'Almost done...'
      case 'FAILED': return 'Processing failed. Please try again.'
      default: return 'Processing...'
    }
  }, [])

  // Handle progress updates from WebSocket
  const handleProgressUpdate = useCallback((data: any) => {
    const progressData = data as ProgressPayload

    // Update progress bar
    const progressPercent = progressData.progress_percent ||
      (progressData.total > 0 ? (progressData.done / progressData.total) * 100 : 0)
    setProgress(progressPercent)

    // Update status message
    setStatusMessage(getStatusMessage(progressData.status))

    // Update current step
    setCurrentStep(progressData.status)

    console.log(`📊 Progress update: ${Math.round(progressPercent)}% (${progressData.done}/${progressData.total})`)
  }, [getStatusMessage])

  // Handle project completion from WebSocket
  const handleProjectComplete = useCallback((data: any) => {
    console.log('✅ Project completed:', projectId)

    // Update project status to 'completed' using DashboardContext
    if (project) {
      updateProject({
        ...project,
        status: 'completed'
      })
    }
  }, [projectId, project, updateProject])

  // WebSocket connection setup
  useEffect(() => {
    console.log(`🔌 Setting up WebSocket for project: ${projectId}`)

    // Create project-specific WebSocket connection
    const wsService = createProjectWebSocket(projectId)
    wsServiceRef.current = wsService

    // Handle connection events
    wsService.on('connected', () => {
      console.log(`✅ WebSocket connected for project: ${projectId}`)
      setStatusMessage('Connected. Waiting for updates...')
    })

    wsService.on('disconnected', (code: number, reason: string) => {
      console.log(`🔌 WebSocket disconnected: ${code} - ${reason}`)
      setStatusMessage('Connection lost...')
    })

    wsService.on('reconnecting', (attempt: number) => {
      console.log(`🔄 Reconnecting... (attempt ${attempt})`)
      setStatusMessage(`Reconnecting...`)
    })

    wsService.on('error', (error: Error) => {
      console.error('❌ WebSocket error:', error)
      setStatusMessage('Connection error. Retrying...')
    })

    // Handle progress updates
    wsService.on('project_progress', handleProgressUpdate)

    // Handle project completion
    wsService.on('project_completed', handleProjectComplete)

    // Connect
    wsService.connect().catch((error) => {
      console.error('Failed to connect WebSocket:', error)
      setStatusMessage('Connection failed. Please refresh the page.')
    })

    // Cleanup on unmount or projectId change
    return () => {
      console.log('Cleaning up WebSocket connection')
      wsService.disconnect()
      wsServiceRef.current = null
    }
  }, [projectId, handleProgressUpdate, handleProjectComplete])

  // Early return AFTER all hooks
  if (!project || project.status !== 'process') {
    return null
  }

  const processingSteps = [
    {
      id: 'data-collection',
      title: 'Thu thập dữ liệu',
      description: 'Đang thu thập dữ liệu từ các nguồn social media',
      icon: <TrendingUp className="h-5 w-5" />,
      status: (currentStep === 'INITIALIZING' || currentStep === 'CRAWLING') ? 'processing' : 
              (currentStep === 'PROCESSING' || currentStep === 'DONE') ? 'completed' : 'pending'
    },
    {
      id: 'brand-analysis',
      title: 'Phân tích thương hiệu',
      description: 'Đang phân tích và nhận diện thương hiệu',
      icon: <Target className="h-5 w-5" />,
      status: currentStep === 'PROCESSING' ? 'processing' : 
              currentStep === 'DONE' ? 'completed' : 'pending'
    },
    {
      id: 'sentiment-analysis',
      title: 'Phân tích sentiment',
      description: 'Đang phân tích cảm xúc và xu hướng',
      icon: <Users className="h-5 w-5" />,
      status: currentStep === 'PROCESSING' ? 'processing' : 
              currentStep === 'DONE' ? 'completed' : 'pending'
    },
    {
      id: 'dashboard-setup',
      title: 'Thiết lập dashboard',
      description: 'Đang chuẩn bị dashboard và báo cáo',
      icon: <BarChart3 className="h-5 w-5" />,
      status: currentStep === 'DONE' ? 'completed' : 'pending'
    }
  ]

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
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full mb-6"
          >
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </motion.div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-4">
            Đang thiết lập project
          </h1>

          <p className="text-lg text-muted-foreground">
            Chúng tôi đang chuẩn bị dữ liệu cho <strong>{project.name}</strong>
          </p>
        </motion.div>

        {/* Processing Steps */}
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
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step.status === 'processing'
                  ? 'bg-primary/20 text-primary'
                  : step.status === 'completed'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step.status === 'processing' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : step.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
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
                  Đang xử lý...
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tiến độ</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>

          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-gradient-to-r from-blue-600 to-violet-600 h-2 rounded-full"
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
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-full px-4 py-2">
            <AlertCircle className="h-4 w-4" />
            <span>{statusMessage}</span>
          </div>
        </motion.div>

        {/* Project Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="mt-8 bg-muted/50 rounded-lg p-6"
        >
          <h3 className="font-semibold mb-4">Thông tin project</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Thương hiệu của bạn</h4>
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
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Đối thủ cạnh tranh</h4>
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
      </div>
    </div>
  )
}
