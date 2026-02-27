import { FLICKR_CACHE_MAX_AGE } from '../../utils/timings'

interface FlickrRawPhoto {
  id: string
  secret: string
  server: string
  title: string
  dateupload: string
  url_s?: string
  url_m?: string
  url_z?: string
  url_l?: string
}

/**
 * GET /api/flickr/album
 * Proxy sécurisé vers l'API Flickr REST.
 * Nécessite FLICKR_API_KEY, FLICKR_ALBUM_ID et FLICKR_USER_ID dans .env
 */
export default defineCachedEventHandler(async (_event) => {
  const config = useRuntimeConfig()

  const apiKey = config.flickrApiKey as string
  const albumId = config.flickrAlbumId as string
  const userId = config.flickrUserId as string

  if (!apiKey || !albumId || !userId) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Flickr not configured',
      message: 'Les variables FLICKR_API_KEY, FLICKR_ALBUM_ID et FLICKR_USER_ID sont manquantes.'
    })
  }

  const params = new URLSearchParams({
    method: 'flickr.photosets.getPhotos',
    api_key: apiKey,
    photoset_id: albumId,
    user_id: userId,
    format: 'json',
    nojsoncallback: '1',
    extras: 'url_l,url_z,url_m,url_s,date_upload,title',
    per_page: '500',
    media: 'photos'
  })

  const url = `https://www.flickr.com/services/rest/?${params.toString()}`

  console.log('[flickr] Fetching album', albumId)

  const response: Record<string, any> = await $fetch(url)

  if (response?.stat !== 'ok') {
    throw createError({
      statusCode: 502,
      statusMessage: 'Flickr API Error',
      message: response?.message ?? 'Erreur inconnue depuis l\'API Flickr'
    })
  }

  const rawPhotos: FlickrRawPhoto[] = response.photoset?.photo ?? []

  const photos = rawPhotos.map((p: FlickrRawPhoto) => ({
    id: p.id,
    title: p.title ?? '',
    dateUpload: Number(p.dateupload),
    urls: {
      s: p.url_s ?? `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_s.jpg`,
      m: p.url_m ?? `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_m.jpg`,
      z: p.url_z ?? `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_z.jpg`,
      l: p.url_l ?? `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_b.jpg`
    }
  }))

  // Tri du plus récent au plus ancien
  photos.sort((a, b) => b.dateUpload - a.dateUpload)

  return {
    albumId,
    total: Number(response.photoset?.total ?? photos.length),
    photos
  }
}, {
  maxAge: FLICKR_CACHE_MAX_AGE,
  swr: true,
  name: 'flickr-album',
  getKey: () => 'album'
})
