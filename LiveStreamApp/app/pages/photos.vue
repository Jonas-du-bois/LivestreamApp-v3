<script setup lang="ts">
import PhotosGrid from '~/components/photos/PhotosGrid.vue'
import PhotosGridSkeleton from '~/components/photos/PhotosGridSkeleton.vue'
import PhotosLightbox from '~/components/photos/PhotosLightbox.vue'

const { t } = useI18n()

useSeoMeta({
  title: () => t('photos.title'),
  description: () => t('photos.subtitle')
})

// ─── Données Flickr ──────────────────────────────────────────────────────────
const {
  photos,
  total,
  pending,
  error,
  refresh,
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
  return formatLocalizedTime(lastUpdated.value)
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
    <UiPageHeader
      class="px-6"
      :title="t('photos.title')"
      :subtitle="t('photos.subtitle')"
      icon="fluent:camera-24-filled"
      icon-color="accent-text-primary"
      accent-color="accent-text-primary"
    >
      <template #badge>
        <!-- Badge LIVE animé -->
        <UiStatusBadge variant="cyan" :show-dot="true" :pulse="true">
          {{ t('photos.live') }}
        </UiStatusBadge>
      </template>

      <template #bottom>
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
      </template>
    </UiPageHeader>

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
            class="flex items-center gap-1.5 text-cyan-300/70 text-xs"
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
          class="app-focus-ring w-full text-left active:scale-[0.98] transition-transform duration-200 rounded-xl"
          @click="handleNewPhotosBanner"
        >
          <UiInfoTile
            variant="feature"
            icon-shape="circle"
            accent="cyan"
            icon="fluent:arrow-download-24-regular"
            :label="t('photos.newPhotos', { count: newPhotoCount })"
            class="rounded-xl"
          >
            <span class="text-cyan-200/80">{{ t('photos.seeNew') }}</span>
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
      >
        <template #actions>
          <button
            type="button"
            class="app-focus-ring flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30
                   text-cyan-300 text-sm font-semibold active:scale-95 transition-transform duration-150
                   hover:bg-cyan-500/25"
            @click="refresh()"
          >
            <Icon name="fluent:arrow-sync-24-regular" class="w-4 h-4" :class="{ 'animate-spin': pending }" />
            {{ t('photos.retryButton') }}
          </button>
        </template>
      </UiEmptyState>
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
