import { defineStore } from 'pinia'
import { useSocket } from '../composables/useSocket'

/**
 * Store centralisé pour la gestion des salles socket.io.
 * Utilise un pattern de comptage de références : plusieurs composants peuvent
 * souscrire à la même salle sans conflit, la déconnexion effective
 * n'a lieu que lorsque tous les abonnés se désinscrivent.
 */
export const useSocketStore = defineStore('socket', () => {
  const socket = useSocket()
  const activeRooms = ref<Set<string>>(new Set())
  const roomRefCounts = ref<Record<string, number>>({})

  const subscribeToRooms = (rooms: string[]) => {
    rooms.forEach(room => {
      roomRefCounts.value[room] = (roomRefCounts.value[room] || 0) + 1

      if (!activeRooms.value.has(room)) {
        socket.emit('join-room', room)
        activeRooms.value.add(room)
      }
    })
  }

  const unsubscribeFromRooms = (rooms: string[]) => {
    rooms.forEach(room => {
      const count = roomRefCounts.value[room]
      if (count !== undefined && count > 0) {
        roomRefCounts.value[room] = count - 1
      }

      // Ne quitte la salle que lorsque plus aucun composant ne l'utilise
      if ((roomRefCounts.value[room] ?? 0) === 0 && activeRooms.value.has(room)) {
        socket.emit('leave-room', room)
        activeRooms.value.delete(room)
      }
    })
  }

  return {
    // ⚠️ DEAD CODE : exposé mais jamais consommé par les composants
    activeRooms,
    subscribeToRooms,
    unsubscribeFromRooms
  }
})
