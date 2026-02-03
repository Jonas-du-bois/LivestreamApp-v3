// Plugin côté client uniquement pour @khmyznikov/pwa-install
export default defineNuxtPlugin(async () => {
  // Import dynamique côté client seulement
  await import('@khmyznikov/pwa-install')
})
