import { ref, computed, watch } from 'vue'
import type { FlickrPhoto } from '~/types/flickr'
import { FLICKR_PHOTOS_REFRESH } from '~/utils/timings'
import { FlickrService } from '~/services/flickr.service'

/**
 * useFlickrPhotos – gestion des photos en direct depuis Flickr
 *
 * - Poll l'album toutes les FLICKR_PHOTOS_REFRESH ms (défaut : 60 s)
 * - Détecte les nouvelles photos entre deux polls via `newPhotoIds`
 * - S'arrête proprement quand le composant est démonté (via useAutoRefresh)
 * - Refresh sur reprise de visibilité (retour dans l'app)
 */
export function useFlickrPhotos() {
  // ─── Détection des nouvelles photos ────────────────────────────────────────
  /** IDs connus lors du premier chargement (ne seront pas marqués comme "new") */
  const knownIds = ref(new Set<string>())
  /** IDs des photos arrivées après l'init (à signaler à l'utilisateur) */
  const newPhotoIds = ref(new Set<string>())
  const isInitialized = ref(false)

  // ─── Fetch réactif ─────────────────────────────────────────────────────────
  const { data, pending, error, refresh } = FlickrService.getAlbum()

  watch(data, (newData) => {
    if (!newData?.photos?.length) return

    if (!isInitialized.value) {
      // Premier chargement : on considère toutes les photos comme "connues"
      newData.photos.forEach(p => knownIds.value.add(p.id))
      isInitialized.value = true
      return
    }

    // Polls suivants : toute photo absente de knownIds est "nouvelle"
    newData.photos.forEach(p => {
      if (!knownIds.value.has(p.id)) {
        knownIds.value.add(p.id)
        newPhotoIds.value.add(p.id)
      }
    })
  })

  const clearNewPhotos = () => {
    newPhotoIds.value = new Set<string>()
  }

  // ─── Auto-refresh (polling + reprise de visibilité) ────────────────────────
  useAutoRefresh(refresh, FLICKR_PHOTOS_REFRESH)

  // ─── État de premier chargement (évite le skeleton sur les refresh suivants) ─
  const { hasLoadedOnce } = useFirstLoad(pending, data)

  return {
    /** Liste des photos triée du plus récent au plus ancien */
    photos: computed((): FlickrPhoto[] => data.value?.photos ?? []),
    /** Nombre total de photos dans l'album selon Flickr */
    total: computed(() => data.value?.total ?? 0),
    pending,
    error,
    refresh,
    /** Vrai après le premier chargement réussi */
    hasLoadedOnce,
    /** Set des IDs de photos arrivées depuis l'init de la page */
    newPhotoIds: computed(() => newPhotoIds.value),
    /** Nombre de nouvelles photos non vues */
    newPhotoCount: computed(() => newPhotoIds.value.size),
    /** Réinitialise le compteur de nouvelles photos */
    clearNewPhotos
  }
}
