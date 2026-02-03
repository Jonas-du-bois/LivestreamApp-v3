import { defineStore } from 'pinia'
import type { AppNotification, NotificationType } from '../types/notifications'

export type { AppNotification, NotificationType }

interface NotificationsState {
  notifications: AppNotification[]
}

// Messages par défaut pour les tests
const DEFAULT_MESSAGES: Record<NotificationType, { title: string; message: string; icon: string }> = {
  info: { title: 'Information', message: 'Ceci est une notification de test', icon: 'fluent:info-24-regular' },
  success: { title: 'Succès', message: 'Opération réussie avec succès', icon: 'fluent:checkmark-circle-24-regular' },
  warning: { title: 'Attention', message: 'Quelque chose nécessite votre attention', icon: 'fluent:warning-24-regular' },
  live: { title: '🔴 En direct !', message: 'FSG Test passe au Sol maintenant', icon: 'fluent:live-24-filled' },
  score: { title: '🏆 Score publié', message: 'FSG Test - Sol: 9.45', icon: 'fluent:trophy-24-regular' },
  reminder: { title: '⏰ Rappel', message: 'FSG Test passe dans 15 minutes', icon: 'fluent:clock-alarm-24-regular' }
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): NotificationsState => ({
    notifications: []
  }),

  getters: {
    // Toutes les notifications triées par date (plus récentes en premier)
    allNotifications(): AppNotification[] {
      return [...this.notifications].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    },

    // Nombre de non lues
    unreadCount(): number {
      return this.notifications.filter(n => !n.isRead).length
    },

    // Y a-t-il des notifications non lues?
    hasUnread(): boolean {
      return this.notifications.some(n => !n.isRead)
    }
  },

  actions: {
    /**
     * Ajoute une notification au store ET déclenche une notification navigateur si possible
     * C'est LA méthode unifiée pour toutes les notifications
     */
    async notify(notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) {
      const newNotification: AppNotification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        isRead: false
      }

      // 1. Ajouter au store (in-app)
      this.notifications = [newNotification, ...this.notifications.slice(0, 49)]

      // 2. Déclencher la notification navigateur/OS (si permission accordée)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            // Utiliser le Service Worker si disponible (fonctionne même en arrière-plan)
            const registration = await navigator.serviceWorker?.ready
            if (registration) {
              await registration.showNotification(notification.title, {
                body: notification.message,
                icon: '/icons/logo_livestreamappv3-192.png',
                badge: '/icons/logo_livestreamappv3-192.png',
                tag: newNotification.id, // Évite les doublons
                data: { url: notification.url || '/' },
                requireInteraction: notification.type === 'live' || notification.type === 'reminder'
              })
            } else {
              // Fallback: notification directe (ne fonctionne qu'en premier plan)
              new Notification(notification.title, {
                body: notification.message,
                icon: '/icons/logo_livestreamappv3-192.png',
                tag: newNotification.id
              })
            }
          } catch (e) {
            console.warn('[Notifications] Failed to show browser notification:', e)
          }
        }
      }

      return newNotification
    },

    // Marquer une notification comme lue
    markAsRead(notificationId: string) {
      const idx = this.notifications.findIndex(n => n.id === notificationId)
      if (idx !== -1 && this.notifications[idx]) {
        this.notifications[idx].isRead = true
      }
    },

    // Marquer toutes comme lues
    markAllAsRead() {
      this.notifications = this.notifications.map(n => ({ ...n, isRead: true }))
    },

    // Supprimer une notification
    removeNotification(notificationId: string) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId)
    },

    // Vider toutes les notifications
    clearAll() {
      this.notifications = []
    },

    // Vider uniquement les notifications lues
    clearRead() {
      this.notifications = this.notifications.filter(n => !n.isRead)
    },

    // === HELPERS pour différents types de notifications ===
    
    notifyLive(groupName: string, apparatusName: string, url?: string) {
      return this.notify({
        title: '🔴 En direct !',
        message: `${groupName} passe au ${apparatusName}`,
        type: 'live',
        icon: 'fluent:live-24-filled',
        url
      })
    },

    notifyScore(groupName: string, apparatusName: string, score: number, url?: string) {
      return this.notify({
        title: '🏆 Résultat disponible',
        message: `${groupName} - ${apparatusName}: ${score.toFixed(2)}`,
        type: 'score',
        icon: 'fluent:trophy-24-regular',
        url
      })
    },

    notifyReminder(groupName: string, apparatusName: string, minutesUntil: number, url?: string) {
      return this.notify({
        title: '⏰ Passage imminent',
        message: `${groupName} passe au ${apparatusName} dans ${minutesUntil} min`,
        type: 'reminder',
        icon: 'fluent:clock-alarm-24-regular',
        url
      })
    },

    notifyStreamOnline(streamName: string, url?: string) {
      return this.notify({
        title: '📺 Nouveau direct',
        message: `${streamName} est maintenant en ligne`,
        type: 'info',
        icon: 'fluent:video-24-regular',
        url
      })
    },

    // Pour les tests depuis l'admin - envoie UNE notification (in-app + navigateur)
    sendTestNotification(type: NotificationType = 'info') {
      const msg = DEFAULT_MESSAGES[type]
      return this.notify({
        title: msg.title,
        message: msg.message,
        type,
        icon: msg.icon,
        url: '/'
      })
    }
  },

  persist: {
    // Configuration plus précise de la persistance
    key: 'app-notifications',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    pick: ['notifications'] // Ne persister que les notifications
  }
})
