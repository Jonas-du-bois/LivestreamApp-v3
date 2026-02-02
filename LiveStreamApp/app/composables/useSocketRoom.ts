import { useSocket } from './useSocket'

interface SocketEventHandler {
  event: string
  handler: (...args: any[]) => void
}

/**
 * Composable for managing socket room subscriptions with proper lifecycle handling.
 * Handles:
 * - Joining rooms on mount/connect
 * - Leaving rooms on unmount
 * - Re-joining rooms on reconnect
 * - Proper event listener cleanup
 */
export const useSocketRoom = (
  rooms: string | string[],
  events: SocketEventHandler[] = []
) => {
  const socket = useSocket()
  const roomList = Array.isArray(rooms) ? rooms : [rooms]
  
  // Store wrapped handlers for proper cleanup
  const wrappedHandlers = new Map<string, (...args: any[]) => void>()
  
  console.log(`[useSocketRoom] Initializing with rooms: ${roomList.join(', ')}`)
  
  const joinRooms = () => {
    roomList.forEach(room => {
      socket.emit('join-room', room)
      console.log(`[useSocketRoom] Emitted join-room: ${room}`)
    })
  }

  const leaveRooms = () => {
    roomList.forEach(room => {
      socket.emit('leave-room', room)
      console.log(`[useSocketRoom] Left room: ${room}`)
    })
  }

  const registerEvents = () => {
    events.forEach(({ event, handler }) => {
      console.log(`[useSocketRoom] Registering event: ${event}`)
      
      // Create wrapped handler with logging
      const wrappedHandler = (...args: any[]) => {
        console.log(`[useSocketRoom] 📨 Received event: ${event}`, args)
        handler(...args)
      }
      
      // Store for cleanup
      wrappedHandlers.set(event, wrappedHandler)
      
      socket.on(event, wrappedHandler)
    })
  }

  const unregisterEvents = () => {
    events.forEach(({ event }) => {
      const wrappedHandler = wrappedHandlers.get(event)
      if (wrappedHandler) {
        socket.off(event, wrappedHandler)
        wrappedHandlers.delete(event)
      }
    })
  }

  const handleConnect = () => {
    console.log('[useSocketRoom] Socket connected, joining rooms...')
    joinRooms()
  }

  onMounted(() => {
    console.log(`[useSocketRoom] onMounted - socket.connected: ${socket.connected}, socket.id: ${socket.id}`)
    
    // Register event listeners first
    registerEvents()
    
    // Also listen for reconnections
    socket.on('connect', handleConnect)

    // Join rooms now if already connected
    if (socket.connected) {
      joinRooms()
    } else {
      console.log('[useSocketRoom] Socket not connected yet, waiting for connect event...')
    }
  })

  onBeforeUnmount(() => {
    console.log('[useSocketRoom] onBeforeUnmount - leaving rooms')
    // Leave rooms
    leaveRooms()
    
    // Remove all event listeners
    unregisterEvents()
    socket.off('connect', handleConnect)
  })

  return {
    socket,
    joinRooms,
    leaveRooms
  }
}
