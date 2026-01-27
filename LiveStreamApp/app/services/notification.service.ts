import type { Subscription } from '../types/api'

export const NotificationService = {
  async subscribe(subscription: Subscription, favoriteGroupIds: string[]) {
    await useApiClient<void>('/notifications/subscribe', {
      method: 'POST',
      body: subscription
    })

    // Chain syncFavorites if we have favorites and an endpoint
    if (favoriteGroupIds.length > 0 && subscription.endpoint) {
      await this.syncFavorites(subscription.endpoint, favoriteGroupIds)
    }
  },

  syncFavorites(endpoint: string, favorites: string[]) {
    return useApiClient<void>('/notifications/sync', {
      method: 'PUT',
      body: {
        favorites,
        endpoint
      } as any
    })
  }
}
