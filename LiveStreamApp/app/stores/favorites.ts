import { defineStore } from 'pinia';
import { NotificationService } from '../services/notification.service';

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favorites: [] as string[],
    endpoint: null as string | null,
  }),
  actions: {
    async toggleFavorite(groupId: string) {
      if (this.favorites.includes(groupId)) {
        this.favorites = this.favorites.filter(id => id !== groupId);
      } else {
        this.favorites.push(groupId);
      }
      await this.sync();
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
