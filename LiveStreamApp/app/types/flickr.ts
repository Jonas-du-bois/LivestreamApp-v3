/**
 * Types Flickr – Photos en direct de la compétition
 * Correspond au format de réponse renvoyé par /api/flickr/album
 */

export interface FlickrPhotoUrls {
  /** Miniature 75×75 px */
  s: string
  /** Miniature 240 px (côté le plus long) */
  m: string
  /** Moyen 640 px (côté le plus long) – utilisé dans la grille */
  z: string
  /** Grand 1024 px (côté le plus long) – utilisé dans le lightbox */
  l: string
}

export interface FlickrPhoto {
  /** Identifiant unique Flickr */
  id: string
  /** Titre donné par le photographe */
  title: string
  /** Timestamp Unix en secondes (date d'upload) */
  dateUpload: number
  /** URLs aux différentes tailles */
  urls: FlickrPhotoUrls
}

export interface FlickrAlbumResponse {
  /** ID de l'album Flickr */
  albumId: string
  /** Nombre total de photos dans l'album */
  total: number
  /** Photos triées du plus récent au plus ancien */
  photos: FlickrPhoto[]
}
