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

import type { Stream, PassageEnriched, PopulatedPassage, Passage } from '../types/api'

/**
 * Associe un Stream à son Passage actuel en utilisant la logique suivante :
 * 1. Correspondance exacte via `stream.currentPassage` (ID ou objet peuplé)
 * 2. Correspondance par lieu (`stream.location === passage.location`)
 *
 * @param stream Le stream à associer
 * @param passages La liste des passages potentiels (typiquement les passages LIVE)
 * @returns Le passage correspondant, ou null si aucun n'est trouvé
 */
export function matchStreamToPassage(stream: Stream | null | undefined, passages: PassageEnriched[] | undefined): PassageEnriched | PopulatedPassage | null {
  if (!stream || !passages || !Array.isArray(passages)) return null

  // 1. Essayer de faire correspondre par ID de passage (si renseigné)
  if (stream.currentPassage) {
    const cpId = typeof stream.currentPassage === 'string'
      ? stream.currentPassage
      : (stream.currentPassage as Passage)._id

    if (cpId) {
      const matchById = passages.find(p => p._id === cpId)
      if (matchById) return matchById

      // Si on ne trouve pas dans le tableau mais que l'objet est déjà peuplé, on peut le retourner directement
      if (typeof stream.currentPassage === 'object' && (stream.currentPassage as PopulatedPassage).group) {
        return stream.currentPassage as PopulatedPassage
      }
    }
  }

  // 2. Si pas de currentPassage ou introuvable, fallback sur la correspondance par lieu
  if (stream.location) {
    const matchByLocation = passages.find(p => p.location === stream.location)
    if (matchByLocation) return matchByLocation
  }

  return null
}

/**
 * Trouve le Stream correspondant à un Passage donné en appliquant la même logique :
 * 1. Le stream pointe explicitement vers ce passage (`stream.currentPassage === passage._id`)
 * 2. Le stream est situé au même endroit que le passage (`stream.location === passage.location`)
 *
 * @param passage Le passage à associer
 * @param streams La liste des streams disponibles
 * @returns Le stream correspondant, ou undefined si aucun n'est trouvé
 */
export function matchPassageToStream(passage: PassageEnriched | null | undefined, streams: Stream[] | undefined): Stream | undefined {
  if (!passage || !passage._id || !streams || !Array.isArray(streams)) return undefined

  // 1. Chercher un stream qui pointe explicitement vers ce passage
  const streamById = streams.find(s => {
    if (!s.currentPassage) return false
    const cpId = typeof s.currentPassage === 'string'
      ? s.currentPassage
      : (s.currentPassage as Passage)._id
    return cpId === passage._id
  })
  if (streamById) return streamById

  // 2. Fallback: Chercher un stream par location (si le passage a une location)
  if (passage.location) {
    const streamByLocation = streams.find(s => s.location === passage.location)
    if (streamByLocation) return streamByLocation
  }

  return undefined
}
