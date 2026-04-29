<script setup lang="ts">
/**
 * HomeHeroCarousel
 * Carousel premium pour la section Hero de l'accueil.
 * Alterne entre les directs, les dernières photos, les résultats récents et les infos de l'événement.
 */

import { useI18n } from 'vue-i18n'
import { FlickrService } from '~/services/flickr.service'
import { PublicService } from '~/services/public.service'
import { useNow } from '~/composables/useNow'
import type { PassageEnriched, Stream, Passage } from '~/types/api'

// Utilise une technique "Two-Pass Render" pour éviter les erreurs d'hydratation Vue (Mismatch DOM/Server) causées par le temps réel.
// isMounted reste false pendant le SSR et la 1ère passe client. Il passe à true après onMounted(), activant les données dynamiques.

interface Props {
  livePassages?: PassageEnriched[]
  liveStreams?: Stream[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  livePassages: () => [],
  liveStreams: () => [],
  loading: false
})

const { t } = useI18n()
// ⚠️ DEAD CODE : const { locale } = useI18n()
const { translateApparatus } = useTranslatedData()
const router = useRouter()
// ⚠️ DEAD CODE : const { now } = useNow()

const { timeLeftShort: afterpartyCountdown } = usePartyCountdown()

// Requêtes non bloquantes pour récupérer les données secondaires du carrousel.
const { data: albumResp } = FlickrService.getAlbum()
const { data: resultsResp } = PublicService.getResults()

const isMounted = ref(false)

// Affiche un placeholder pendant le SSR pour éviter le Text Mismatch du compte à rebours.
const displayCountdown = computed(() =>
  isMounted.value ? afterpartyCountdown.value : '...'
)

const currentIndex = ref(0)
const rotationInterval = ref<ReturnType<typeof setInterval> | null>(null)
const SLIDE_DURATION = 15000 

// Slides statiques utilisées pour garantir une correspondance exacte entre le serveur (SSR) et le premier rendu client.
const ssrSlides = computed(() => [
  {
    id: 'afterparty',
    type: 'afterparty',
    title: 'AFTER PARTY',
    subtitle: t('afterparty.themeValue') || 'Thème: Bad Taste',
    image: '/img/hero-1.png',
    to: '/afterparty',
    badge: { label: 'Soon', variant: 'violet', pulse: true, showDot: false }
  },
  {
    id: 'food',
    type: 'food',
    title: t('food.title'),
    subtitle: t('food.subtitle'),
    image: '/img/hero-2.png',
    to: '/food',
    badge: { label: t('common.open'), variant: 'green', showDot: true, pulse: false }
  }
])

// Construit dynamiquement les slides en fonction de l'actualité de l'événement (Live, Photos, Résultats).
const dynamicSlides = computed(() => {
  const items: any[] = []

  if (props.livePassages.length > 0) {
    props.livePassages.slice(0, 2).forEach((p, idx) => {
      const s = props.liveStreams.find((stream: Stream) => {
        if (!stream.currentPassage) return false
        if (typeof stream.currentPassage === 'string') return stream.currentPassage === p._id
        return (stream.currentPassage as Passage)._id === p._id
      })

      const heroImage = getStreamThumbnailUrl(s?.url, '/img/hero-fallback.png')

      items.push({
        id: `live-${p._id}`,
        type: 'live',
        title: p.group?.name || 'Compétition en direct',
        subtitle: `${p.location || ''} • ${translateApparatus(p.apparatus?.code, p.apparatus?.name)}`,
        image: heroImage,
        to: s?._id ? `/stream/${s._id}` : '/stream',
        badge: {
          label: t('home.live'),
          variant: 'solid-red',
          pulse: true,
          showDot: true
        }
      })
    })
  }

  const photos = albumResp.value?.photos
  if (Array.isArray(photos) && photos.length > 0) {
    const latestPhoto = photos[0]!
    items.push({
      id: `photo-${latestPhoto.id}`,
      type: 'photo',
      title: t('home.photos') || 'Galerie Photos',
      subtitle: t('home.latestPhotos') || 'Découvrez les clichés de la journée',
      image: latestPhoto.urls?.l || latestPhoto.urls?.z || latestPhoto.urls?.m,
      to: '/photos',
      badge: {
        label: 'New',
        variant: 'cyan',
        showDot: true
      }
    })
  }

  const results = resultsResp.value
  if (Array.isArray(results) && results.length > 0) {
    const lastResult = results[0]
    items.push({
      id: `result-${lastResult._id}`,
      type: 'result',
      title: lastResult.group?.name || 'Résultat',
      subtitle: `${lastResult.score} pts • ${t('results.title')}`,
      image: '/img/hero-3.png',
      to: '/results',
      badge: {
        label: t('nav.results'),
        variant: 'orange'
      }
    })
  }

  items.push({
    id: 'afterparty',
    type: 'afterparty',
    title: 'AFTER PARTY',
    subtitle: t('afterparty.themeValue') || 'Thème: Bad Taste',
    image: '/img/hero-4.png',
    to: '/afterparty',
    badge: {
      label: 'Soon',
      variant: 'violet',
      pulse: true
    }
  })

  items.push({
    id: 'food',
    type: 'food',
    title: t('food.title'),
    subtitle: t('food.subtitle'),
    image: '/img/hero-5.png',
    to: '/food',
    badge: {
      label: t('common.open'),
      variant: 'green',
      showDot: true
    }
  })

  return items
})

const slides = computed(() =>
  isMounted.value ? dynamicSlides.value : ssrSlides.value
)

const currentSlide = computed(() => slides.value[currentIndex.value] || slides.value[0])

// Gère la rotation automatique du carrousel.
const startRotation = () => {
  stopRotation()
  if (slides.value.length <= 1) return
  rotationInterval.value = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % slides.value.length
  }, SLIDE_DURATION)
}

const stopRotation = () => {
  if (rotationInterval.value) {
    clearInterval(rotationInterval.value)
    rotationInterval.value = null
  }
}

const manualChange = (index: number) => {
  currentIndex.value = index
  startRotation() 
}

onMounted(() => {
  // L'ordre est crucial : isMounted doit être true pour peupler dynamicSlides AVANT de lancer la rotation.
  isMounted.value = true
  startRotation()
})

onUnmounted(() => {
  stopRotation()
})

watch(() => slides.value.length, (newLen) => {
  if (currentIndex.value >= newLen) {
    currentIndex.value = 0
  }
  if (newLen > 1 && !rotationInterval.value) {
    startRotation()
  }
})

const handleHeroClick = () => {
  if (currentSlide.value?.to) {
    router.push(currentSlide.value.to)
  }
}
</script>

<template>
  <div class="relative w-full h-64 sm:h-80 overflow-hidden rounded-3xl shadow-2xl group border border-white/10">
    <TransitionGroup 
      name="hero-slide" 
      tag="div" 
      class="relative w-full h-full"
    >
      <div 
        v-for="(slide, index) in slides" 
        v-show="currentIndex === index"
        :key="slide.id"
        class="absolute inset-0 w-full h-full"
        :class="{ 'photo-zoom': slide.type === 'photo' }"
      >
        <UiMediaCard
          :image="slide.image"
          :alt="slide.title"
          variant="cover"
          image-height="h-full"
          gradient="gradient-overlay"
          :interactive="false"
          class="h-full !border-0 !rounded-none"
          @click="handleHeroClick"
        >
          <template #image-top>
            <div v-if="slide.type === 'afterparty'" class="ml-auto pointer-events-auto">
              <Transition name="badge-pop" appear>
                <UiStatusBadge variant="violet" pulse>
                  <Icon name="fluent:clock-24-regular" class="w-3 h-3 mr-1" />
                  {{ displayCountdown }}
                </UiStatusBadge>
              </Transition>
            </div>
          </template>

          <template #image-bottom>
            <div class="premium-content-reveal pb-2">
              <div class="flex items-center gap-2 mb-3">
                <Transition name="badge-pop" appear>
                  <UiStatusBadge 
                    v-if="slide.badge"
                    :variant="slide.badge.variant" 
                    :show-dot="slide.badge.showDot" 
                    :pulse="slide.badge.pulse"
                  >
                    {{ slide.badge.label }}
                  </UiStatusBadge>
                </Transition>
              </div>
              <h2 class="text-white text-3xl sm:text-4xl font-black mb-1 drop-shadow-xl tracking-tight">
                {{ slide.title }}
              </h2>
              <p class="text-white/90 text-sm sm:text-base font-medium drop-shadow-md">
                {{ slide.subtitle }}
              </p>
            </div>
          </template>
        </UiMediaCard>
      </div>
    </TransitionGroup>

    <div 
      v-if="slides && slides.length > 1"
      class="absolute bottom-6 right-8 z-30 flex items-center gap-3"
    >
      <button
        v-for="(_, index) in (slides || [])"
        :key="index"
        @click.stop="manualChange(index)"
        class="relative flex items-center justify-center outline-none group/dot after:content-[''] after:absolute after:-inset-4"
        :aria-label="`Slide ${index + 1}`"
      >
        <span
          class="relative h-2 transition-all duration-500 rounded-full overflow-hidden block"
          :class="[
            currentIndex === index ? 'w-8 bg-white/40' : 'w-2 bg-white/20 group-hover/dot:bg-white/40'
          ]"
        >
          <span 
            v-if="currentIndex === index"
            class="absolute inset-0 bg-white hero-dot-progress block"
            :style="{ animationDuration: `${SLIDE_DURATION}ms` }"
          ></span>
        </span>
      </button>
    </div>

    <!-- Couche invisible permettant de rendre toute la carte cliquable puisque le contenu est désactivé pour éviter les conflits d'interaction -->
    <button 
      type="button"
      class="absolute inset-0 z-20 w-full h-full cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400 focus-visible:outline-none"
      @click="handleHeroClick"
      :aria-label="currentSlide?.title"
    />
  </div>
</template>

<style scoped>
.gradient-overlay {
  background: linear-gradient(
    to top, 
    rgba(11, 17, 32, 0.95) 0%, 
    rgba(11, 17, 32, 0.6) 35%, 
    rgba(11, 17, 32, 0.2) 60%,
    transparent 100%
  );
}

.hero-slide-enter-active {
  transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.hero-slide-leave-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-slide-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(1.05);
  filter: blur(10px);
}
.hero-slide-leave-to {
  opacity: 0;
  transform: translateX(-40px) scale(0.95);
  filter: blur(10px);
}

.premium-content-reveal {
  animation: reveal 1s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.hero-dot-progress {
  animation: dot-progress linear forwards;
}

@keyframes dot-progress {
  from { width: 0%; }
  to { width: 100%; }
}

.photo-zoom :deep(img) {
  transform: scale(1.1);
  transform-origin: center center;
}

.badge-pop-enter-active {
  animation: badge-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-pop-in {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
