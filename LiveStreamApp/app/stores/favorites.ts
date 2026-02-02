import { defineStore } from 'pinia';
import { NotificationService } from '../services/notification.service';

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favorites: [] as string[], // Now stores passage IDs instead of group IDs
    endpoint: null as string | null,
  }),
  actions: {
    async toggleFavorite(passageId: string) {
      if (this.favorites.includes(passageId)) {
        this.favorites = this.favorites.filter(id => id !== passageId);
      } else {
        this.favorites.push(passageId);
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
