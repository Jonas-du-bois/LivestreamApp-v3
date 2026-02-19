<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

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

const animate = () => {
  const end = Number(props.value)
  if (isNaN(end)) return

  const start = displayValue.value // Start from current value to avoid jumping to 0
  const startTime = performance.now()

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / props.duration, 1)

    // Ease out quart: 1 - (1 - t)^4
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
