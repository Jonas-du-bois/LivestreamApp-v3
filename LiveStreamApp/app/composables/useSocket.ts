import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const useSocket = () => {
  if (!socket) {
    // Determine URL if needed, but relative path usually works if served from same origin
    socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'], // Fallback
      autoConnect: true
    })

    socket.on('connect', () => {
      console.log('[useSocket] Connected:', socket?.id)
    })

    socket.on('connect_error', (err) => {
      console.error('[useSocket] Connection Error:', err)
    })
  }
  return socket
}
