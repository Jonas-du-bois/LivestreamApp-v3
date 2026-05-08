import { FLICKR_CACHE_MAX_AGE } from '../../utils/timings'
import { createFlickrApiError, createFlickrNetworkError } from '../../utils/flickr'

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

/**
 * GET /api/flickr/album
 * Proxy sécurisé vers l'API Flickr REST.
 * Nécessite FLICKR_API_KEY, FLICKR_ALBUM_ID_SATURDAY, FLICKR_ALBUM_ID_SUNDAY et FLICKR_USER_ID dans .env
 */
export default defineCachedEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const day = query.day as string

  const apiKey = config.flickrApiKey as string
  const albumId = day === 'dimanche' ? (config.flickrAlbumIdSunday as string) : (config.flickrAlbumIdSaturday as string)
  const userId = config.flickrUserId as string

  if (!apiKey || !albumId) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Flickr not configured',
      message: `Les variables FLICKR_API_KEY et l'ID de l'album pour ${day || 'samedi'} sont manquantes.`
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

  let response: Record<string, any>
  try {
    response = await $fetch(url)
  } catch (error) {
    throw createFlickrNetworkError(error, 'album')
  }

  if (response?.stat !== 'ok') {
    throw createFlickrApiError(response, 'album')
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
  getKey: (event) => {
    const query = getQuery(event)
    return `album-${query.day || 'samedi'}`
  }
})
