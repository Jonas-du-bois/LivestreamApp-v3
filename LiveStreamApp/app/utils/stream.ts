import type { Stream, PopulatedStream, PopulatedPassage, PassageEnriched } from '../types/api'

/**
 * Extracts a thumbnail URL from a stream URL (YouTube, Twitch, etc.)
 * or returns a fallback if none found.
 */
export function getStreamThumbnail(streamUrl?: string, customThumbnail?: string): string {
  const defaultImg = 'https://images.unsplash.com/photo-1764622078388-df36863688d3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

  let thumb = customThumbnail || ''

  if (!thumb && streamUrl) {
    const url = streamUrl
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/)
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)

    const ytId = embedMatch?.[1] || watchMatch?.[1] || shortMatch?.[1]

    if (ytId) {
      thumb = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    } else if (url.includes('twitch.tv')) {
      const twMatch = url.match(/twitch\.tv\/(.+?)(?:$|\/|\?)/)
      const channel = twMatch?.[1]
      if (channel) {
        thumb = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-1280x720.jpg`
      }
    }
  }

  if (!thumb) thumb = defaultImg
  return thumb
}

/**
 * Resolves the currently active passage for a stream based on priority:
 * 1. The stream's own `currentPassage` property (if populated)
 * 2. A live passage happening at the stream's `location`
 *
 * @param stream The stream object (can be Stream or PopulatedStream)
 * @param livePassageAtLocation A live passage occurring at the stream's location (optional fallback)
 * @returns The resolved populated passage, or null if none
 */
export function resolveStreamPassage(
  stream: Stream | PopulatedStream,
  livePassageAtLocation?: PopulatedPassage | PassageEnriched | null
): PopulatedPassage | PassageEnriched | null {
  // Check if stream has a specific passage assigned and populated
  if (stream.currentPassage && typeof stream.currentPassage === 'object' && 'group' in stream.currentPassage) {
    return stream.currentPassage as PopulatedPassage
  }

  // Fallback to passage occurring at the location
  if (livePassageAtLocation) {
    return livePassageAtLocation
  }

  return null
}

/**
 * Checks if a stream URL is embeddable (YouTube/Vimeo)
 */
export function isStreamEmbeddable(url?: string): boolean {
  if (!url) return false
  return url.includes('youtube') || url.includes('vimeo')
}
