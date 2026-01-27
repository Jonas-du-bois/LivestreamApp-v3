<script setup lang="ts">
interface Props {
  isOpen: boolean
  groupName?: string
}

const props = defineProps<Props>()
const isOpen = toRef(props, 'isOpen')
const groupName = computed(() => props.groupName ?? 'FSG Yverdon')

const emit = defineEmits<{
  close: []
}>()

const groupDetails = {
  name: 'FSG Yverdon',
  category: 'Actifs',
  city: 'Yverdon-les-Bains',
  gymnasts: 34,
  coaches: 3,
  coachNames: ['Marie Dupont', 'Jean Martin', 'Sophie Bernard'],
  pastScores: [
    { apparatus: 'Sol', score: 9.88 },
    { apparatus: 'Barres', score: 9.65 },
    { apparatus: 'Poutre', score: 9.72 },
    { apparatus: 'Saut', score: 9.77 }
  ]
}

const historicalData = [
  { year: '2020', Sol: 9.35, Barres: 9.28, Poutre: 9.42, Saut: 9.38 },
  { year: '2021', Sol: 9.48, Barres: 9.41, Poutre: 9.55, Saut: 9.52 },
  { year: '2022', Sol: 9.62, Barres: 9.58, Poutre: 9.68, Saut: 9.65 },
  { year: '2023', Sol: 9.71, Barres: 9.65, Poutre: 9.72, Saut: 9.74 },
  { year: '2024', Sol: 9.82, Barres: 9.77, Poutre: 9.85, Saut: 9.88 },
  { year: '2025', Sol: 9.88, Barres: 9.85, Poutre: 9.91, Saut: 9.95 }
]

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('')
}

const isFavorite = ref(false)

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="scale">
      <div
        v-if="isOpen"
        class="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90%] md:max-w-lg glass-panel z-[90] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <!-- Header with Photo and Wave Mask -->
        <div class="relative h-48 overflow-hidden flex-shrink-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1764622078388-df36863688d3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            :alt="groupName"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B1120]" />
          <svg
            class="absolute bottom-0 w-full"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            style="height: 60px"
          >
            <path
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
              fill="#0B1120"
            />
          </svg>
          
          <div class="absolute top-4 right-4 z-10">
            <button
              @click="emit('close')"
              class="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-lg transition-colors"
            >
              <Icon name="fluent:dismiss-24-regular" class="w-5 h-5 text-white" />
            </button>
          </div>

          <div class="absolute bottom-6 left-6 right-6 z-10">
            <h2 class="text-white font-bold text-2xl mb-1">{{ groupName }}</h2>
            <p class="text-white/80">{{ groupDetails.category }} • {{ groupDetails.city }}</p>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Stats Grid -->
          <div class="grid grid-cols-3 gap-3">
            <div class="glass-card p-4 text-center">
              <Icon name="fluent:people-24-regular" class="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div class="text-white font-bold text-xl">{{ groupDetails.gymnasts }}</div>
              <div class="text-white/60 text-xs">Gymnastes</div>
            </div>
            <div class="glass-card p-4 text-center">
              <Icon name="fluent:person-24-regular" class="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div class="text-white font-bold text-xl">{{ groupDetails.coaches }}</div>
              <div class="text-white/60 text-xs">Moniteurs</div>
            </div>
            <div class="glass-card p-4 text-center">
              <Icon name="fluent:arrow-trending-24-regular" class="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div class="text-white font-bold text-xl">9.75</div>
              <div class="text-white/60 text-xs">Moyenne</div>
            </div>
          </div>

          <!-- Coaches -->
          <div>
            <h3 class="text-white font-bold mb-3">Moniteurs</h3>
            <div class="glass-card p-4 space-y-3">
              <div 
                v-for="coach in groupDetails.coachNames" 
                :key="coach"
                class="flex items-center gap-3"
              >
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-sm font-bold">
                    {{ getInitials(coach) }}
                  </span>
                </div>
                <span class="text-white">{{ coach }}</span>
              </div>
            </div>
          </div>

          <!-- Past Scores -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <Icon name="fluent:arrow-trending-24-regular" class="w-5 h-5 text-cyan-400" />
              <h3 class="text-white font-bold">Scores actuels</h3>
            </div>
            <div class="glass-card p-4 space-y-2">
              <div 
                v-for="score in groupDetails.pastScores" 
                :key="score.apparatus"
                class="flex items-center justify-between"
              >
                <span class="text-white/80">{{ score.apparatus }}</span>
                <span class="text-cyan-400 font-bold">{{ score.score.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Historical Timeline (simplified without Recharts) -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <Icon name="fluent:history-24-regular" class="w-5 h-5 text-cyan-400" />
              <h3 class="text-white font-bold">Historique des notes</h3>
            </div>
            <div class="glass-card p-4">
              <div class="space-y-2">
                <div 
                  v-for="data in historicalData" 
                  :key="data.year"
                  class="flex items-center gap-4"
                >
                  <span class="text-white/60 text-sm w-12">{{ data.year }}</span>
                  <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      class="h-full gradient-cyan-purple rounded-full"
                      :style="{ width: `${(data.Sol / 10) * 100}%` }"
                    />
                  </div>
                  <span class="text-cyan-400 font-bold text-sm w-10">{{ data.Sol.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Action -->
        <div class="p-6 border-t border-white/10 flex-shrink-0">
          <button 
            @click="toggleFavorite"
            class="w-full gradient-cyan-purple py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Icon 
              :name="isFavorite ? 'fluent:heart-24-filled' : 'fluent:heart-24-regular'" 
              class="w-5 h-5" 
            />
            {{ isFavorite ? 'Retirer des Favoris' : 'Ajouter aux Favoris' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}
.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
