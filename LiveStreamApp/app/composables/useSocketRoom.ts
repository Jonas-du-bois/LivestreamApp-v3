import { useSocket } from './useSocket'
import { useSocketStore } from '#imports'

interface SocketEventHandler {
  event: string
  handler: (...args: any[]) => void
}

/**
 * Gestion des salles socket avec compteur de références.
 * Évite les join/leave redondants lors de la navigation entre pages
 * quand plusieurs composants écoutent la même salle.
 */
export const useSocketRoom = (
  rooms: string | string[],
  events: SocketEventHandler[] = []
) => {
  const socket = useSocket()
  const socketStore = useSocketStore()
  const roomList = Array.isArray(rooms) ? rooms : [rooms]

  // Stocke les références des handlers pour pouvoir les retirer proprement
  const registeredHandlers = new Map<string, (...args: any[]) => void>()

  const registerEvents = () => {
    events.forEach(({ event, handler }) => {
      registeredHandlers.set(event, handler)
      socket.on(event, handler)
    })
    if (import.meta.dev) {
      console.log(`[SocketRoom] Registered events: [${events.map(e => e.event).join(', ')}] for rooms [${roomList.join(', ')}]`)
    }
  }

  const unregisterEvents = () => {
    events.forEach(({ event }) => {
      const handler = registeredHandlers.get(event)
      if (handler) {
        socket.off(event, handler)
        registeredHandlers.delete(event)
      }
    })
  }

  const handleConnect = () => {
    console.log(`[SocketRoom] Reconnected → re-subscribing rooms [${roomList.join(', ')}]`)
    socketStore.subscribeToRooms(roomList)
  }

  onMounted(() => {
    registerEvents()
    socketStore.subscribeToRooms(roomList)
    socket.on('connect', handleConnect)
  })

  onBeforeUnmount(() => {
    unregisterEvents()
    socket.off('connect', handleConnect)
    socketStore.unsubscribeFromRooms(roomList)
  })

  return {
    socket
  }
}
