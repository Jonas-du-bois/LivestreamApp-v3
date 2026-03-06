<script setup lang="ts">
/**
 * UiMediaCard
 * Carte standardisée contenant une image (en couverture totale ou séparée du texte).
 * Utilise UiGlassCard en interne pour bénéficier de l'effet glassmorphism natif du design system.
 */

interface Props {
  image: string
  alt?: string
  to?: string
  variant?: 'cover' | 'split'
  imageHeight?: string
  interactive?: boolean
  gradient?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'split',
  alt: 'Card image',
  interactive: true,
  gradient: 'bg-gradient-to-t from-gray-900 to-transparent'
})

// Détermine la hauteur de la zone image par défaut en fonction de la variante choisie.
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
    <div
      class="relative w-full overflow-hidden shrink-0"
      :class="[variant === 'split' ? heightClass : 'absolute inset-0 h-full']"
    >
      <div
        class="absolute inset-0 z-10 transition-opacity duration-300"
        :class="gradient"
      />

      <ImageWithFallback
        :src="image"
        :alt="alt"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-active:scale-105 opacity-80"
      />

      <div class="absolute inset-0 z-20 pointer-events-none p-4 flex flex-col justify-between">
        <div class="flex justify-between items-start">
            <slot name="image-top" />
        </div>

        <div class="w-full">
            <slot name="image-bottom" />
        </div>
      </div>
    </div>

    <!-- Zone de contenu textuel sous l'image, visible uniquement dans la variante 'split' -->
    <div v-if="variant === 'split'" class="relative flex-1 flex flex-col p-4">
      <slot />
    </div>
  </UiGlassCard>
</template>
