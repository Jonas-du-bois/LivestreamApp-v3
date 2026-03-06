<script setup lang="ts">
/**
 * PwaInstallPrompt
 * Composant d'intégration du web component @khmyznikov/pwa-install.
 * Intercepte et relaie les événements liés à l'installation de la PWA sur le navigateur.
 */

const props = defineProps<{
  manifestUrl?: string
}>()

const { t } = useI18n()
const pwaInstallRef = ref<HTMLElement | null>(null)
const showInstallButton = ref(false)

const emit = defineEmits<{
  (e: 'install-success'): void
  (e: 'install-fail'): void
  (e: 'user-choice-result', choice: 'accepted' | 'dismissed'): void
  (e: 'install-available', event: CustomEvent): void
  (e: 'install-how-to', event: CustomEvent): void
}>()

// Mise en place des écouteurs natifs pour "traduire" les CustomEvents du Web Component en événements Vue (emit).
onMounted(() => {
  if (!pwaInstallRef.value) return

  pwaInstallRef.value.addEventListener('pwa-install-success-event', () => {
    emit('install-success')
  })

  pwaInstallRef.value.addEventListener('pwa-install-fail-event', () => {
    emit('install-fail')
  })

  pwaInstallRef.value.addEventListener('pwa-user-choice-result-event', (e: Event) => {
    const customEvent = e as CustomEvent
    emit('user-choice-result', customEvent.detail?.message)
  })

  pwaInstallRef.value.addEventListener('pwa-install-available-event', (e: Event) => {
    showInstallButton.value = true
    emit('install-available', e as CustomEvent)
  })

  pwaInstallRef.value.addEventListener('pwa-install-how-to-event', (e: Event) => {
    emit('install-how-to', e as CustomEvent)
  })
})

const openInstallPrompt = () => {
  if (pwaInstallRef.value) {
    (pwaInstallRef.value as any).showDialog(true)
  }
}

const hideInstallPrompt = () => {
  if (pwaInstallRef.value) {
    (pwaInstallRef.value as any).hideDialog()
  }
}

// Expose les fonctions de pilotage au composant parent (ex: Bouton d'installation custom dans la navigation).
defineExpose({
  openInstallPrompt,
  hideInstallPrompt,
  showInstallButton
})
</script>

<template>
  <ClientOnly>
    <pwa-install
      ref="pwaInstallRef"
      :manifest-url="manifestUrl || '/manifest.webmanifest'"
      name="Coupe des Bains"
      description="Suivez les scores en direct de la FSG"
      icon="/icons/logo_livestreamappv3-192.png"
      :install-description="t('pwa.installDescription')"
      disable-screenshots="true"
    />
  </ClientOnly>
</template>

<style>
pwa-install {
  --install-focus-color: #6366f1;
  --install-button-color: #6366f1;
  --card-background-color: rgba(17, 24, 39, 0.95);
  --card-color: #f3f4f6;
}
</style>
