<script setup lang="ts">
/**
 * ⚛️ UiMediaCard
 * Carte standardisée avec Image (Cover ou Split).
 * Utilise UiGlassCard en interne pour l'effet glassmorphism.
 */

interface Props {
  /** Image source URL */
  image: string
  /** Alt text for image */
  alt?: string
  /** Optional link */
  to?: string
  /** Variant: 'cover' (Image as background) or 'split' (Image top, content bottom) */
  variant?: 'cover' | 'split'
  /** Height of the image area (default: 'h-40' for split, 'h-64' for cover) */
  imageHeight?: string
  /** Interactive state (hover effects) */
  interactive?: boolean
  /** Custom gradient class (default: 'bg-gradient-to-t from-gray-900 to-transparent') */
  gradient?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'split',
  alt: 'Card image',
  interactive: true,
  gradient: 'bg-gradient-to-t from-gray-900 to-transparent'
})

// Default height based on variant if not provided
const heightClass = computed(() => {
  if (props.imageHeight) return props.imageHeight
  return props.variant === 'cover' ? 'h-64' : 'h-40'
})
</script>

<template>
  <UiGlassCard
    :to="to"
    :interactive="interactive"
    padding="p-0"
    class="overflow-hidden group relative flex flex-col"
    :class="[variant === 'cover' ? heightClass : '']"
  >
    <!-- Image Area -->
    <div
      class="relative w-full overflow-hidden shrink-0"
      :class="[variant === 'split' ? heightClass : 'absolute inset-0 h-full']"
    >
      <!-- Gradient Overlay -->
      <div
        class="absolute inset-0 z-10 transition-opacity duration-300"
        :class="gradient"
      />

      <!-- Image -->
      <ImageWithFallback
        :src="image"
        :alt="alt"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-active:scale-105 opacity-80"
      />

      <!-- Content Overlay (Top/Bottom of image) -->
      <!-- Use 'pointer-events-none' on wrapper, 'auto' on children if needed -->
      <div class="absolute inset-0 z-20 pointer-events-none p-4 flex flex-col justify-between">
        <!-- Top Area (Badges) -->
        <div class="flex justify-between items-start">
            <slot name="image-top" />
        </div>

        <!-- Bottom Area (Title, IconBox) -->
        <div class="w-full">
            <slot name="image-bottom" />
        </div>
      </div>
    </div>

    <!-- Body Content (Only for split) -->
    <div v-if="variant === 'split'" class="relative flex-1 flex flex-col p-4">
      <slot />
    </div>
  </UiGlassCard>
</template>
