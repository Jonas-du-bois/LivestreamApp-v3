<script setup lang="ts">
import { isNativePlatform } from '~/utils/capacitor'

const pwaInstallRef = ref<InstanceType<typeof import('./components/PwaInstallPrompt.vue').default> | null>(null)

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
</script>

<template>
  <div class="min-h-screen bg-[#0B1120] relative overflow-hidden">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage :keepalive="{ max: 10 }" />
    </NuxtLayout>
    
    <!-- PWA Install Prompt - Désactivé en mode natif (Capacitor) -->
    <PwaInstallPrompt 
      v-if="showPwaPrompt"
      ref="pwaInstallRef"
      @install-success="handleInstallSuccess"
      @user-choice-result="handleUserChoice"
    />
  </div>
</template>
