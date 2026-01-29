import type { Socket } from 'socket.io-client'

// Simple noop socket used during SSR to avoid attempting connections from the server
const noopSocket = {
  on: () => {},
  off: () => {},
  emit: () => {},
  disconnect: () => {}
} as unknown as Socket

export const useSocket = () => {
  const nuxtApp = useNuxtApp()

  // Ensure we only use the real socket in the browser
  if (typeof window === 'undefined') {
    return noopSocket
  }

  // Retrieve the singleton socket provided by the plugin
  // We use the $socket provided by plugins/socket.client.ts
  return nuxtApp.$socket as Socket
}
