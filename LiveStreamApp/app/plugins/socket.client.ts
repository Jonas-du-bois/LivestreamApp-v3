import { defineNuxtPlugin } from '#app'
import { io, Socket } from 'socket.io-client'
import { isNativePlatform } from '~/utils/capacitor'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  // En mode Capacitor, on doit se connecter avec l'URL absolue du serveur
  // En mode Web, on garde la connexion relative (auto-detect host)
  const socketUrl = isNativePlatform() ? (config.public.socketUrl as string) : undefined

  const socket: Socket = io(socketUrl || '', {
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
