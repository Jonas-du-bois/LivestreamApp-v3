<script setup lang="ts">
/**
 * PhotosLightbox
 * Composant de visionneuse plein écran pour la galerie.
 */
import type { FlickrPhoto } from '~/types/flickr'

interface Props {
  photos: FlickrPhoto[]
  modelValue: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { t } = useI18n()
// ⚠️ DEAD CODE : const { locale } = useI18n()
const { formatLocalizedDateTime } = useTranslatedData()

// Gère l'index courant pour l'ouverture/fermeture et empêche de dépasser les limites du tableau de photos.
const currentIndex = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const isOpen = computed(() => currentIndex.value !== null)
const currentPhoto = computed((): FlickrPhoto | null =>
  currentIndex.value !== null ? (props.photos[currentIndex.value] ?? null) : null
)

const canPrev = computed(() => currentIndex.value !== null && currentIndex.value > 0)
const canNext = computed(() => currentIndex.value !== null && currentIndex.value < props.photos.length - 1)

// Détermine la direction de l'animation ('next' ou 'prev') pour offrir un effet visuel de glissement naturel.
const navDirection = ref<'next' | 'prev' | null>(null)

const transitionName = computed(() => {
  if (navDirection.value === 'next') return 'slide-next'
  if (navDirection.value === 'prev') return 'slide-prev'
  return 'fade'
})

const close = () => {
  navDirection.value = null
  currentIndex.value = null
}
const prev = () => {
  if (canPrev.value && currentIndex.value !== null) {
    navDirection.value = 'prev'
    currentIndex.value--
  }
}
const next = () => {
  if (canNext.value && currentIndex.value !== null) {
    navDirection.value = 'next'
    currentIndex.value++
  }
}

// Réinitialise l'état de l'image (chargement/erreur) à chaque changement pour éviter d'afficher l'ancienne image temporairement.
const imgLoaded = ref(false)
const imgError = ref(false)

watch(currentIndex, () => {
  imgLoaded.value = false
  imgError.value = false
})

const bestUrl = computed(() => currentPhoto.value?.urls.o || currentPhoto.value?.urls.l || '')

// Permet d'ouvrir une vue détaillée et zoomable lors d'un clic sur l'image courante.
const showFullscreen = ref(false)

const openFullscreen = () => {
  if (currentPhoto.value) {
    showFullscreen.value = true
  }
}

const closeFullscreen = () => {
  showFullscreen.value = false
}

// Force le téléchargement direct du fichier image plutôt que son ouverture dans un nouvel onglet via l'API fetch.
const isDownloading = ref(false)

const downloadPhoto = async () => {
  if (!currentPhoto.value || isDownloading.value) return
  isDownloading.value = true
  const url = bestUrl.value
  const filename = `${currentPhoto.value.title || currentPhoto.value.id}.jpg`
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(blobUrl)
  } catch {
    // Solution de secours si la requête cross-origin échoue
    window.open(url, '_blank')
  } finally {
    isDownloading.value = false
  }
}

// Adapte la date de la photo à la langue actuelle de l'utilisateur.
const formattedDateTime = computed(() => {
  if (!currentPhoto.value) return ''
  return formatLocalizedDateTime(currentPhoto.value.dateUpload * 1000)
})

// Raccourcis clavier pour une meilleure accessibilité (fermeture et navigation).
const handleKeyDown = (e: KeyboardEvent) => {
  if (!isOpen.value || showFullscreen.value) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
  if (e.key === 'ArrowRight') { e.preventDefault(); next() }
}

// Support des gestes sur mobile : on filtre les mouvements verticaux pour ne pas bloquer le scroll naturel.
let touchStartX = 0
let touchStartY = 0

const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0]!.clientX
  touchStartY = e.touches[0]!.clientY
}

const handleTouchEnd = (e: TouchEvent) => {
  const dx = e.changedTouches[0]!.clientX - touchStartX
  const dy = Math.abs(e.changedTouches[0]!.clientY - touchStartY)
  
  if (dy > Math.abs(dx)) return
  if (Math.abs(dx) > 50) {
    if (dx < 0) next()
    else prev()
  }
}

// Bloque le scroll de la page en arrière-plan quand la modale est ouverte pour éviter les comportements inattendus.
watch(isOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

// Nettoyage rigoureux des événements globaux pour éviter les fuites de mémoire.
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="isOpen && currentPhoto"
        class="fixed inset-0 z-[9999] flex flex-col"
        role="dialog"
        aria-modal="true"
        :aria-label="currentPhoto.title || 'Photo'"
        @touchstart.passive="handleTouchStart"
        @touchend.passive="handleTouchEnd"
      >
        <div
          class="absolute inset-0 bg-black/96 backdrop-blur-lg"
          @click="close"
        />

        <div
          class="relative z-10 flex items-center justify-between gap-3 px-4 py-3 pt-10
                 bg-gradient-to-b from-black/70 to-transparent pointer-events-none"
        >
          <div class="pointer-events-auto flex-1 min-w-0">
            <p
              v-if="currentPhoto.title"
              class="text-white text-sm font-semibold truncate"
            >
              {{ currentPhoto.title }}
            </p>
            <p class="text-white/40 text-xs mt-0.5">{{ formattedDateTime }}</p>
          </div>

          <div class="pointer-events-auto flex items-center gap-2 flex-shrink-0">
            <span class="text-white/40 text-xs tabular-nums mr-1">
              {{ (currentIndex ?? 0) + 1 }} / {{ photos.length }}
            </span>

            <button
              type="button"
              class="glass-card p-2.5 rounded-full active:scale-95 transition-all
                     hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none
                     flex items-center justify-center"
              :aria-label="t('photos.download')"
              :title="t('photos.download')"
              :disabled="isDownloading"
              @click.stop="downloadPhoto"
            >
              <Icon
                :name="isDownloading ? 'fluent:spinner-ios-20-regular' : 'fluent:arrow-download-24-regular'"
                class="w-5 h-5 text-white"
                :class="{ 'animate-spin': isDownloading }"
              />
            </button>

            <button
              type="button"
              class="glass-card p-2.5 rounded-full active:scale-95 transition-all
                     hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none
                     flex items-center justify-center"
              :aria-label="t('common.close')"
              @click="close"
            >
              <Icon name="fluent:dismiss-24-regular" class="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div class="relative z-10 flex-1 overflow-hidden">
          <Transition name="fade">
            <button
              v-if="canPrev"
              type="button"
              class="absolute left-3 top-1/2 -translate-y-1/2 z-20 glass-card p-3 rounded-full
                     active:scale-95 transition-all hover:bg-white/20
                     focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
              :aria-label="t('photos.prevPhoto')"
              @click.stop="prev"
            >
              <Icon name="fluent:chevron-left-24-regular" class="w-6 h-6 text-white" />
            </button>
          </Transition>

          <Transition name="fade">
            <button
              v-if="canNext"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 z-20 glass-card p-3 rounded-full
                     active:scale-95 transition-all hover:bg-white/20
                     focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
              :aria-label="t('photos.nextPhoto')"
              @click.stop="next"
            >
              <Icon name="fluent:chevron-right-24-regular" class="w-6 h-6 text-white" />
            </button>
          </Transition>

          <Transition :name="transitionName">
            <div
              :key="currentPhoto.id"
              class="absolute inset-0 flex items-center justify-center px-14"
            >
              <div
                v-if="!imgLoaded && !imgError"
                class="absolute inset-[15%] rounded-2xl premium-skeleton-surface premium-skeleton-shimmer"
              />

              <NuxtImg format="webp" loading="lazy"                 v-if="!imgError"
                :key="`img-${currentPhoto.id}`"
                :src="bestUrl"
                :alt="currentPhoto.title || 'Photo'"
                class="relative max-w-full max-h-full object-contain rounded-lg
                       transition-opacity duration-300 select-none cursor-zoom-in"
                :class="imgLoaded ? 'opacity-100' : 'opacity-0'"
                draggable="false"
                @load="imgLoaded = true"
                @error="imgError = true"
                @click.stop="openFullscreen"
              />

              <div v-if="imgError" class="flex flex-col items-center gap-3 text-white/30">
                <Icon name="fluent:image-off-24-regular" class="text-6xl" />
                <span class="text-sm">{{ t('photos.imageUnavailable') }}</span>
              </div>
            </div>
          </Transition>
        </div>

        <div
          class="relative z-10 pb-10 flex flex-col items-center gap-2 py-4
                 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
        >
          <p class="text-white/30 text-xs">
            {{ t('photos.tapToEnlarge') }}
          </p>
          <div class="flex gap-1.5">
            <div
              v-for="(_, i) in photos.slice(0, 20)"
              :key="i"
              class="h-1 rounded-full transition-all duration-300"
              :class="i === currentIndex
                ? 'w-5 bg-cyan-400'
                : 'w-1.5 bg-white/20'"
            />
            <span
              v-if="photos.length > 20"
              class="text-white/30 text-xs ml-1 self-center"
            >+{{ photos.length - 20 }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <PhotosPhotoFullscreen
      v-if="showFullscreen && currentPhoto"
      :photo-id="currentPhoto.id"
      :title="currentPhoto.title"
      :fallback-url="bestUrl"
      @close="closeFullscreen"
    />
  </Teleport>
</template>

<style scoped>
.lightbox-enter-active {
  transition: opacity 0.2s ease;
}
.lightbox-leave-active {
  transition: opacity 0.15s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s ease;
  position: absolute;
  inset: 0;
}

.slide-next-enter-from {
  transform: translateX(60px);
  opacity: 0;
}
.slide-next-leave-to {
  transform: translateX(-60px);
  opacity: 0;
}

.slide-prev-enter-from {
  transform: translateX(-60px);
  opacity: 0;
}
.slide-prev-leave-to {
  transform: translateX(60px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
