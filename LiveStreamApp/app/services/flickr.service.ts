import type { FlickrAlbumResponse } from '~/types/flickr'

/**
 * Service Flickr – accède à la route proxy serveur `/api/flickr/album`
 * La clé API Flickr reste côté serveur : le client n'effectue que des
 * appels sur les routes Nuxt internes.
 */
export const FlickrService = {
  /**
   * Récupère toutes les photos de l'album de la compétition.
   * Le cache SWR (30 s) est géré côté serveur.
   * `getCachedData: () => undefined` désactive le cache Nuxt côté client
   * pour obtenir les dernières données à chaque refresh de polling.
   */
  getAlbum() {
    return useFetch<FlickrAlbumResponse>('/api/flickr/album', {
      key: 'flickr-album',
      getCachedData: () => undefined
    })
  }
}
