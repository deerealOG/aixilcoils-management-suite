import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

export const useSocket = () => {
  const { accessToken } = useAuthStore()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    // Initialize socket connection
    const socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
      auth: {
        token: accessToken
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to WebSocket server')
    })

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason)
    })

    socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [accessToken])

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data)
    }
  }, [])

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
    // Return cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback)
      }
    }
  }, [])

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }, [])

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    connected: socketRef.current?.connected || false,
  }
}
