<script setup lang="ts">
import { isNativePlatform } from '~/utils/capacitor'

const { t } = useI18n()
const route = useRoute()
const pwaInstallRef = ref<InstanceType<typeof import('./components/PwaInstallPrompt.vue').default> | null>(null)
// Démarre à false pour éviter le flash SSR sur les pages autres que home
const showSplash = ref(false)

// Initialisation globale du Socket pour les notifications et mises à jour temps réel
useNotificationSocket()

const splashStorageKey = 'coupedesbains:splash:seen'
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
  // Le splash ne s'affiche qu'une seule fois par session, uniquement depuis la page d'accueil.
  // Naviguer directement vers /photos ou toute autre sous-page ne le déclenche jamais.
  const hasSeenSplash = sessionStorage.getItem(splashStorageKey) === '1'
  const isHomePage = route.path === '/'

  if (hasSeenSplash || !isHomePage) {
    // Déjà vu cette session OU accès direct à une sous-page → pas de splash
    showSplash.value = false
    return
  }

  // Première visite sur la page d'accueil
  showSplash.value = true
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const splashDuration = prefersReducedMotion ? 500 : 1900

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

    <UiNetworkToast />
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
