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

interface ProjectProcessingStateProps {
  projectId: string
}

interface WSMessage<T = any> {
  type: string
  payload: T
  timestamp: string
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
  const wsRef = useRef<WebSocket | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const maxReconnectAttempts = 5
  const baseDelay = 1000

  // Use the provided projectId or fall back to currentProject
  const project = projectId 
    ? state.projects.find(p => p.id === projectId) 
    : currentProject

  if (!project || project.status !== 'process') {
    return null
  }

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

  // Validate WSMessage format
  const validateWSMessage = useCallback((data: any): data is WSMessage => {
    if (!data || typeof data !== 'object') {
      console.error('Invalid message: not an object')
      return false
    }
    
    if (!data.type || typeof data.type !== 'string') {
      console.error('Invalid message: missing or invalid type field')
      return false
    }
    
    if (!data.payload) {
      console.error('Invalid message: missing payload field')
      return false
    }
    
    if (!data.timestamp || typeof data.timestamp !== 'string') {
      console.error('Invalid message: missing or invalid timestamp field')
      return false
    }
    
    return true
  }, [])

  // Validate ProgressPayload format
  const validateProgressPayload = useCallback((payload: any): payload is ProgressPayload => {
    if (!payload || typeof payload !== 'object') {
      console.error('Invalid progress payload: not an object')
      return false
    }
    
    if (!payload.project_id || typeof payload.project_id !== 'string') {
      console.error('Invalid progress payload: missing or invalid project_id')
      return false
    }
    
    if (!payload.status || typeof payload.status !== 'string') {
      console.error('Invalid progress payload: missing or invalid status')
      return false
    }
    
    const validStatuses = ['INITIALIZING', 'CRAWLING', 'PROCESSING', 'DONE', 'FAILED']
    if (!validStatuses.includes(payload.status)) {
      console.error('Invalid progress payload: invalid status value:', payload.status)
      return false
    }
    
    if (typeof payload.total !== 'number' || typeof payload.done !== 'number' || typeof payload.errors !== 'number') {
      console.error('Invalid progress payload: missing or invalid numeric fields')
      return false
    }
    
    return true
  }, [])

  const connectWebSocket = useCallback(() => {
    // Prevent multiple connections
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connected or connecting')
      return
    }

    // WebSocket URL from environment variable
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://smap-api.tantai.dev/ws'
    
    console.log('🔌 Connecting to WebSocket:', wsUrl)
    
    // Create WebSocket connection
    // Note: Cookies are sent automatically by browser for same-origin or with proper CORS
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected for project:', projectId)
      setReconnectAttempts(0)
      setStatusMessage('Connected. Waiting for updates...')
      
      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }))
        } else {
          clearInterval(pingInterval)
        }
      }, 30000)
      
      // Store interval ID for cleanup
      ;(ws as any).pingInterval = pingInterval
    }
    
    ws.onmessage = (event) => {
      try {
        // Parse incoming message
        const data = JSON.parse(event.data)
        
        // Validate message format against WSMessage interface
        if (!validateWSMessage(data)) {
          console.error('Message validation failed:', event.data)
          return
        }
        
        const message = data as WSMessage
        
        // Handle different message types
        switch (message.type) {
          case 'project_progress':
            // Validate progress payload
            if (!validateProgressPayload(message.payload)) {
              console.error('Progress payload validation failed:', message.payload)
              return
            }
            
            const progressData = message.payload as ProgressPayload
            
            // Only process messages for this project
            if (progressData.project_id === projectId) {
              // Update progress bar
              const progressPercent = progressData.progress_percent || 
                (progressData.total > 0 ? (progressData.done / progressData.total) * 100 : 0)
              setProgress(progressPercent)
              
              // Update status message
              setStatusMessage(getStatusMessage(progressData.status))
              
              // Update current step
              setCurrentStep(progressData.status)
              
              console.log(`📊 Progress update: ${Math.round(progressPercent)}% (${progressData.done}/${progressData.total})`)
            }
            break
            
          case 'project_completed':
            // Validate completion payload
            if (!validateProgressPayload(message.payload)) {
              console.error('Completion payload validation failed:', message.payload)
              return
            }
            
            const completedData = message.payload as ProgressPayload
            
            // Only process completion for this project
            if (completedData.project_id === projectId) {
              console.log('✅ Project completed:', projectId)
              
              // Update project status to 'completed' using DashboardContext
              updateProject({
                ...project,
                status: 'completed'
              })
            }
            break
            
          default:
            console.warn('Unknown message type:', message.type)
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
      setStatusMessage('Connection error. Retrying...')
    }
    
    ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason)
      
      // Clear ping interval
      if ((ws as any).pingInterval) {
        clearInterval((ws as any).pingInterval)
      }
      
      // Handle different close codes
      if (event.code === 1000) {
        // Normal closure
        console.log('WebSocket closed normally')
        return
      }
      
      if (event.code === 1008 || event.code === 401 || event.code === 403) {
        // Unauthorized - redirect to login
        console.error('Authentication failed. Redirecting to login...')
        setStatusMessage('Authentication failed. Redirecting...')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
        return
      }
      
      // Abnormal closure (1006) or other errors - attempt reconnect
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = baseDelay * Math.pow(2, reconnectAttempts)
        console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
        setStatusMessage(`Connection lost. Reconnecting in ${Math.round(delay/1000)}s...`)
        
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1)
          connectWebSocket()
        }, delay)
      } else {
        console.error('Max reconnection attempts reached')
        setStatusMessage('Connection failed. Please refresh the page.')
      }
    }
  }, [projectId, getStatusMessage, validateWSMessage, validateProgressPayload])
  
  useEffect(() => {
    // Only connect once when component mounts
    connectWebSocket()
    
    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        console.log('Cleaning up WebSocket connection')
        
        // Clear ping interval if exists
        if ((wsRef.current as any).pingInterval) {
          clearInterval((wsRef.current as any).pingInterval)
        }
        
        // Close connection
        wsRef.current.close(1000, 'Component unmounted')
        wsRef.current = null
      }
    }
  }, [projectId]) // Only reconnect if projectId changes

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
        {}
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

        {}
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

        {}
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

        {}
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

        {}
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
