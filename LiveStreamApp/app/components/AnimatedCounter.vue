<script setup lang="ts">
/**
 * AnimatedCounter
 * Anime une transition fluide d'une valeur numérique vers une autre.
 */
const props = defineProps({
  value: {
    type: [Number, String],
    required: true
  },
  duration: {
    type: Number,
    default: 1500
  },
  decimals: {
    type: Number,
    default: 0
  }
})

const displayValue = ref(0)

// Déclenche l'animation de la valeur en utilisant requestAnimationFrame pour la fluidité.
const animate = () => {
  const end = Number(props.value)
  if (isNaN(end)) return

  const start = displayValue.value
  const startTime = performance.now()

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / props.duration, 1)

    // Fonction d'easing 'ease out quart' pour un atterrissage progressif.
    const easeProgress = 1 - Math.pow(1 - progress, 4)

    const current = start + (end - start) * easeProgress
    displayValue.value = current

    if (progress < 1) {
      requestAnimationFrame(step)
    } else {
      displayValue.value = end
    }
  }

  requestAnimationFrame(step)
}

watch(() => props.value, () => {
  animate()
})

onMounted(() => {
  animate()
})
</script>

<template>
  <span class="tabular-nums inline-block">{{ displayValue.toFixed(decimals) }}</span>
</template>
