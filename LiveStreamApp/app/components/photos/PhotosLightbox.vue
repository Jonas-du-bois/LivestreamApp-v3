<script setup lang="ts">
/**
 * ⚛️ PhotosLightbox
 * Visionneuse plein écran pour le galerie de photos Flickr.
 * - Navigation prev/next via boutons ou touches fléchées
 * - Fermeture via Echap, bouton ou clic sur le fond
 * - Swipe horizontal sur mobile
 * - Transition directionnelle (gauche/droite) entre photos
 * - Verrouillage du scroll du body pendant l'ouverture
 * - Affiche l'image en grande résolution (url_l → url_z en fallback)
 */
import type { FlickrPhoto } from '~/types/flickr'

interface Props {
  photos: FlickrPhoto[]
  /** Index de la photo affichée, null = fermé */
  modelValue: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const { t, locale } = useI18n()

// ─── État de navigation ─────────────────────────────────────────────────────
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

// ─── Direction de navigation (pour les transitions directionnelles) ──────────
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

// ─── Chargement de l'image (lié à la photo affichée via sa clé) ────────────
const imgLoaded = ref(false)
const imgError = ref(false)

watch(currentIndex, () => {
  imgLoaded.value = false
  imgError.value = false
})

// ─── Formatage date/heure ───────────────────────────────────────────────────
const formattedDateTime = computed(() => {
  if (!currentPhoto.value) return ''
  const d = new Date(currentPhoto.value.dateUpload * 1000)
  const loc = locale.value === 'de' ? 'de-CH' : locale.value === 'it' ? 'it-CH' : 'fr-CH'
  return d.toLocaleString(loc, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
})

// ─── Clavier ────────────────────────────────────────────────────────────────
const handleKeyDown = (e: KeyboardEvent) => {
  if (!isOpen.value) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
  if (e.key === 'ArrowRight') { e.preventDefault(); next() }
}

// ─── Swipe tactile ──────────────────────────────────────────────────────────
let touchStartX = 0
let touchStartY = 0

const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0]!.clientX
  touchStartY = e.touches[0]!.clientY
}

const handleTouchEnd = (e: TouchEvent) => {
  const dx = e.changedTouches[0]!.clientX - touchStartX
  const dy = Math.abs(e.changedTouches[0]!.clientY - touchStartY)
  // Ignorer si le geste est plus vertical qu'horizontal (scroll)
  if (dy > Math.abs(dx)) return
  if (Math.abs(dx) > 50) {
    if (dx < 0) next()
    else prev()
  }
}

// ─── Verrouillage du scroll ──────────────────────────────────────────────────
watch(isOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

// ─── Lifecycle ──────────────────────────────────────────────────────────────
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
        <!-- Arrière-plan opaque avec blur -->
        <div
          class="absolute inset-0 bg-black/96 backdrop-blur-lg"
          @click="close"
        />

        <!-- ─── Header ──────────────────────────────────────────────────── -->
        <div
          class="relative z-10 flex items-center justify-between gap-3 px-4 py-3
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
            <!-- Compteur -->
            <span class="text-white/40 text-xs tabular-nums mr-1">
              {{ (currentIndex ?? 0) + 1 }} / {{ photos.length }}
            </span>

            <!-- Bouton ouvrir l'original -->
            <a
              :href="currentPhoto.urls.l"
              target="_blank"
              rel="noopener noreferrer"
              class="glass-card p-2.5 rounded-full active:scale-95 transition-all
                     hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none
                     flex items-center justify-center"
              :aria-label="t('photos.openOriginal')"
              :title="t('photos.openOriginal')"
              @click.stop
            >
              <Icon name="fluent:arrow-expand-24-regular" class="w-5 h-5 text-white" />
            </a>

            <!-- Bouton fermer -->
            <button
              type="button"
              class="glass-card p-2.5 rounded-full active:scale-95 transition-all
                     hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
              :aria-label="t('common.close')"
              @click="close"
            >
              <Icon name="fluent:dismiss-24-regular" class="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <!-- ─── Zone image avec transition directionnelle ────────────────── -->
        <div class="relative z-10 flex-1 overflow-hidden">
          <!-- Bouton précédent (par-dessus la transition) -->
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

          <!-- Bouton suivant (par-dessus la transition) -->
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

          <!-- Contenu image avec transition directionnelle (clé = id de la photo) -->
          <Transition :name="transitionName">
            <div
              :key="currentPhoto.id"
              class="absolute inset-0 flex items-center justify-center px-14"
            >
              <!-- Skeleton pendant le chargement -->
              <div
                v-if="!imgLoaded && !imgError"
                class="absolute inset-[15%] rounded-2xl premium-skeleton-surface premium-skeleton-shimmer"
              />

              <!-- Image grande résolution -->
              <img
                v-if="!imgError"
                :key="`img-${currentPhoto.id}`"
                :src="currentPhoto.urls.l"
                :alt="currentPhoto.title || 'Photo'"
                class="relative max-w-full max-h-full object-contain rounded-lg
                       transition-opacity duration-300 select-none"
                :class="imgLoaded ? 'opacity-100' : 'opacity-0'"
                draggable="false"
                @load="imgLoaded = true"
                @error="imgError = true"
              />

              <!-- État d'erreur -->
              <div v-if="imgError" class="flex flex-col items-center gap-3 text-white/30">
                <Icon name="fluent:image-off-24-regular" class="text-6xl" />
                <span class="text-sm">{{ t('photos.imageUnavailable') }}</span>
              </div>
            </div>
          </Transition>
        </div>

        <!-- ─── Footer – strip indicateur de position ─────────────────── -->
        <div
          class="relative z-10 pb-safe flex justify-center py-4 gap-1.5
                 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
        >
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
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── Ouverture / fermeture du lightbox ─── */
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

/* ─── Transition de navigation suivant (glissement vers la gauche) ─── */
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

/* ─── Fade simple (ouverture directe) ─── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
