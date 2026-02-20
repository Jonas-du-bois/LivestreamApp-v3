import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSocket } from '../composables/useSocket'

export const useSocketStore = defineStore('socket', () => {
  const socket = useSocket()
  const activeRooms = ref<Set<string>>(new Set())
  const roomReferences = ref<Record<string, number>>({})

  /**
   * Demande à rejoindre des salles de manière optimisée.
   */
  const subscribeToRooms = (rooms: string[]) => {
    rooms.forEach(room => {
      roomReferences.value[room] = (roomReferences.value[room] || 0) + 1

      if (!activeRooms.value.has(room)) {
        socket.emit('join-room', room)
        activeRooms.value.add(room)
      }
    })
  }

  /**
   * Demande à quitter des salles.
   */
  const unsubscribeFromRooms = (rooms: string[]) => {
    rooms.forEach(room => {
      if (roomReferences.value[room] > 0) {
        roomReferences.value[room]--
      }

      if (roomReferences.value[room] === 0 && activeRooms.value.has(room)) {
        socket.emit('leave-room', room)
        activeRooms.value.delete(room)
      }
    })
  }

  return {
    activeRooms,
    subscribeToRooms,
    unsubscribeFromRooms
  }
})
