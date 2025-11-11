import { EventEmitter } from 'events'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export interface WebSocketConfig {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isConnecting = false
  private isConnected = false

  constructor(config: WebSocketConfig) {
    super()
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isConnected) {
        resolve()
        return
      }

      this.isConnecting = true

      try {
        this.ws = new WebSocket(this.config.url)

        this.ws.onopen = () => {
          this.isConnected = true
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.emit('connected')
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.emit('message', message)
            this.emit(message.type, message.data)
          } catch (error) {
            this.emit('error', new Error('Failed to parse message'))
          }
        }

        this.ws.onclose = (event) => {
          this.isConnected = false
          this.isConnecting = false
          this.stopHeartbeat()
          this.emit('disconnected', event.code, event.reason)

          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          this.isConnecting = false
          this.emit('error', error)
          reject(error)
        }

      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.stopHeartbeat()
    this.clearReconnectTimeout()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.isConnected = false
    this.isConnecting = false
  }

  send(message: WebSocketMessage): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message))
    } else {
      throw new Error('WebSocket is not connected')
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'ping',
          data: { timestamp: Date.now() },
          timestamp: Date.now()
        })
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1)

    this.reconnectTimeout = setTimeout(() => {
      this.emit('reconnecting', this.reconnectAttempts)
      this.connect().catch(() => {

      })
    }, delay)
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  getConnectionState(): {
    isConnected: boolean
    isConnecting: boolean
    reconnectAttempts: number
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

export const dashboardWebSocket = new WebSocketService({
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/dashboard',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000
})
