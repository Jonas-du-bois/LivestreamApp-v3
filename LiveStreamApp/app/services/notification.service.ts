import type { Subscription } from '../types/api'

export const NotificationService = {
  /**
   * Enregistre une subscription push sur le serveur (Web Push ou FCM natif).
   * Puis synchronise les favoris si nécessaire.
   */
  async subscribe(subscription: Subscription, favoritePassageIds: string[]) {
    await useApiClient<void>('/notifications/subscribe', {
      method: 'POST',
      body: subscription
    })

    // Sync des favoris dès l'inscription si l'utilisateur en a déjà
    if (favoritePassageIds.length > 0 && subscription.endpoint) {
      await this.syncFavorites(subscription.endpoint, favoritePassageIds)
    }
  },

  /** Synchronise la liste de passages favoris pour un abonné (identifié par son endpoint/token) */
  syncFavorites(endpoint: string, favorites: string[]) {
    return useApiClient<void>('/notifications/sync', {
      method: 'PUT',
      body: { favorites, endpoint }
    })
  }
}
