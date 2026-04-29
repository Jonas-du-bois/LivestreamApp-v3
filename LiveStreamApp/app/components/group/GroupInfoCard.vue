<script setup lang="ts">
import type { Group } from '../../types/api'

interface Props {
  group: Group
}

const props = defineProps<Props>()
const { t } = useI18n()
const { translateCategory } = useTranslatedData()

// Calcule la note moyenne
const averageScore = computed(() => {
  if (typeof (props.group as any).averageScore === 'number') {
    return (props.group as any).averageScore.toFixed(2)
  }
  return '0.00'
})

const categoryLabel = computed(() => {
  return translateCategory(props.group.category)
})

const categoryColor = computed(() => {
  return props.group.category === 'MIXTE' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
})

// Regroupe les statistiques dans un tableau pour faciliter le rendu.
const stats = computed(() => [
  {
    id: 'average',
    label: t('group.average'),
    value: averageScore.value,
    icon: 'fluent:arrow-trending-24-regular',
    color: 'text-cyan-400',
    rotate: '-rotate-6',
    decimals: 2,
    duration: 2500
  }
])
</script>

<template>
  <div class="glass-panel overflow-hidden flex flex-col">
    <div class="relative h-48 overflow-hidden flex-shrink-0">
      <ImageWithFallback
        :src="group.logo || '/img/group-fallback.png'"
        :alt="group.name"
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

      <div class="absolute bottom-6 left-6 right-6 z-10">
        <div class="flex items-start justify-between gap-3 mb-2">
          <h2 class="text-white font-bold text-2xl">{{ group.name }}</h2>
          <div :class="['px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0', categoryColor]">
            {{ categoryLabel }}
          </div>
        </div>
        <p class="text-white/80">{{ group.canton }}</p>
      </div>
    </div>

    <div class="flex-1 p-6 space-y-6 overflow-y-auto">
      <TransitionGroup
        tag="div"
        class="grid grid-cols-1 gap-3"
        name="staggered-fade"
        appear
      >
        <div
          v-for="(stat, index) in stats"
          :key="stat.id"
          class="glass-card p-4 text-center group hover:bg-white/10 hover:scale-105 transition-transform duration-300 cursor-default relative"
          :style="{ transitionDelay: `${index * 100}ms` }"
        >
          <Icon
            :name="stat.icon"
            :class="['w-6 h-6 mx-auto mb-2 transition-transform duration-300 group-hover:scale-110', stat.color, `group-hover:${stat.rotate}`]"
          />
          <div class="text-white font-bold text-xl">
            <AnimatedCounter
              :value="stat.value"
              :decimals="stat.decimals || 0"
              :duration="stat.duration || 2000"
            />
          </div>
          <div class="text-white/60 text-xs">{{ stat.label }}</div>
        </div>
      </TransitionGroup>

      <div v-if="group.category === 'MIXTE'" class="glass-card p-4">
        <div class="flex items-start gap-3">
          <Icon name="fluent:people-team-24-regular" class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 class="text-white font-semibold text-sm mb-1">{{ t('group.mixedGroup') }}</h4>
            <p class="text-white/60 text-xs">
              {{ t('group.mixedGroupInfo') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.staggered-fade-enter-active {
  transition: all 0.6s ease-out;
}
.staggered-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.staggered-fade-leave-active {
  transition: all 0.3s ease-in;
  position: absolute;
}
.staggered-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.staggered-fade-move {
  transition: transform 0.4s ease;
}
</style>
