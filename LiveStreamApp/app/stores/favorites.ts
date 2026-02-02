import { defineStore } from 'pinia';
import { NotificationService } from '../services/notification.service';
import { urlBase64ToUint8Array } from '../utils/webPush';

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favorites: [] as string[], // Now stores passage IDs instead of group IDs
    endpoint: null as string | null,
  }),
  actions: {
    async toggleFavorite(passageId: string) {
      const isAdding = !this.favorites.includes(passageId);

      if (isAdding) {
        this.favorites.push(passageId);

        // --- NOTIFICATION LOGIC (First Like) ---
        if (!this.endpoint && typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
          try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const config = useRuntimeConfig();
              const vapidKey = config.public.vapidPublicKey;

              if (vapidKey) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(vapidKey)
                });

                const subJson = subscription.toJSON();
                if (subJson.endpoint && subJson.keys && subJson.keys.p256dh && subJson.keys.auth) {
                  await NotificationService.subscribe({
                    endpoint: subJson.endpoint,
                    keys: {
                      p256dh: subJson.keys.p256dh,
                      auth: subJson.keys.auth
                    }
                  }, this.favorites);

                  this.endpoint = subJson.endpoint;
                }
              }
            }
          } catch (err) {
            console.error('[Favorites] Subscription failed:', err);
          }
        }
      } else {
        this.favorites = this.favorites.filter(id => id !== passageId);
      }

      await this.sync();
    },
    isFavorite(passageId: string): boolean {
      return this.favorites.includes(passageId);
    },
    async setEndpoint(endpoint: string) {
      this.endpoint = endpoint;
      await this.sync();
    },
    async sync() {
      if (this.endpoint) {
        try {
          await NotificationService.syncFavorites(this.endpoint, this.favorites);
        } catch (err) {
          console.error('Sync failed', err);
        }
      }
    }
  },
  persist: true,
});
