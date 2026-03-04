/**
 * stream.ts
 * Utilitaires purs pour la gestion des URL de flux et de la génération de miniatures
 */

/**
 * Extrait l'URL de la miniature d'un flux (YouTube, Twitch, etc.)
 *
 * @param url - L'URL du flux
 * @param defaultImg - L'image par défaut si l'URL ne correspond à aucune plateforme reconnue ou si aucune URL n'est fournie
 * @returns L'URL de la miniature
 */
export function getStreamThumbnailUrl(url?: string | null, defaultImg: string = 'https://images.unsplash.com/photo-1764622078388-df36863688d3?q=80&w=2340&auto=format&fit=crop'): string {
  if (!url) return defaultImg

  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/)
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)

  const ytId = embedMatch?.[1] || watchMatch?.[1] || shortMatch?.[1]
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
  }

  if (url.includes('twitch.tv')) {
    const twMatch = url.match(/twitch\.tv\/(.+?)(?:$|\/|\?)/)
    const channel = twMatch?.[1]
    if (channel) {
      return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-1280x720.jpg`
    }
  }

  return defaultImg
}
