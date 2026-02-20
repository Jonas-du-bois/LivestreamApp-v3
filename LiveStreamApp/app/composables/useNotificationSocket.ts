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
 * Composable pour écouter les événements socket et créer des notifications.
 * 
 * LOGIQUE DE NOTIFICATION :
 * - Si l'utilisateur a un abonnement push actif : le serveur envoie déjà le push
 *   → On ajoute seulement au store in-app (pas de notification navigateur pour éviter les doublons)
 * - Si l'utilisateur n'a PAS d'abonnement push : le serveur n'envoie rien
 *   → On ajoute au store in-app ET on affiche une notification navigateur
 */
export const useNotificationSocket = () => {
  const socket = useSocket()
  const socketStore = useSocketStore()
  const notificationsStore = useNotificationsStore()
  const favoritesStore = useFavoritesStore()
  
  const isSetup = useState('notification-socket-setup', () => false)
  
  /**
   * Vérifie si l'utilisateur a un abonnement push actif
   * L'endpoint est stocké dans favoritesStore quand l'utilisateur s'abonne
   */
  const hasPushSubscription = computed(() => !!favoritesStore.endpoint)
  
  const handleStreamUpdate = (payload: StreamUpdatePayload) => {
    console.log('[NotificationSocket] stream-update received:', payload)
    
    if (payload.currentPassage?._id) {
      const passageId = payload.currentPassage._id
      
      // Ne notifier QUE si le passage est en favoris
      if (favoritesStore.isFavorite(passageId)) {
        const groupName = payload.currentPassage.group?.name || 'Groupe'
        const apparatusName = payload.currentPassage.apparatus?.name || 'appareil'
        
        // Utilise notifyIfNeeded : ajoute au store + notification navigateur seulement si pas d'abonnement push
        notificationsStore.notifyLive(
          groupName,
          apparatusName,
          hasPushSubscription.value,
          '/stream'
        )
      }
    }
  }

  const handleScoreUpdate = (payload: ScoreUpdatePayload) => {
    console.log('[NotificationSocket] score-update received:', payload)
    
    // Ne créer une notification que si le passage est en favoris
    if (payload.passageId && favoritesStore.isFavorite(payload.passageId)) {
      if (payload.score !== undefined && payload.groupName) {
        // Utilise notifyIfNeeded : ajoute au store + notification navigateur seulement si pas d'abonnement push
        notificationsStore.notifyScore(
          payload.groupName,
          payload.apparatusName || payload.apparatusCode,
          payload.score,
          hasPushSubscription.value,
          '/results'
        )
      }
    } else {
      console.log('[NotificationSocket] Score update ignored - passage not in favorites')
    }
  }

  const handleScheduleUpdate = () => {
    console.log('[NotificationSocket] schedule-update received')
    // Les mises à jour de schedule sont gérées par d'autres composants
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
    cleanupListeners,
    hasPushSubscription
  }
}
