import { defineNuxtPlugin } from '#app'
import { io, Socket } from 'socket.io-client'
import { isNativePlatform } from '~/utils/capacitor'
import {
  SOCKET_RECONNECTION_DELAY,
  SOCKET_RECONNECTION_DELAY_MAX,
  SOCKET_TIMEOUT
} from '~/utils/timings'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  // En mode Capacitor, on doit se connecter avec l'URL absolue du serveur
  // En mode Web, on garde la connexion relative (auto-detect host)
  const socketUrl = isNativePlatform() ? (config.public.socketUrl as string) : undefined

  const socket: Socket = io(socketUrl || '', {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    // PWA-critical: reconnect indefinitely (live event can last hours)
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: SOCKET_RECONNECTION_DELAY,
    reconnectionDelayMax: SOCKET_RECONNECTION_DELAY_MAX,
    timeout: SOCKET_TIMEOUT,
    autoConnect: true
  })

  // Global listeners for debugging
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection Error:', err.message)
  })

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason)
    // If server closed the connection, reconnect manually
    if (reason === 'io server disconnect') {
      socket.connect()
    }
  })

  socket.on('reconnect', (attempt: number) => {
    console.log('[Socket] Reconnected after', attempt, 'attempts')
  })

  socket.on('reconnect_attempt', (attempt: number) => {
    if (attempt % 5 === 0) {
      console.log('[Socket] Reconnection attempt', attempt)
    }
  })

  // PWA: Reconnect when app comes back to foreground
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        console.log('[Socket] App visible, reconnecting...')
        socket.connect()
      }
    })
  }

  return {
    provide: {
      socket
    }
  }
})
