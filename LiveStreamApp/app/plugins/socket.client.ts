import { defineNuxtPlugin } from '#app'
import { io, Socket } from 'socket.io-client'

export default defineNuxtPlugin((nuxtApp) => {
  // Use relative path to let Socket.io auto-detect host (works for localhost and production)
  const socket: Socket = io({
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true
  })

  // Global listeners for debugging
  socket.on('connect', () => {
    console.log('[Socket Plugin] Connected:', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.error('[Socket Plugin] Connection Error:', err)
  })

  socket.on('disconnect', (reason) => {
    console.warn('[Socket Plugin] Disconnected:', reason)
  })

  return {
    provide: {
      socket
    }
  }
})
