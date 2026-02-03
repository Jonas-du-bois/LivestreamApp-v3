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
    allNotifications(): AppNotification[] {
      return [...this.notifications].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    },

    unreadCount(): number {
      return this.notifications.filter(n => !n.isRead).length
    },

    hasUnread(): boolean {
      return this.notifications.some(n => !n.isRead)
    }
  },

  actions: {
    /**
     * Ajoute une notification UNIQUEMENT au store in-app (pas de notification navigateur)
     * Utilisé quand le serveur envoie déjà un push notification
     */
    addToStore(notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): AppNotification {
      const newNotification: AppNotification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        isRead: false
      }
      this.notifications = [newNotification, ...this.notifications.slice(0, 49)]
      return newNotification
    },

    /**
     * Affiche une notification navigateur (sans l'ajouter au store)
     * Utilisé pour les utilisateurs non-abonnés aux push
     */
    async showBrowserNotification(notification: { title: string; message: string; url?: string; type?: NotificationType }): Promise<boolean> {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return false
      }
      
      if (Notification.permission !== 'granted') {
        return false
      }

      try {
        const tag = `notif-${Date.now()}`
        const registration = await navigator.serviceWorker?.ready
        
        if (registration) {
          await registration.showNotification(notification.title, {
            body: notification.message,
            icon: '/icons/logo_livestreamappv3-192.png',
            badge: '/icons/logo_livestreamappv3-192.png',
            tag,
            data: { url: notification.url || '/' },
            requireInteraction: notification.type === 'live' || notification.type === 'reminder'
          })
        } else {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icons/logo_livestreamappv3-192.png',
            tag
          })
        }
        return true
      } catch (e) {
        console.warn('[Notifications] Failed to show browser notification:', e)
        return false
      }
    },

    /**
     * Méthode unifiée : ajoute au store ET affiche notification navigateur
     * Utilisé pour les tests admin ou quand on veut forcer les 2
     */
    async notify(notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): Promise<AppNotification> {
      const newNotification = this.addToStore(notification)
      await this.showBrowserNotification({
        title: notification.title,
        message: notification.message,
        url: notification.url,
        type: notification.type
      })
      return newNotification
    },

    /**
     * Méthode intelligente : ajoute au store + affiche notification navigateur SEULEMENT si pas d'abonnement push
     * C'est LA méthode à utiliser pour les événements temps réel (socket)
     * @param notification - Les données de la notification
     * @param hasPushSubscription - true si l'utilisateur est abonné aux push (le serveur envoie déjà le push)
     */
    async notifyIfNeeded(
      notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>,
      hasPushSubscription: boolean
    ): Promise<AppNotification> {
      // Toujours ajouter au store in-app
      const newNotification = this.addToStore(notification)
      
      // Afficher notification navigateur SEULEMENT si pas d'abonnement push
      // (sinon le serveur l'a déjà envoyée via WebPush)
      if (!hasPushSubscription) {
        await this.showBrowserNotification({
          title: notification.title,
          message: notification.message,
          url: notification.url,
          type: notification.type
        })
      }
      
      return newNotification
    },

    // === Actions de gestion ===
    
    markAsRead(notificationId: string) {
      const idx = this.notifications.findIndex(n => n.id === notificationId)
      if (idx !== -1 && this.notifications[idx]) {
        this.notifications[idx].isRead = true
      }
    },

    markAllAsRead() {
      this.notifications = this.notifications.map(n => ({ ...n, isRead: true }))
    },

    removeNotification(notificationId: string) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId)
    },

    clearAll() {
      this.notifications = []
    },

    clearRead() {
      this.notifications = this.notifications.filter(n => !n.isRead)
    },

    // === HELPERS pour différents types (utilisent notifyIfNeeded) ===
    
    notifyLive(groupName: string, apparatusName: string, hasPushSubscription: boolean, url?: string) {
      return this.notifyIfNeeded({
        title: '🔴 En direct !',
        message: `${groupName} passe au ${apparatusName}`,
        type: 'live',
        icon: 'fluent:live-24-filled',
        url
      }, hasPushSubscription)
    },

    notifyScore(groupName: string, apparatusName: string, score: number, hasPushSubscription: boolean, url?: string) {
      return this.notifyIfNeeded({
        title: '🏆 Résultat disponible',
        message: `${groupName} - ${apparatusName}: ${score.toFixed(2)}`,
        type: 'score',
        icon: 'fluent:trophy-24-regular',
        url
      }, hasPushSubscription)
    },

    notifyReminder(groupName: string, apparatusName: string, minutesUntil: number, hasPushSubscription: boolean, url?: string) {
      return this.notifyIfNeeded({
        title: '⏰ Passage imminent',
        message: `${groupName} passe au ${apparatusName} dans ${minutesUntil} min`,
        type: 'reminder',
        icon: 'fluent:clock-alarm-24-regular',
        url
      }, hasPushSubscription)
    },

    notifyStreamOnline(streamName: string, hasPushSubscription: boolean, url?: string) {
      return this.notifyIfNeeded({
        title: '📺 Nouveau direct',
        message: `${streamName} est maintenant en ligne`,
        type: 'info',
        icon: 'fluent:video-24-regular',
        url
      }, hasPushSubscription)
    },

    // Pour les tests admin - force les 2 (in-app + navigateur)
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
    key: 'app-notifications',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    pick: ['notifications']
  }
})
