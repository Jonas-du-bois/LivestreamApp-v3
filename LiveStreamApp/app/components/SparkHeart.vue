<script setup lang="ts">
const props = defineProps<{
  active: boolean
  label?: string
}>()

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
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

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<template>
  <button
    type="button"
    class="relative p-2 rounded-full flex-shrink-0 transition-all duration-300 ease-out active:scale-75 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none group"
    :class="{ 'scale-125': isAnimating }"
    :aria-label="label"
    @click="handleClick"
  >
    <Icon
      :name="active ? 'fluent:heart-24-filled' : 'fluent:heart-24-regular'"
      class="w-6 h-6 transition-colors duration-300 relative z-10"
      :class="active ? 'text-red-400' : 'text-white/60 group-hover:text-red-300'"
    />
  </button>
</template>
