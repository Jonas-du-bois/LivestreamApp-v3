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
  url_o?: string
  originalsecret?: string
  originalformat?: string
}

interface FlickrAlbumResponse {
  stat: 'ok' | 'fail'
  message?: string
  photoset?: {
    id: string
    primary: string
    owner: string
    ownername: string
    photo: FlickrRawPhoto[]
    page: number
    per_page: number
    perpage: number
    pages: number
    total: number
  }
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

  if (!apiKey || !albumId) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Flickr not configured',
      message: 'Les variables FLICKR_API_KEY et FLICKR_ALBUM_ID sont manquantes.'
    })
  }

  const paramsObj: Record<string, string> = {
    method: 'flickr.photosets.getPhotos',
    api_key: apiKey,
    photoset_id: albumId,
    format: 'json',
    nojsoncallback: '1',
    extras: 'url_o,url_l,url_z,url_m,url_s,date_upload,title',
    original_format: '1',
    per_page: '500',
    media: 'photos'
  }

  // user_id doit être un NSID Flickr (ex: 12345678@N01), pas un nom d'utilisateur
  if (userId && /^\d+@N\d+$/.test(userId)) {
    paramsObj.user_id = userId
  }

  const params = new URLSearchParams(paramsObj)
  const url = `https://www.flickr.com/services/rest/?${params.toString()}`

  console.log('[flickr] Fetching album', albumId)

  const response = await $fetch<FlickrAlbumResponse>(url)

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
      l: p.url_l ?? `https://live.staticflickr.com/${p.server}/${p.id}_${p.secret}_b.jpg`,
      ...(p.url_o ? { o: p.url_o } : p.originalsecret ? { o: `https://live.staticflickr.com/${p.server}/${p.id}_${p.originalsecret}_o.${p.originalformat ?? 'jpg'}` } : {})
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
