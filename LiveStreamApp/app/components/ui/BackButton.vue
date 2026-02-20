<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  to?: string | null
  label?: string
  glass?: boolean
}>(), {
  to: null,
  label: 'Retour',
  glass: true
})

const router = useRouter()

const goBack = () => {
  if (props.to) return

  try {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  } catch (e) {
    router.push('/')
  }
}
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'button'"
    :to="to"
    @click="!to && goBack()"
    class="inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95 text-white shadow-lg group"
    :class="[
      glass ? 'glass-panel bg-black/40 border border-white/10 hover:bg-white/20' : 'hover:bg-white/10'
    ]"
  >
    <Icon
      name="fluent:chevron-left-24-regular"
      class="w-5 h-5 text-white transition-transform group-hover:-translate-x-0.5"
    />
    <span class="text-sm font-medium">
      <slot>{{ label }}</slot>
    </span>
  </component>
</template>
