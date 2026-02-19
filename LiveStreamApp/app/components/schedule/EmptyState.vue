<script setup lang="ts">
interface Props {
  title: string
  description: string
  buttonLabel: string
}

defineProps<Props>()

const emit = defineEmits<{
  clearFilters: []
}>()
</script>

<template>
  <div class="glass-card p-6 text-center">
    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
      <Icon name="fluent:filter-dismiss-24-regular" class="h-7 w-7 text-cyan-300" />
    </div>

    <h3 class="text-white text-lg font-semibold">
      {{ title }}
    </h3>

    <p class="mt-1 text-sm text-white/65">
      {{ description }}
    </p>

    <button
      class="mt-5 inline-flex items-center gap-2 rounded-full gradient-cyan-purple px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      type="button"
      @click="emit('clearFilters')"
    >
      <Icon name="fluent:arrow-reset-24-regular" class="h-4 w-4" />
      <span>{{ buttonLabel }}</span>
    </button>
  </div>
</template>
