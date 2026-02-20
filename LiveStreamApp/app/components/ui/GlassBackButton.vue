<script setup lang="ts">
import { NuxtLink } from '#components'

const props = withDefaults(defineProps<{
  to?: string
  icon?: string
}>(), {
  icon: 'fluent:chevron-left-24-regular'
})
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    class="glass-panel px-3 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-white/20 active:scale-95 transition-all duration-200 shadow-lg border border-white/10"
  >
    <Icon :name="icon" class="w-5 h-5 text-white" />
    <span class="text-white text-sm font-medium">
      <slot />
    </span>
  </component>
</template>
