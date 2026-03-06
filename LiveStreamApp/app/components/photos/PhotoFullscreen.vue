<script setup lang="ts">
/**
 * PhotoFullscreen
 * Vue plein écran pour afficher une photo en qualité maximale (originale Flickr).
 * Intègre les gestes tactiles complexes : Pinch-to-zoom, double-tap, pan.
 */

interface Props {
  photoId: string
  title?: string
  fallbackUrl: string
}

const props = withDefaults(defineProps<Props>(), {
  title: ''
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

// ─── Chargement et Qualité d'Image ──────────────────────────────────────────

const originalUrl = ref('')
const originalLoading = ref(true)
const originalError = ref(false)
const imgLoaded = ref(false)

// Interroge l'API pour récupérer la version non compressée de l'image.
const fetchOriginalUrl = async () => {
  originalLoading.value = true
  originalError.value = false
  try {
    const data = await $fetch<{
      original: { source: string; width: number; height: number } | null
    }>(`/api/flickr/photo/${props.photoId}/sizes`)
    originalUrl.value = data.original?.source || props.fallbackUrl
  } catch {
    originalUrl.value = props.fallbackUrl
    originalError.value = true
  } finally {
    originalLoading.value = false
  }
}

onMounted(() => {
  fetchOriginalUrl()
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

const displayUrl = computed(() => originalUrl.value || props.fallbackUrl)

// ─── Logique de Zoom et Panoramique (Pan) ───────────────────────────────────

const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isZoomed = computed(() => scale.value > 1)

const MIN_SCALE = 1
const MAX_SCALE = 5

const containerRef = ref<HTMLElement | null>(null)

const resetZoom = () => {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const factor = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * factor))
  if (newScale === MIN_SCALE) {
    resetZoom()
  } else {
    scale.value = newScale
  }
}

let lastTap = 0
const handleDoubleTap = () => {
  if (isZoomed.value) {
    resetZoom()
  } else {
    scale.value = 3
  }
}

const handleClick = (e: MouseEvent) => {
  // Ignore le clic classique si l'utilisateur est en train de naviguer dans l'image zoomée (drag).
  if (isDragging) return

  const now = Date.now()
  if (now - lastTap < 300) {
    handleDoubleTap()
    lastTap = 0
  } else {
    lastTap = now
  }
}

// ─── Gestion des gestes tactiles ────────────────────────────────────────────

let initialPinchDistance = 0
let initialScale = 1

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 2) {
    e.preventDefault()
    const dx = e.touches[0]!.clientX - e.touches[1]!.clientX
    const dy = e.touches[0]!.clientY - e.touches[1]!.clientY
    initialPinchDistance = Math.hypot(dx, dy)
    initialScale = scale.value
  } else if (e.touches.length === 1 && isZoomed.value) {
    dragStartX = e.touches[0]!.clientX - translateX.value
    dragStartY = e.touches[0]!.clientY - translateY.value
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (e.touches.length === 2) {
    e.preventDefault()
    const dx = e.touches[0]!.clientX - e.touches[1]!.clientX
    const dy = e.touches[0]!.clientY - e.touches[1]!.clientY
    const distance = Math.hypot(dx, dy)
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, initialScale * (distance / initialPinchDistance)))
    scale.value = newScale
  } else if (e.touches.length === 1 && isZoomed.value) {
    e.preventDefault()
    translateX.value = e.touches[0]!.clientX - dragStartX
    translateY.value = e.touches[0]!.clientY - dragStartY
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  if (scale.value <= MIN_SCALE) {
    resetZoom()
  }
}

// ─── Drag à la souris (Desktop) ─────────────────────────────────────────────

let dragStartX = 0
let dragStartY = 0
let isDragging = false

const handleMouseDown = (e: MouseEvent) => {
  if (!isZoomed.value) return
  e.preventDefault()
  isDragging = false
  dragStartX = e.clientX - translateX.value
  dragStartY = e.clientY - translateY.value

  const onMove = (ev: MouseEvent) => {
    isDragging = true
    translateX.value = ev.clientX - dragStartX
    translateY.value = ev.clientY - dragStartY
  }
  
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    // Petit délai pour éviter qu'un "mouseup" ne soit immédiatement compté comme un "click" (qui réinitialiserait le zoom).
    setTimeout(() => { isDragging = false }, 50)
  }
  
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// ─── Utilitaires ────────────────────────────────────────────────────────────

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isZoomed.value) {
      resetZoom()
    } else {
      emit('close')
    }
  }
}

const isDownloading = ref(false)

const downloadPhoto = async () => {
  if (isDownloading.value) return
  isDownloading.value = true
  const url = displayUrl.value
  const filename = `${props.title || props.photoId}.jpg`
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
    window.open(url, '_blank')
  } finally {
    isDownloading.value = false
  }
}

const imageTransform = computed(() => `scale(${scale.value}) translate(${translateX.value / scale.value}px, ${translateY.value / scale.value}px)`)
</script>

<template>
  <Teleport to="body">
    <Transition name="fullscreen-photo">
      <div
        class="fixed inset-0 z-[10000] flex flex-col bg-black"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Photo'"
      >
        <div
          class="relative z-30 flex items-center justify-between gap-3 px-4 py-3 pt-10
                 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
        >
          <button
            type="button"
            class="pointer-events-auto glass-card p-2.5 rounded-full active:scale-95
                   transition-all hover:bg-white/20 focus-visible:ring-2
                   focus-visible:ring-cyan-400 outline-none flex items-center gap-2"
            :aria-label="t('photos.backToCarousel')"
            @click="emit('close')"
          >
            <Icon name="fluent:arrow-left-24-regular" class="w-5 h-5 text-white" />
            <span class="text-white text-sm font-medium pr-1 hidden sm:inline">
              {{ t('photos.backToCarousel') }}
            </span>
          </button>

          <div class="pointer-events-auto flex items-center gap-2 flex-shrink-0">
            <Transition name="fade">
              <button
                v-if="isZoomed"
                type="button"
                class="glass-card px-3 py-1.5 rounded-full text-white/60 text-xs
                       tabular-nums active:scale-95 transition-all hover:bg-white/20"
                @click="resetZoom"
              >
                {{ Math.round(scale * 100) }}% — {{ t('photos.resetZoom') }}
              </button>
            </Transition>

            <button
              type="button"
              class="glass-card p-2.5 rounded-full active:scale-95 transition-all
                     hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none
                     flex items-center justify-center"
              :aria-label="t('photos.download')"
              :title="t('photos.download')"
              :disabled="isDownloading || originalLoading"
              @click.stop="downloadPhoto"
            >
              <Icon
                :name="isDownloading ? 'fluent:spinner-ios-20-regular' : 'fluent:arrow-download-24-regular'"
                class="w-5 h-5 text-white"
                :class="{ 'animate-spin': isDownloading }"
              />
            </button>
          </div>
        </div>

        <div
          ref="containerRef"
          class="relative z-10 flex-1 overflow-hidden flex items-center justify-center
                 cursor-grab active:cursor-grabbing"
          :class="{ 'cursor-zoom-in': !isZoomed, 'cursor-grab': isZoomed }"
          @wheel.prevent="handleWheel"
          @touchstart.passive="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend.passive="handleTouchEnd"
          @mousedown="handleMouseDown"
          @click="handleClick"
        >
          <div
            v-if="(originalLoading || !imgLoaded)"
            class="absolute inset-[10%] rounded-2xl premium-skeleton-surface premium-skeleton-shimmer"
          />

          <img
            v-if="displayUrl"
            :src="displayUrl"
            :alt="title || 'Photo'"
            class="max-w-full max-h-full object-contain select-none
                   transition-transform duration-150 ease-out"
            :class="imgLoaded ? 'opacity-100' : 'opacity-0'"
            :style="{ transform: imageTransform }"
            draggable="false"
            @load="imgLoaded = true"
          />
        </div>

        <div
          class="relative z-30 pb-10 flex justify-center py-4
                 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
        >
          <p class="text-white/30 text-xs">
            {{ t('photos.zoomHint') }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fullscreen-photo-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fullscreen-photo-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fullscreen-photo-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.fullscreen-photo-leave-to {
  opacity: 0;
  transform: scale(0.95);
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
