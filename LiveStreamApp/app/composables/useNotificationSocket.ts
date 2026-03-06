import { useSocket } from './useSocket'
import { useNotificationsStore, useFavoritesStore, useSocketStore } from '#imports'

interface StreamUpdatePayload {
  _id?: string
  name?: string
  location?: string
  url?: string
  isLive?: boolean
  currentPassage?: {
    _id?: string
    group?: { _id?: string; name?: string }
    apparatus?: { _id?: string; name?: string; code?: string }
  } | null
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
 * Écoute les événements socket pour créer des notifications.
 *
 * Stratégie anti-doublon :
 * - Si l'utilisateur a un abonnement push actif → le serveur envoie déjà le push,
 *   on ajoute seulement au store in-app.
 * - Sinon → on ajoute au store ET on affiche une notification navigateur.
 */
export const useNotificationSocket = () => {
  const socket = useSocket()
  const socketStore = useSocketStore()
  const notificationsStore = useNotificationsStore()
  const favoritesStore = useFavoritesStore()
  
  const isSetup = useState('notification-socket-setup', () => false)
  
  /**
   * Vérifie si l'utilisateur a un abonnement push actif.
   * L'endpoint est enregistré dans favoritesStore lors de l'abonnement.
   */
  const hasPushSubscription = computed(() => !!favoritesStore.endpoint)
  
  const handleStreamUpdate = (payload: StreamUpdatePayload) => {
    if (!payload.currentPassage?._id) return

    const passageId = payload.currentPassage._id

    // Ne notifier que les passages en favoris
    if (!favoritesStore.favorites.includes(passageId)) return

    const groupName = payload.currentPassage.group?.name || 'Groupe'
    const apparatusName = payload.currentPassage.apparatus?.name || 'appareil'

    notificationsStore.notifyLive(
      groupName,
      apparatusName,
      hasPushSubscription.value,
      '/stream'
    )
  }

  const handleScoreUpdate = (payload: ScoreUpdatePayload) => {
    if (!payload.passageId || !favoritesStore.favorites.includes(payload.passageId)) return

    if (payload.score !== undefined && payload.groupName) {
      notificationsStore.notifyScore(
        payload.groupName,
        payload.apparatusName || payload.apparatusCode,
        payload.score,
        hasPushSubscription.value,
        '/results'
      )
    }
  }

  const handleScheduleUpdate = () => {
    // Les mises à jour de schedule sont gérées par les composants concernés
  }

  const setupListeners = () => {
    if (isSetup.value) return
    
    socketStore.subscribeToRooms(['streams', 'live-scores', 'schedule-updates'])
    
    socket.on('stream-update', handleStreamUpdate)
    socket.on('score-update', handleScoreUpdate)
    socket.on('schedule-update', handleScheduleUpdate)
    
    isSetup.value = true
  }

  const cleanupListeners = () => {
    socket.off('stream-update', handleStreamUpdate)
    socket.off('score-update', handleScoreUpdate)
    socket.off('schedule-update', handleScheduleUpdate)
    
    socketStore.unsubscribeFromRooms(['streams', 'live-scores', 'schedule-updates'])
    
    isSetup.value = false
  }

  if (import.meta.client) {
    onMounted(() => {
      if (socket.connected) {
        setupListeners()
      } else {
        socket.on('connect', () => setupListeners())
      }
    })

    onBeforeUnmount(() => {
      cleanupListeners()
    })
  }

  return {
    setupListeners,
    cleanupListeners,
    hasPushSubscription
  }
}
