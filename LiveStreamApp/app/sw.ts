import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// 1. API Cache (NetworkFirst) - Priorité au réseau pour les scores
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-data',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 86400, // 24h
      }),
    ],
    networkTimeoutSeconds: 5
  })
)

// 2. External Assets (StaleWhileRevalidate) - Icônes, YouTube, Twitch
registerRoute(
  ({ url }) => url.pathname.includes('_nuxt_icon') || url.hostname.includes('img.youtube.com') || url.hostname.includes('static-cdn.jtvnw.net'),
  new StaleWhileRevalidate({
    cacheName: 'external-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Jours
      }),
    ],
  })
)

// 3. Push Notifications Handler
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const payload = event.data.json()
    const { title, body, icon, url } = payload

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: icon || '/icons/logo_livestreamappv3-192.png',
        data: { url: url || '/' },
        vibrate: [100, 50, 100],
        actions: [
          { action: 'open', title: 'Voir' }
        ]
      })
    )
  } catch (e) {
    console.error('Push error:', e)
  }
})

// 4. Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if tab is already open
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
