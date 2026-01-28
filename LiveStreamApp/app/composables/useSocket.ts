import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

// Simple noop socket used during SSR to avoid attempting connections from the server
const noopSocket = {
  on: () => {},
  off: () => {},
  emit: () => {},
  disconnect: () => {}
} as unknown as Socket

export const useSocket = () => {
  // Ensure we only create a real socket in the browser
  if (typeof window === 'undefined') {
    return noopSocket
  }

  if (!socket) {
    // Use full origin to avoid ambiguous host resolution (helps in some dev/proxy setups)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    socket = io(origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'], // try websocket first, fallback to polling
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    })

    socket.on('connect', () => {
      console.log('[useSocket] Connected:', socket?.id)
    })

    socket.on('connect_error', (err) => {
      console.error('[useSocket] Connection Error:', err)
    })

    socket.on('error', (err) => {
      console.error('[useSocket] Error:', err)
    })

    socket.on('disconnect', (reason) => {
      console.warn('[useSocket] Disconnected:', reason)
    })
  }

  return socket
}
