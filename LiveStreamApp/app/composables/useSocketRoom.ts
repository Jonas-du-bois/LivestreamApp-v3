import { useSocket } from './useSocket'
import { useSocketStore } from '#imports'

interface SocketEventHandler {
  event: string
  handler: (...args: any[]) => void
}

/**
 * Composable optimisé pour la gestion des salles socket.
 * Utilise un store centralisé avec compteur de références pour éviter de surcharger
 * le serveur avec des messages join/leave lors de la navigation entre pages.
 */
export const useSocketRoom = (
  rooms: string | string[],
  events: SocketEventHandler[] = []
) => {
  const socket = useSocket()
  const socketStore = useSocketStore()
  const roomList = Array.isArray(rooms) ? rooms : [rooms]
  
  const wrappedHandlers = new Map<string, (...args: any[]) => void>()
  
  const registerEvents = () => {
    events.forEach(({ event, handler }) => {
      const wrappedHandler = (...args: any[]) => {
        handler(...args)
      }
      wrappedHandlers.set(event, wrappedHandler)
      socket.on(event, wrappedHandler)
    })
    if (import.meta.dev) {
      console.log(`[SocketRoom] Registered events: [${events.map(e => e.event).join(', ')}] for rooms [${roomList.join(', ')}]`)
    }
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
    console.log(`[SocketRoom] Reconnected → re-subscribing rooms [${roomList.join(', ')}]`)
    socketStore.subscribeToRooms(roomList)
  }

  onMounted(() => {
    // 1. Enregistrement des écouteurs d'événements (local au composant)
    registerEvents()
    
    // 2. Gestion des salles via le Store (Optimisé)
    socketStore.subscribeToRooms(roomList)

    // 3. Gestion de la reconnexion
    socket.on('connect', handleConnect)
  })

  onBeforeUnmount(() => {
    // 1. Nettoyage des événements
    unregisterEvents()
    socket.off('connect', handleConnect)

    // 2. Libération des salles dans le Store
    socketStore.unsubscribeFromRooms(roomList)
  })

  return {
    socket
  }
}
