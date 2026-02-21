import { defineStore } from 'pinia';
import { NotificationService } from '../services/notification.service';
import { urlBase64ToUint8Array } from '../utils/webPush';
import { isNativePlatform } from '../utils/capacitor';

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favorites: [] as string[], // Stores passage IDs
    endpoint: null as string | null,
  }),
  actions: {
    /**
     * Tente de s'abonner aux notifications push si ce n'est pas encore fait.
     * - Natif (Android/iOS) : utilise le token FCM via @capacitor/push-notifications
     * - Web/PWA             : utilise le Service Worker + Web Push API
     */
    async _subscribeForNotifications() {
      if (this.endpoint) return; // Déjà abonné

      if (isNativePlatform()) {
        // --- Canal NATIF : FCM (Android / iOS) ---
        try {
          const { waitForFcmToken } = await import('../utils/capacitorPush');
          const fcmToken = await waitForFcmToken();
          if (fcmToken) {
            await NotificationService.subscribe(
              { type: 'fcm', endpoint: fcmToken },
              this.favorites
            );
            this.endpoint = fcmToken;
            console.log('[Favorites] FCM subscription registered');
          } else {
            console.warn('[Favorites] FCM token not available (permission denied ou non initialisé)');
          }
        } catch (err) {
          console.error('[Favorites] FCM subscription failed:', err);
        }
      } else if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
        // --- Canal WEB : Web Push via Service Worker ---
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          const config = useRuntimeConfig();
          const vapidKey = config.public.vapidPublicKey;
          if (!vapidKey) return;

          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
          });

          const subJson = subscription.toJSON();
          if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
            await NotificationService.subscribe(
              {
                type: 'web',
                endpoint: subJson.endpoint,
                keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth }
              },
              this.favorites
            );
            this.endpoint = subJson.endpoint;
            console.log('[Favorites] Web Push subscription registered');
          }
        } catch (err) {
          console.error('[Favorites] Web Push subscription failed:', err);
        }
      }
    },

    async toggleFavorite(passageId: string) {
      const isAdding = !this.favorites.includes(passageId);

      if (isAdding) {
        this.favorites.push(passageId);
        // Tenter de s'abonner aux notifications au premier favori
        await this._subscribeForNotifications();
      } else {
        this.favorites = this.favorites.filter(id => id !== passageId);
      }

      await this.sync();
    },

    async toggleGroupFavorites(passageIds: string[]) {
      const allFavorited = passageIds.every(id => this.favorites.includes(id));

      if (allFavorited) {
        this.favorites = this.favorites.filter(id => !passageIds.includes(id));
      } else {
        passageIds.forEach(id => {
          if (!this.favorites.includes(id)) {
            this.favorites.push(id);
          }
        });
        // Tenter de s'abonner aux notifications au premier favori
        await this._subscribeForNotifications();
      }

      await this.sync();
    },

    areAllGroupPassagesFavorited(passageIds: string[]): boolean {
      return passageIds.length > 0 && passageIds.every(id => this.favorites.includes(id));
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
