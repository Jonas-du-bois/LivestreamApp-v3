<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PhotosGrid from '~/components/photos/PhotosGrid.vue'
import PhotosGridSkeleton from '~/components/photos/PhotosGridSkeleton.vue'
import PhotosLightbox from '~/components/photos/PhotosLightbox.vue'

const { t } = useI18n()

// ─── Données Flickr ──────────────────────────────────────────────────────────
const {
  photos,
  total,
  pending,
  error,
  hasLoadedOnce,
  newPhotoIds,
  newPhotoCount,
  clearNewPhotos
} = useFlickrPhotos()

// ─── Lightbox ────────────────────────────────────────────────────────────────
const lightboxIndex = ref<number | null>(null)

const openLightbox = (index: number) => {
  lightboxIndex.value = index
}

// ─── Horodatage de la dernière mise à jour ───────────────────────────────────
const lastUpdated = ref<Date | null>(null)
const { formatLocalizedTime } = useTranslatedData()

watch(photos, (val) => {
  if (val.length) lastUpdated.value = new Date()
}, { immediate: false })

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) return ''
  return formatLocalizedTime(lastUpdated.value.toISOString())
})

// ─── États de la page ────────────────────────────────────────────────────────
const showSkeleton = computed(() => !hasLoadedOnce.value)
const showError = computed(() => hasLoadedOnce.value && !!error.value && !photos.value.length)
const showEmpty = computed(() => hasLoadedOnce.value && !error.value && !photos.value.length)
const showGrid = computed(() => hasLoadedOnce.value && photos.value.length > 0)

// ─── Gestion du banner "nouvelles photos" ────────────────────────────────────
const handleNewPhotosBanner = () => {
  clearNewPhotos()
  // Scroll vers le haut pour voir les nouvelles photos
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="min-h-screen pb-24 pt-safe">

    <!-- ─── Bouton retour ─────────────────────────────────────────────────── -->
    <div class="px-6 pt-4 pb-2">
      <UiBackButton to="/">
        {{ t('common.back') }}
      </UiBackButton>
    </div>

    <!-- ─── Hero ──────────────────────────────────────────────────────────── -->
    <div class="relative px-6 py-6 mb-4">
      <!-- Glow décoration -->
      <div
        class="pointer-events-none absolute top-0 right-0 p-6 opacity-20"
        aria-hidden="true"
      >
        <Icon
          name="fluent:camera-24-filled"
          class="text-9xl text-cyan-500 blur-2xl animate-pulse"
        />
      </div>

      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-white mb-2 uppercase tracking-wide">
            {{ t('photos.title') }}<span class="text-cyan-500">.</span>
          </h1>
          <p class="text-white/60 text-sm max-w-xs">
            {{ t('photos.subtitle') }}
          </p>
        </div>

        <!-- Badge LIVE animé -->
        <div class="flex-shrink-0 pt-1">
          <UiStatusBadge variant="cyan" :show-dot="true" :pulse="true">
            {{ t('photos.live') }}
          </UiStatusBadge>
        </div>
      </div>

      <!-- Horodatage dernière mise à jour -->
      <Transition name="fade">
        <div
          v-if="lastUpdatedLabel"
          class="mt-3 flex items-center gap-1.5 text-white/30 text-xs"
        >
          <Icon name="fluent:arrow-sync-circle-24-regular" class="w-3.5 h-3.5" />
          <span>{{ t('photos.updatedAt', { time: lastUpdatedLabel }) }}</span>
        </div>
      </Transition>
    </div>

    <!-- ─── Compteur de photos ────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showGrid" class="px-6 mb-4 flex items-center justify-between">
        <p class="text-white/30 text-xs">
          {{ t('photos.photoCount', { count: total }) }}
        </p>
        <!-- Indicateur de refresh en cours (polls suivants) -->
        <Transition name="fade">
          <div
            v-if="pending && hasLoadedOnce"
            class="flex items-center gap-1.5 text-cyan-400/60 text-xs"
          >
            <Icon name="fluent:arrow-sync-24-regular" class="w-3 h-3 animate-spin" />
            <span>{{ t('common.loading') }}</span>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ─── Banner nouvelles photos ──────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="newPhotoCount > 0" class="px-6 mb-5">
        <button
          type="button"
          class="w-full text-left active:scale-[0.98] transition-transform duration-200 outline-none
                 focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl"
          @click="handleNewPhotosBanner"
        >
          <UiInfoTile
            variant="feature"
            icon-shape="circle"
            accent="cyan"
            icon="fluent:arrow-download-24-regular"
            :label="t('photos.newPhotos', { count: newPhotoCount })"
            class="bg-cyan-500/10 border-cyan-400/30 rounded-xl"
          >
            <span class="text-cyan-300/70">{{ t('photos.seeNew') }}</span>
          </UiInfoTile>
        </button>
      </div>
    </Transition>

    <!-- ─── Skeleton (premier chargement) ───────────────────────────────── -->
    <PhotosGridSkeleton v-if="showSkeleton" :count="12" />

    <!-- ─── Erreur ────────────────────────────────────────────────────────── -->
    <div v-else-if="showError" class="px-6">
      <UiEmptyState
        icon="fluent:warning-24-regular"
        :title="t('photos.errorTitle')"
        :description="t('photos.errorDescription')"
        :glass="true"
      />
    </div>

    <!-- ─── Aucune photo ───────────────────────────────────────────────────── -->
    <div v-else-if="showEmpty" class="px-6">
      <UiEmptyState
        icon="fluent:camera-off-24-regular"
        :title="t('photos.emptyTitle')"
        :description="t('photos.emptyDescription')"
        :glass="true"
        :pulse="true"
      />
    </div>

    <!-- ─── Grille photos ──────────────────────────────────────────────────── -->
    <PhotosGrid
      v-else-if="showGrid"
      :photos="photos"
      :new-photo-ids="newPhotoIds"
      @open-lightbox="openLightbox"
    />

    <!-- ─── Lightbox ──────────────────────────────────────────────────────── -->
    <PhotosLightbox
      v-model="lightboxIndex"
      :photos="photos"
    />

  </div>
</template>
