/**
 * Hook to manage project-specific WebSocket connections
 * Connects to /projects/{project_id} only when URL has ?project={project_id}
 * Disconnects immediately when leaving the page or project param is removed
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { WebSocketService, createProjectWebSocket } from '@/services/websocketService'

interface UseProjectWebSocketOptions {
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: any) => void
}

export function useProjectWebSocket(options: UseProjectWebSocketOptions = {}) {
  const router = useRouter()
  const wsRef = useRef<WebSocketService | null>(null)
  const currentProjectIdRef = useRef<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract project ID from URL
  const projectId = (router.query.project as string) || null

  // Connect to WebSocket for specific project
  const connectToProject = useCallback(async (projectId: string) => {
    // Disconnect existing connection if any
    if (wsRef.current) {
      wsRef.current.disconnect()
      wsRef.current = null
    }

    try {
      // Create new WebSocket connection for this project
      const ws = createProjectWebSocket(projectId)

      // Setup event listeners
      ws.on('connected', () => {
        console.log(`[WebSocket] Connected to project: ${projectId}`)
        setIsConnected(true)
        setError(null)
        currentProjectIdRef.current = projectId
        options.onConnect?.()
      })

      ws.on('disconnected', (code: number, reason: string) => {
        console.log(`[WebSocket] Disconnected from project: ${projectId}`, { code, reason })
        setIsConnected(false)
        currentProjectIdRef.current = null
        options.onDisconnect?.()
      })

      ws.on('error', (err: any) => {
        console.error(`[WebSocket] Error for project: ${projectId}`, err)
        setError(err?.message || 'WebSocket error')
        options.onError?.(err)
      })

      ws.on('message', (message: any) => {
        console.log(`[WebSocket] Message from project: ${projectId}`, message)
        options.onMessage?.(message)
      })

      // Store reference and connect
      wsRef.current = ws
      await ws.connect()

    } catch (err) {
      console.error(`[WebSocket] Failed to connect to project: ${projectId}`, err)
      setError(err instanceof Error ? err.message : 'Connection failed')
      setIsConnected(false)
    }
  }, [options])

  // Disconnect from current WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log(`[WebSocket] Disconnecting from project: ${currentProjectIdRef.current}`)
      wsRef.current.disconnect()
      wsRef.current = null
      setIsConnected(false)
      currentProjectIdRef.current = null
    }
  }, [])

  // Main effect: Connect/disconnect based on URL param
  useEffect(() => {
    const hasProjectParam = projectId !== null && projectId !== undefined

    if (hasProjectParam) {
      // Connect to WebSocket for this project
      if (currentProjectIdRef.current !== projectId) {
        console.log(`[WebSocket] URL changed to project: ${projectId}`)
        connectToProject(projectId)
      }
    } else {
      // No project param → disconnect immediately
      if (currentProjectIdRef.current !== null) {
        console.log(`[WebSocket] No project param, disconnecting`)
        disconnect()
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      disconnect()
    }
  }, [projectId, connectToProject, disconnect])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        console.log(`[WebSocket] Component unmounting, disconnecting`)
        wsRef.current.disconnect()
      }
    }
  }, [])

  return {
    isConnected,
    error,
    projectId: currentProjectIdRef.current,
    disconnect
  }
}
