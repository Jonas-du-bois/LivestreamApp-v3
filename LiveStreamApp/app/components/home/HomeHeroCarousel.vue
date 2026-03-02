<script setup lang="ts">
/**
 * ⚛️ HomeHeroCarousel
 * Carousel premium pour la section Hero de l'accueil.
 * Alterne entre les directs, les dernières photos, les résultats récents et les infos de l'événement.
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FlickrService } from '~/services/flickr.service'
import { PublicService } from '~/services/public.service'
import { useNow } from '~/composables/useNow'
import type { PassageEnriched, Stream, Passage } from '~/types/api'

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

const { t, locale } = useI18n()
const { translateApparatus } = useTranslatedData()
const router = useRouter()
const { now } = useNow()

// --- Countdown Logic for Afterparty ---
const { timeLeftShort: afterpartyCountdown } = usePartyCountdown()

// --- Additional Data Fetching ---
const { data: albumResp } = await FlickrService.getAlbum()
const { data: resultsResp } = await PublicService.getResults()

// --- Carousel State ---
const currentIndex = ref(0)
const rotationInterval = ref<any>(null)
const SLIDE_DURATION = 15000 // 8 seconds per slide

// --- Slide Construction ---
const slides = computed(() => {
  const items: any[] = []

  // 1. Priorité aux Directs (Live)
  if (props.livePassages.length > 0) {
    props.livePassages.slice(0, 2).forEach((p, idx) => {
      const s = props.liveStreams.find((stream: Stream) => {
        if (!stream.currentPassage) return false
        if (typeof stream.currentPassage === 'string') return stream.currentPassage === p._id
        return (stream.currentPassage as Passage)._id === p._id
      })

      let heroImage = 'https://images.unsplash.com/photo-1764622078388-df36863688d3?q=80&w=2340&auto=format&fit=crop'
      if (s?.url && s.url.includes('youtube')) {
        const m = s.url.match(/embed\/([a-zA-Z0-9_-]{11})/)
        if (m && m[1]) heroImage = `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg`
      }

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

  // 2. Dernières Photos (Flickr)
  if (albumResp.value?.photos && albumResp.value.photos.length > 0) {
    const latestPhoto = albumResp.value.photos[0]
    items.push({
      id: `photo-${latestPhoto.id}`,
      type: 'photo',
      title: t('home.photos') || 'Galerie Photos',
      subtitle: t('home.latestPhotos') || 'Découvrez les clichés de la journée',
      image: latestPhoto.url_l || latestPhoto.url_o || latestPhoto.url_m,
      to: '/photos',
      badge: {
        label: 'New',
        variant: 'cyan',
        showDot: true
      }
    })
  }

  // 3. Derniers Résultats
  if (resultsResp.value && resultsResp.value.length > 0) {
    const lastResult = resultsResp.value[0]
    items.push({
      id: `result-${lastResult._id}`,
      type: 'result',
      title: lastResult.group?.name || 'Résultat',
      subtitle: `${lastResult.score} pts • ${t('results.title')}`,
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2340&auto=format&fit=crop',
      to: '/results',
      badge: {
        label: t('nav.results'),
        variant: 'orange'
      }
    })
  }

  // 4. Afterparty (Countdown context)
  items.push({
    id: 'afterparty',
    type: 'afterparty',
    title: 'AFTER PARTY',
    subtitle: t('afterparty.themeValue') || 'Thème: Bad Taste',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2340&auto=format&fit=crop',
    to: '/afterparty',
    badge: {
      label: 'Soon',
      variant: 'violet',
      pulse: true
    }
  })

  // 5. Restauration
  items.push({
    id: 'food',
    type: 'food',
    title: t('food.title'),
    subtitle: t('food.subtitle'),
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2340',
    to: '/food',
    badge: {
      label: t('common.open'),
      variant: 'green',
      showDot: true
    }
  })

  return items
})

const currentSlide = computed(() => slides.value[currentIndex.value] || slides.value[0])

// --- Rotation Logic ---
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
  startRotation() // Reset timer on manual change
}

onMounted(() => {
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
    <!-- Main Carousel -->
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
                  {{ afterpartyCountdown }}
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

    <!-- Interactive Navigation Dots -->
    <div 
      v-if="slides.length > 1"
      class="absolute bottom-6 right-8 z-30 flex items-center gap-3"
    >
      <button
        v-for="(_, index) in slides"
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
          <!-- Progress Fill Layer -->
          <span 
            v-if="currentIndex === index"
            class="absolute inset-0 bg-white hero-dot-progress block"
            :style="{ animationDuration: `${SLIDE_DURATION}ms` }"
          ></span>
        </span>
      </button>
    </div>

    <!-- Click Overlay for interactivity since MediaCard is non-interactive inside -->
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

/* Animations Premium */
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

/* Reveal effect for text */
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

/* Dot Progress Animation */
.hero-dot-progress {
  animation: dot-progress linear forwards;
}

@keyframes dot-progress {
  from { width: 0%; }
  to { width: 100%; }
}

/* Badge pop animation */
.badge-pop-enter-active {
  animation: badge-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-pop-in {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
