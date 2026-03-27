interface FlickrSize {
  label: string
  width: number | string
  height: number | string
  source: string
  url: string
  media: string
}

interface FlickrSizesResponse {
  stat: 'ok' | 'fail'
  message?: string
  sizes?: {
    canblog: number
    canprint: number
    candownload: number
    size: FlickrSize[]
  }
}

/**
 * GET /api/flickr/photo/:id/sizes
 * Proxy vers flickr.photos.getSizes – retourne les URLs de toutes les tailles
 * disponibles pour une photo, y compris l'originale.
 */
export default defineEventHandler(async (event) => {
  const photoId = getRouterParam(event, 'id')

  if (!photoId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing photo ID' })
  }

  const config = useRuntimeConfig()
  const apiKey = config.flickrApiKey as string

  if (!apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Flickr not configured',
      message: 'La variable FLICKR_API_KEY est manquante.'
    })
  }

  const params = new URLSearchParams({
    method: 'flickr.photos.getSizes',
    api_key: apiKey,
    photo_id: photoId,
    format: 'json',
    nojsoncallback: '1'
  })

  const url = `https://www.flickr.com/services/rest/?${params.toString()}`

  const response = await $fetch<FlickrSizesResponse>(url)

  if (response?.stat !== 'ok') {
    throw createError({
      statusCode: 502,
      statusMessage: 'Flickr API Error',
      message: response?.message ?? 'Erreur inconnue depuis l\'API Flickr'
    })
  }

  const sizes: FlickrSize[] = response.sizes?.size ?? []

  // Chercher la taille originale, puis la plus grande disponible
  const original = sizes.find(s => s.label === 'Original')
  const largest = sizes.length > 0
    ? sizes.reduce((a, b) => (Number(a.width) * Number(a.height) > Number(b.width) * Number(b.height) ? a : b))
    : null

  const best = original || largest

  return {
    photoId,
    sizes: sizes.map(s => ({
      label: s.label,
      width: Number(s.width),
      height: Number(s.height),
      source: s.source
    })),
    original: best ? {
      label: best.label,
      width: Number(best.width),
      height: Number(best.height),
      source: best.source
    } : null
  }
})
