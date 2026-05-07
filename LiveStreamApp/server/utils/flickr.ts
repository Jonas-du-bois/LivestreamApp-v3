import { createError } from 'h3'

type FlickrOperation = 'album' | 'photoSizes'

interface FlickrFailureResponse {
  code?: number | string
  message?: string
}

const operationLabel: Record<FlickrOperation, string> = {
  album: 'album',
  photoSizes: 'tailles de photo'
}

const getFlickrCode = (response: FlickrFailureResponse) => {
  const code = Number(response.code)
  return Number.isFinite(code) ? code : null
}

const getFlickrMessage = (response: FlickrFailureResponse) => {
  return typeof response.message === 'string' && response.message.trim()
    ? response.message
    : 'Erreur inconnue depuis l\'API Flickr'
}

export const createFlickrApiError = (
  response: FlickrFailureResponse,
  operation: FlickrOperation
) => {
  const code = getFlickrCode(response)
  const flickrMessage = getFlickrMessage(response)
  const data = {
    provider: 'flickr',
    operation,
    flickrCode: response.code,
    flickrMessage
  }

  if (code === 100) {
    return createError({
      statusCode: 502,
      statusMessage: 'Flickr API key invalid',
      message: 'La clé API Flickr est invalide ou expirée. Vérifie que le compte Flickr est Pro, puis remplace la clé dans les variables d\'environnement si besoin.',
      data
    })
  }

  if (code === 1) {
    return createError({
      statusCode: 404,
      statusMessage: operation === 'album' ? 'Flickr album not found' : 'Flickr photo not found',
      message: operation === 'album'
        ? 'L\'album Flickr configuré est introuvable ou n\'est plus accessible.'
        : 'La photo Flickr demandée est introuvable ou n\'est plus accessible.',
      data
    })
  }

  if (code === 2 || code === 3 || /permission|private|denied|not authorized/i.test(flickrMessage)) {
    return createError({
      statusCode: 403,
      statusMessage: 'Flickr resource not accessible',
      message: `Flickr refuse l'accès aux ${operationLabel[operation]}. Vérifie les permissions publiques de l'album/photo et le statut Pro du compte.`,
      data
    })
  }

  if (code === 105) {
    return createError({
      statusCode: 503,
      statusMessage: 'Flickr unavailable',
      message: 'Flickr est temporairement indisponible. Réessaie dans quelques instants.',
      data
    })
  }

  return createError({
    statusCode: 502,
    statusMessage: 'Flickr API Error',
    message: `Erreur Flickr pendant le chargement des ${operationLabel[operation]}: ${flickrMessage}`,
    data
  })
}

export const createFlickrNetworkError = (error: unknown, operation: FlickrOperation) => {
  const message = error instanceof Error ? error.message : String(error)

  return createError({
    statusCode: 503,
    statusMessage: 'Flickr request failed',
    message: `Impossible de contacter Flickr pour charger les ${operationLabel[operation]}.`,
    data: {
      provider: 'flickr',
      operation,
      cause: message
    }
  })
}
