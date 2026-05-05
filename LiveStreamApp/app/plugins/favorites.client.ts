export default defineNuxtPlugin(async (nuxtApp) => {
  // Only load on the client side
  if (import.meta.client) {
    const favoritesStore = useFavoritesStore()
    // Await the initial load to ensure state is hydrated before components render
    await favoritesStore.loadFavorites()
  }
})
