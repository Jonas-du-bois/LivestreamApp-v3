import type { FlickrPhoto } from '~/types/flickr'
import { FLICKR_PHOTOS_REFRESH } from '~/utils/timings'
import { FlickrService } from '~/services/flickr.service'

/**
 * Gestion des photos en direct depuis Flickr.
 * - Poll l'album toutes les FLICKR_PHOTOS_REFRESH ms
 * - Détecte les nouvelles photos entre deux polls
 * - Refresh automatique au retour de visibilité
 */
export function useFlickrPhotos() {
  // IDs connus au premier chargement (pas signalés comme "nouveaux")
  const knownIds = ref(new Set<string>())
  // IDs arrivés après l'init (pour notifier l'utilisateur)
  const newPhotoIds = ref(new Set<string>())
  const isInitialized = ref(false)

  // Fetch réactif
  const { data, pending, error, refresh } = FlickrService.getAlbum()

  watch(data, (newData) => {
    if (!newData?.photos?.length) return

    if (!isInitialized.value) {
      // Premier chargement : toutes les photos sont "connues"
      newData.photos.forEach(p => knownIds.value.add(p.id))
      isInitialized.value = true
      return
    }

    // Polls suivants : toute photo inconnue est "nouvelle"
    newData.photos.forEach(p => {
      if (!knownIds.value.has(p.id)) {
        knownIds.value.add(p.id)
        newPhotoIds.value.add(p.id)
      }
    })
  }, { immediate: true })

  const clearNewPhotos = () => {
    newPhotoIds.value = new Set<string>()
  }

  // Auto-refresh (polling + reprise de visibilité)
  useAutoRefresh(refresh, FLICKR_PHOTOS_REFRESH)

  // Évite le skeleton lors des refresh ultérieurs
  const { hasLoadedOnce } = useFirstLoad(pending, data)

  return {
    photos: computed((): FlickrPhoto[] => data.value?.photos ?? []),
    total: computed(() => data.value?.total ?? 0),
    pending,
    error,
    refresh,
    hasLoadedOnce,
    newPhotoIds: computed(() => newPhotoIds.value),
    newPhotoCount: computed(() => newPhotoIds.value.size),
    clearNewPhotos
  }
}
