import { useSocket } from './useSocket'
import { useNotificationsStore } from '#imports'

interface StreamUpdatePayload {
  _id?: string
  name?: string
  location?: string
  url?: string
  isLive?: boolean
  currentPassage?: any
}

interface ScoreUpdatePayload {
  passageId: string
  groupName: string
  apparatusCode: string
  apparatusName?: string
  score: number
  rank?: number
  status?: string
}

/**
 * Composable pour écouter les événements socket et créer des notifications in-app.
 * À utiliser dans le layout ou un composant de haut niveau.
 */
export const useNotificationSocket = () => {
  const socket = useSocket()
  const notificationsStore = useNotificationsStore()
  
  // Track streams that were previously offline (persistent across re-renders)
  const previousStreamStates = useState<Map<string, boolean>>('stream-states', () => new Map())
  
  // Track if listeners are already set up
  const isSetup = useState('notification-socket-setup', () => false)
  
  const handleStreamUpdate = (payload: StreamUpdatePayload) => {
    console.log('[NotificationSocket] stream-update received:', payload)
    if (!payload._id) return
    
    const wasLive = previousStreamStates.value.get(payload._id) ?? false
    const isNowLive = payload.isLive ?? false
    
    // Notify when stream goes live
    if (!wasLive && isNowLive && payload.name) {
      console.log('[NotificationSocket] Stream went live, creating notification')
      notificationsStore.notifyStreamOnline(
        payload.name,
        '/stream'
      )
    }
    
    previousStreamStates.value.set(payload._id, isNowLive)
  }

  const handleScoreUpdate = (payload: ScoreUpdatePayload) => {
    console.log('[NotificationSocket] score-update received:', payload)
    if (payload.score !== undefined && payload.groupName) {
      notificationsStore.notifyScore(
        payload.groupName,
        payload.apparatusName || payload.apparatusCode,
        payload.score,
        '/results'
      )
    }
  }

  const handleScheduleUpdate = () => {
    console.log('[NotificationSocket] schedule-update received')
    // Schedule updates are handled by other components, we just log here
  }

  const setupListeners = () => {
    if (isSetup.value) {
      console.log('[NotificationSocket] Already setup, skipping')
      return
    }
    
    // Join the notification rooms
    socket.emit('join-room', 'streams')
    socket.emit('join-room', 'live-scores')
    socket.emit('join-room', 'schedule-updates')
    
    // Register event listeners
    socket.on('stream-update', handleStreamUpdate)
    socket.on('score-update', handleScoreUpdate)
    socket.on('schedule-update', handleScheduleUpdate)
    
    isSetup.value = true
    console.log('[NotificationSocket] Listeners registered and rooms joined')
  }

  const cleanupListeners = () => {
    socket.off('stream-update', handleStreamUpdate)
    socket.off('score-update', handleScoreUpdate)
    socket.off('schedule-update', handleScheduleUpdate)
    
    // Leave rooms
    socket.emit('leave-room', 'streams')
    socket.emit('leave-room', 'live-scores')
    socket.emit('leave-room', 'schedule-updates')
    
    isSetup.value = false
    console.log('[NotificationSocket] Listeners cleaned up')
  }

  // Auto setup on mount (client-side only)
  if (import.meta.client) {
    onMounted(() => {
      // Wait for socket to be connected
      if (socket.connected) {
        setupListeners()
      } else {
        socket.on('connect', () => {
          console.log('[NotificationSocket] Socket connected, setting up listeners')
          setupListeners()
        })
      }
    })

    onBeforeUnmount(() => {
      cleanupListeners()
    })
  }

  return {
    setupListeners,
    cleanupListeners
  }
}
