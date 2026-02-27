<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

const { t } = useI18n()

// Plein écran sans layout standard
definePageMeta({ header: false, footer: false })

// Configuration de la date (9 Mai 2026 à 22h00)
const partyDate = new Date('2026-05-09T22:00:00')
const timeLeft = ref('')

// Timer countdown
const updateTimer = () => {
  const now = new Date()
  const diff = partyDate.getTime() - now.getTime()
  
  if (diff <= 0) {
    timeLeft.value = t('afterparty.countdownNow')
    return
  }
  
  const d = Math.floor(diff / (1000 * 60 * 60 * 24))
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const s = Math.floor((diff % (1000 * 60)) / 1000)
  
  timeLeft.value = `${d}j ${h}h ${m}m ${s}s`
}

let timerInterval: any

onMounted(() => {
  updateTimer()
  timerInterval = setInterval(updateTimer, 1000)
})

onUnmounted(() => clearInterval(timerInterval))

// Galerie photos
const galleryImages = [
  'https://images.unsplash.com/photo-1768053922344-871bedfed3b6?q=80&w=2340&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=800&auto=format&fit=crop'
]

// Infos clés
const highlights = computed(() => [
  {
    icon: 'fluent:clock-alarm-24-filled',
    label: t('afterparty.startLabel'),
    value: t('afterparty.startTime'),
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30"
  },
  {
    icon: 'fluent:music-note-2-24-filled',
    label: 'Ambiance',
    value: t('afterparty.ambience'),
    color: "text-violet-300",
    bg: "bg-violet-600/10 border-violet-600/30"
  },
  {
    icon: 'fluent:location-24-filled',
    label: t('afterparty.locationLabel'),
    value: t('afterparty.locationValue'), 
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30"
  }
])

// Menu des boissons organisé par catégories
const drinkMenu = computed(() => [
  {
    category: t('afterparty.categories.beers'),
    icon: 'fluent:drink-beer-24-filled',
    drinks: [
      { name: t('afterparty.drinks.beerSmall'), price: '5' },
      { name: t('afterparty.drinks.beerLarge'), price: '7' },
      { name: t('afterparty.drinks.beerBottle'), price: '6' }
    ]
  },
  {
    category: t('afterparty.categories.cocktails'),
    icon: 'fluent:drink-margarita-24-regular',
    drinks: [
      { name: 'Mojito', price: '12' },
      { name: 'Gin Tonic', price: '11' },
      { name: 'Vodka Red Bull', price: '13' },
      { name: 'Tequila Sunrise', price: '12' }
    ]
  },
  {
    category: t('afterparty.categories.wines'),
    icon: 'fluent:drink-wine-24-filled',
    drinks: [
      { name: t('afterparty.drinks.whiteWine'), price: '5' },
      { name: t('afterparty.drinks.redWine'), price: '5' },
      { name: 'Spritz', price: '10' }
    ]
  },
  {
    category: t('afterparty.categories.softs'),
    icon: 'fluent:drink-bottle-24-regular',
    drinks: [
      { name: 'Coca-Cola', price: '4' },
      { name: 'Ice Tea', price: '4' },
      { name: t('afterparty.drinks.water'), price: '3' },
      { name: 'Red Bull', price: '5' }
    ]
  },
  {
    category: t('afterparty.categories.shots'),
    icon: 'fluent:beaker-24-regular',
    drinks: [
      { name: t('afterparty.drinks.vodkaShot'), price: '4' },
      { name: t('afterparty.drinks.tequilaShot'), price: '4' }
    ]
  }
])
</script>

<template>
  
  <div class="min-h-screen bg-gray-950 relative overflow-hidden">
    <!-- Background style app avec LiquidBackground -->
    <LiquidBackground />

    <!-- Header avec safe area -->
    <div class="absolute top-safe left-4 right-4 z-50 pt-4 flex justify-between items-start">
      <!-- Bouton Back -->
      <UiBackButton to="/">
        {{ t('common.back') }}
      </UiBackButton>
      
      <!-- Chip Coming Soon -->
      <UiStatusBadge variant="violet" show-dot pulse>
        {{ t('afterparty.comingSoon') }}
      </UiStatusBadge>
    </div>

    <!-- Contenu scrollable -->
    <div class="relative z-10 pt-32 pb-16 px-6">
      <Transition name="premium-swap" appear>
        <div class="space-y-0">
          <!-- Titre -->
          <div class="text-center mb-8">
            <h1 class="text-6xl font-black italic tracking-tighter mb-3 text-white drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              AFTER<br>PARTY
            </h1>
            <p class="text-white/80 font-bold tracking-[0.3em] uppercase text-xs mb-2">{{ t('afterparty.subtitle') }}</p>
          </div>

          <!-- Countdown Timer -->
          <div class="mb-8 flex justify-center">
            <div class="relative group">
              <div class="absolute -inset-1 bg-violet-500/40 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition duration-500"></div>
              <div class="relative px-8 py-5 bg-black/90 backdrop-blur-xl border border-violet-500/30 rounded-xl">
                <p class="text-[10px] text-white/60 uppercase tracking-[0.3em] mb-2 text-center font-bold">{{ t('afterparty.countdownLabel') }}</p>
                <p class="text-3xl font-mono font-bold text-white tracking-wider text-center">
                  {{ timeLeft || '--j --h --m' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Thème BAD TASTE - Mise en avant -->
          <div class="mb-8 pt-6">
            <div class="relative group">
              <div class="absolute -inset-0.5 bg-violet-500/50 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse-slow"></div>
              <UiGlassCard class="relative bg-black/90 backdrop-blur-md rounded-3xl border-2 border-violet-500/40 overflow-hidden" padding="p-6">
                <!-- Motif décoratif -->
                <div class="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl"></div>
                
                <div class="relative">
                  <div class="flex items-center gap-3 mb-3">
                    <UiIconBox
                      icon="fluent:sparkle-24-filled"
                      variant="gradient"
                      color="violet"
                      shape="circle"
                      size="lg"
                      glow
                      pulse
                    />
                    <div>
                      <p class="text-[10px] text-white/60 uppercase tracking-[0.25em] font-bold">{{ t('afterparty.themeLabel') }}</p>
                      <h2 class="text-3xl font-black italic text-white">
                        {{ t('afterparty.themeValue') }}
                      </h2>
                    </div>
                  </div>
                  <p class="text-white/80 text-sm leading-relaxed pl-1">
                    {{ t('afterparty.themeDescription') }}
                  </p>
                </div>
              </UiGlassCard>
            </div>
          </div>

          <!-- Galerie défilante -->
          <div class="relative -mx-6 py-6 mb-8 overflow-hidden">
            <div class="flex gap-4 animate-scroll whitespace-nowrap px-4">
              <div 
                v-for="(img, i) in [...galleryImages, ...galleryImages]" 
                :key="i"
                class="inline-block h-48 w-72 shrink-0 rounded-2xl overflow-hidden border border-violet-500/30 shadow-xl relative group"
              >
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 group-hover:from-black/70 transition-all"></div>
                <img :src="img" class="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Party ambiance" />
              </div>
            </div>
          </div>

          <!-- Infos pratiques -->
          <div class="grid grid-cols-1 gap-4 mb-8">
            <UiInfoTile
              v-for="item in highlights" 
              :key="item.label"
              variant="stat"
              size="lg"
              accent="violet"
              :icon="item.icon"
              :label="item.label"
              :value="item.value"
              class="bg-black/70 transition-all hover:scale-[1.02] active:scale-95"
              :class="item.bg"
            />
          </div>

          <!-- Menu des boissons avec prix -->
          <div class="mb-8 py-6">
            <UiGlassCard class="bg-black/80 backdrop-blur-md rounded-3xl border border-violet-500/30 shadow-2xl" padding="p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <UiSectionTitle tag="h2" size="xl" class="flex items-center gap-3 mb-1">
                    <Icon name="fluent:drink-bottle-24-regular" class="text-violet-400" size="28" />
                    {{ t('afterparty.drinksTitle') }}
                  </UiSectionTitle>
                  <p class="text-white/60 text-xs uppercase tracking-wider">{{ t('afterparty.drinksSubtitle') }}</p>
                </div>
                <div class="px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-400/40">
                  <span class="text-[8px] font-bold text-white uppercase tracking-wider">{{ t('afterparty.paymentMethods') }}</span>
                </div>
              </div>

              <!-- Liste des boissons par catégorie -->
              <div class="space-y-6">
                <div 
                  v-for="(category, catIdx) in drinkMenu" 
                  :key="catIdx"
                >
                  <!-- Titre de catégorie -->
                  <div class="flex items-center gap-2 mb-3">
                    <Icon :name="category.icon" class="text-violet-400" size="20" />
                    <h3 class="text-sm font-bold text-white uppercase tracking-wider">{{ category.category }}</h3>
                  </div>
                  
                  <!-- Boissons de la catégorie -->
                  <div class="space-y-2">
                    <div 
                      v-for="(drink, idx) in category.drinks" 
                      :key="idx" 
                      class="flex items-center justify-between p-3 rounded-xl bg-violet-500/5 hover:bg-violet-500/10 transition-colors border border-violet-500/20"
                    >
                      <span class="text-white text-sm font-medium">{{ drink.name }}</span>
                      <div class="flex items-center gap-1.5">
                        <span class="text-sm font-mono font-bold text-white/80">CHF</span>
                        <span class="text-lg font-mono font-bold text-violet-400">{{ drink.price }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UiGlassCard>
          </div>

          <!-- Footer infos -->
          <div class="text-center space-y-3 pt-4 pb-safe">
            <div class="flex items-center justify-center gap-6 text-white/70 text-sm">
              <span class="flex items-center gap-2">
                <Icon name="fluent:ticket-diagonal-24-regular" class="w-4 h-4" />
                {{ t('afterparty.entryValue') }}
              </span>
              <span class="w-px h-4 bg-white/30"></span>
              <span class="flex items-center gap-2">
                <Icon name="fluent:people-24-regular" class="w-4 h-4" />
                {{ t('afterparty.ageValue') }}
              </span>
            </div>
            <p class="text-white/60 text-xs">{{ t('afterparty.dressCode') }}</p>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Safe area */
.top-safe {
  top: env(safe-area-inset-top, 0px);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

/* Défilement horizontal (Marquee) */
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-scroll {
  display: flex;
  width: max-content;
  animation: scroll 25s linear infinite;
}

.animate-scroll:hover {
  animation-play-state: paused;
}

/* Glass morphism */
.glass-panel {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
