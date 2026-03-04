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

  const response: Record<string, any> = await $fetch(url)

  if (response?.stat !== 'ok') {
    throw createError({
      statusCode: 502,
      statusMessage: 'Flickr API Error',
      message: response?.message ?? 'Erreur inconnue depuis l\'API Flickr'
    })
  }

  const sizes: Array<{
    label: string
    width: number
    height: number
    source: string
    url: string
    media: string
  }> = response.sizes?.size ?? []

  // Chercher la taille originale, puis la plus grande disponible
  const original = sizes.find(s => s.label === 'Original')
  const largest = sizes.length > 0
    ? sizes.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b))
    : null

  const best = original || largest

  return {
    photoId,
    sizes: sizes.map(s => ({
      label: s.label,
      width: s.width,
      height: s.height,
      source: s.source
    })),
    original: best ? {
      label: best.label,
      width: best.width,
      height: best.height,
      source: best.source
    } : null
  }
})
