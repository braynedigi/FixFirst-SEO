'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface AuditUpdate {
  status?: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  stage?: string
  progress?: number
  message?: string
  totalScore?: number
  categoryScores?: any
  error?: string
}

interface UseAuditWebSocketOptions {
  auditId: string
  onUpdate?: (update: AuditUpdate) => void
  onComplete?: (data: AuditUpdate) => void
  onError?: (error: string) => void
}

export function useAuditWebSocket({ auditId, onUpdate, onComplete, onError }: UseAuditWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<AuditUpdate | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!auditId) return

    // Connect to WebSocket server
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log(`🔌 Connected to WebSocket server`)
      setIsConnected(true)
      
      // Join the audit room
      socket.emit('join-audit', auditId)
    })

    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected from WebSocket server`)
      setIsConnected(false)
    })

    // Listen for audit updates
    socket.on(`audit:${auditId}`, (update: AuditUpdate) => {
      console.log(`📡 Received update for audit ${auditId}:`, update)
      
      setLastUpdate(update)

      // Call update callback
      if (onUpdate) {
        onUpdate(update)
      }

      // Handle completion
      if (update.status === 'COMPLETED' && onComplete) {
        onComplete(update)
      }

      // Handle error
      if (update.status === 'FAILED' && onError) {
        onError(update.error || 'Audit failed')
      }
    })

    return () => {
      // Leave the audit room
      if (socket.connected) {
        socket.emit('leave-audit', auditId)
      }
      socket.disconnect()
    }
  }, [auditId, onUpdate, onComplete, onError])

  return {
    isConnected,
    lastUpdate,
    socket: socketRef.current,
  }
}

