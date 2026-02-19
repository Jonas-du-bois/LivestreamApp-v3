<script setup lang="ts">
import { isNativePlatform } from '~/utils/capacitor'

const pwaInstallRef = ref<InstanceType<typeof import('./components/PwaInstallPrompt.vue').default> | null>(null)
const showSplash = ref(true)
const splashStorageKey = 'livestreamapp:splash:seen'
let splashTimeout: ReturnType<typeof setTimeout> | undefined

// Optionnel: Stocker si l'utilisateur a déjà vu/refusé le prompt
const hasSeenInstallPrompt = useCookie('pwa-install-seen', {
  default: () => false,
  maxAge: 60 * 60 * 24 * 30 // 30 jours
})

// Désactiver le PWA prompt en mode natif (Capacitor) et après refus utilisateur
const showPwaPrompt = computed(() => !isNativePlatform() && !hasSeenInstallPrompt.value)

const handleInstallSuccess = () => {
  console.log('✅ PWA installée avec succès!')
  hasSeenInstallPrompt.value = true
}

const handleUserChoice = (choice: 'accepted' | 'dismissed') => {
  console.log('Choix utilisateur:', choice)
  if (choice === 'dismissed') {
    hasSeenInstallPrompt.value = true
  }
}

onMounted(() => {
  const hasSeenSplash = sessionStorage.getItem(splashStorageKey) === '1'
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const splashDuration = hasSeenSplash ? 280 : prefersReducedMotion ? 500 : 1900

  splashTimeout = window.setTimeout(() => {
    showSplash.value = false
    sessionStorage.setItem(splashStorageKey, '1')
  }, splashDuration)
})

onBeforeUnmount(() => {
  if (splashTimeout) {
    clearTimeout(splashTimeout)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#0B1120] relative overflow-hidden">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :keepalive="{ max: 10 }" />
    </NuxtLayout>
    
    <!-- PWA Install Prompt - Désactivé en mode natif (Capacitor) -->
    <PwaInstallPrompt 
      v-if="showPwaPrompt && !showSplash"
      ref="pwaInstallRef"
      @install-success="handleInstallSuccess"
      @user-choice-result="handleUserChoice"
    />

    <Transition name="splash-fade">
      <AppSplashScreen v-if="showSplash" />
    </Transition>
  </div>
</template>

<style>
.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.splash-fade-enter-from,
.splash-fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}
</style>
