<script setup lang="ts">
type Accent = 'cyan' | 'emerald' | 'pink' | 'orange' | 'violet'

const props = withDefaults(defineProps<{
  to: string
  label: string
  icon: string
  accent?: Accent
  badge?: string | null
  ariaLabel?: string
}>(), {
  accent: 'cyan',
  badge: null,
  ariaLabel: undefined
})

const accentRgbMap: Record<Accent, string> = {
  cyan: '34 211 238',
  emerald: '52 211 153',
  pink: '244 114 182',
  orange: '251 146 60',
  violet: '167 139 250'
}

const accentStyle = computed(() => ({
  '--accent-rgb': accentRgbMap[props.accent]
}))

const resolvedAriaLabel = computed(() => props.ariaLabel || props.label)
</script>

<template>
  <NuxtLink
    :to="props.to"
    :aria-label="resolvedAriaLabel"
    :style="accentStyle"
    class="home-quick-action glass-card relative isolate h-full min-h-[132px] rounded-xl p-4 flex flex-col items-center justify-center text-center focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
  >
    <div class="home-quick-action__sheen absolute inset-x-4 top-1 h-10 rounded-full pointer-events-none" aria-hidden="true" />

    <span
      v-if="props.badge"
      class="home-quick-action__badge absolute top-2 right-2 text-[11px] font-bold px-2 py-0.5 rounded-full pointer-events-none"
    >
      {{ props.badge }}
    </span>

    <div class="home-quick-action__icon-wrap w-12 h-12 rounded-full flex items-center justify-center mb-3">
      <Icon :name="props.icon" class="home-quick-action__icon w-6 h-6" />
    </div>

    <span class="text-white/85 text-sm font-semibold leading-tight">{{ props.label }}</span>
  </NuxtLink>
</template>

<style scoped>
.home-quick-action {
  border-color: rgba(255, 255, 255, 0.16);
  background:
    linear-gradient(165deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 42%, rgba(255, 255, 255, 0.12) 100%);
  box-shadow:
    0 10px 24px rgba(3, 7, 18, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
  transition: transform 0.2s ease, box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;
}

.home-quick-action::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% -10%, rgba(var(--accent-rgb), 0.34), transparent 65%);
  opacity: 0.22;
  transition: opacity 0.25s ease;
}

.home-quick-action:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--accent-rgb), 0.44);
  box-shadow:
    0 14px 28px rgba(3, 7, 18, 0.32),
    0 0 0 1px rgba(var(--accent-rgb), 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.home-quick-action:hover::before {
  opacity: 0.34;
}

.home-quick-action:active {
  transform: scale(0.985);
}

.home-quick-action__sheen {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.33), rgba(255, 255, 255, 0));
  filter: blur(8px);
  opacity: 0.65;
}

.home-quick-action__icon-wrap {
  background: linear-gradient(145deg, rgba(var(--accent-rgb), 0.3), rgba(var(--accent-rgb), 0.16));
  border: 1px solid rgba(var(--accent-rgb), 0.42);
  box-shadow:
    0 8px 16px rgba(var(--accent-rgb), 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.home-quick-action__icon {
  color: rgb(var(--accent-rgb));
  filter: drop-shadow(0 0 5px rgba(var(--accent-rgb), 0.55));
}

.home-quick-action__badge {
  background: rgba(11, 17, 32, 0.7);
  color: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(var(--accent-rgb), 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 6px 12px rgba(2, 6, 23, 0.35);
}

@media (prefers-reduced-motion: reduce) {
  .home-quick-action,
  .home-quick-action::before {
    transition: none;
  }

  .home-quick-action:hover,
  .home-quick-action:active {
    transform: none;
  }
}
</style>
