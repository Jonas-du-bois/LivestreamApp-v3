import { defineStore } from 'pinia'
import type { AppNotification, NotificationType } from '../types/notifications'

// ⚠️ DEAD CODE : re-exports inutilisés — les consommateurs importent directement depuis '~/types/notifications'
// export type { AppNotification, NotificationType }

interface NotificationsState {
  notifications: AppNotification[]
}

// Contenu prédéfini pour les notifications de test (admin dashboard)
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
     * Ajoute une notification au store in-app sans déclencher de notification navigateur.
     * Utilisé lorsque le serveur a déjà envoyé un push via WebPush/FCM.
     */
    addToStore(notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): AppNotification {
      const newNotification: AppNotification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        isRead: false
      }
      // Limite le store à 50 notifications pour éviter une croissance mémoire infinie
      this.notifications = [newNotification, ...this.notifications.slice(0, 49)]
      return newNotification
    },

    /**
     * Affiche une notification native du navigateur (sans impact sur le store).
     * Fallback pour les utilisateurs non abonnés aux push notifications.
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
     * Force l'ajout au store ET l'affichage navigateur simultanément.
     * Réservé aux tests admin ou aux cas où les deux canaux sont nécessaires.
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
     * Point d'entrée principal pour les événements temps réel (socket).
     * Ajoute toujours au store, mais n'affiche la notification navigateur
     * que si l'utilisateur n'a pas d'abonnement push (évite les doublons).
     */
    async notifyIfNeeded(
      notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>,
      hasPushSubscription: boolean
    ): Promise<AppNotification> {
      const newNotification = this.addToStore(notification)
      
      // Évite le doublon : le serveur envoie déjà le push aux abonnés WebPush/FCM
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

    // --- Gestion des notifications ---
    
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

    // ⚠️ DEAD CODE : jamais appelé dans l'application
    // clearAll() {
    //   this.notifications = []
    // },

    clearRead() {
      this.notifications = this.notifications.filter(n => !n.isRead)
    },

    // --- Helpers typés pour les événements socket (utilisent notifyIfNeeded) ---
    
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

    // ⚠️ DEAD CODE : helper prévu mais jamais connecté aux événements socket
    // notifyReminder(groupName: string, apparatusName: string, minutesUntil: number, hasPushSubscription: boolean, url?: string) {
    //   return this.notifyIfNeeded({
    //     title: '⏰ Passage imminent',
    //     message: `${groupName} passe au ${apparatusName} dans ${minutesUntil} min`,
    //     type: 'reminder',
    //     icon: 'fluent:clock-alarm-24-regular',
    //     url
    //   }, hasPushSubscription)
    // },

    // ⚠️ DEAD CODE : helper prévu mais jamais connecté aux événements socket
    // notifyStreamOnline(streamName: string, hasPushSubscription: boolean, url?: string) {
    //   return this.notifyIfNeeded({
    //     title: '📺 Nouveau direct',
    //     message: `${streamName} est maintenant en ligne`,
    //     type: 'info',
    //     icon: 'fluent:video-24-regular',
    //     url
    //   }, hasPushSubscription)
    // },

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
    storage: {
      getItem: (key: string) => {
        try { return typeof window !== 'undefined' ? localStorage.getItem(key) : null; } catch (e) { return null; }
      },
      setItem: (key: string, value: string) => {
        try { if (typeof window !== 'undefined') localStorage.setItem(key, value); } catch (e) { console.warn('Storage quota exceeded'); }
      }
    },
    pick: ['notifications']
  }
})
