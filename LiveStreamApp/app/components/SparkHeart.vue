<script setup lang="ts">
const props = defineProps<{
  active: boolean
  label?: string
}>()

const isAnimating = ref(false)

watch(() => props.active, (newVal) => {
  if (newVal) {
    isAnimating.value = true
    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }
})
</script>

<template>
  <button
    type="button"
    class="relative p-2 rounded-full transition-all duration-300 ease-out hover:bg-white/10 active:scale-75 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none group"
    :class="{ 'scale-125': isAnimating }"
    :aria-label="label"
  >
    <Icon
      :name="active ? 'fluent:heart-24-filled' : 'fluent:heart-24-regular'"
      class="w-6 h-6 transition-colors duration-300 relative z-10"
      :class="active ? 'text-red-400' : 'text-white/60 group-hover:text-red-300'"
    />
  </button>
</template>
