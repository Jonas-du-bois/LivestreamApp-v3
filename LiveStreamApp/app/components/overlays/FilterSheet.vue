<script setup lang="ts">
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const { t, locale } = useI18n()
const { translateApparatus, translateCategory } = useTranslatedData()

// Access shared metadata from schedule.vue
const meta = useState<any>('scheduleMeta')
const availableApparatus = computed(() => meta.value?.availableApparatus || [])
const availableCategories = computed(() => meta.value?.availableCategories || [])
const availableLocations = computed(() => meta.value?.availableLocations || [])

// Global Filter State
const filtersStore = useScheduleFilters()

// Local State (for editing)
const selectedDivision = useState<string[]>('filter-sheet-division', () => [])
const selectedSalle = useState<string[]>('filter-sheet-salle', () => [])
const selectedApparatus = useState<string[]>('filter-sheet-apparatus', () => [])

// Sync local state with global state when opening
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedDivision.value = [...filtersStore.value.division]
    selectedSalle.value = [...filtersStore.value.salle]
    selectedApparatus.value = [...filtersStore.value.apparatus]
  }
})

const toggleSelection = (value: string, arrayName: 'division' | 'salle' | 'apparatus') => {
  const array = arrayName === 'division' ? selectedDivision
              : arrayName === 'salle' ? selectedSalle
              : selectedApparatus

  const index = array.value.indexOf(value)
  if (index > -1) {
    array.value.splice(index, 1)
  } else {
    array.value.push(value)
  }
}

const clearFilters = () => {
  selectedDivision.value = []
  selectedSalle.value = []
  selectedApparatus.value = []
}

const applyFilters = () => {
  filtersStore.value.division = [...selectedDivision.value]
  filtersStore.value.salle = [...selectedSalle.value]
  filtersStore.value.apparatus = [...selectedApparatus.value]
  emit('close')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="isOpen"
        class="fixed left-0 right-0 glass-panel rounded-t-3xl z-[70] max-h-[80vh] overflow-hidden overlay-safe-bottom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
      >
        <!-- Header -->
        <div class="p-6 border-b border-white/10">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <Icon name="fluent:options-24-regular" class="w-6 h-6 text-cyan-400" />
              <h2 id="filter-sheet-title" class="text-white font-bold text-xl">{{ t('filters.title') }}</h2>
            </div>
            <button
              @click="emit('close')"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors"
              :aria-label="t('common.close')"
            >
              <Icon name="fluent:dismiss-24-regular" class="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto p-6 space-y-6 max-h-[calc(80vh-180px)]">

          <!-- Apparatus Filter (Dynamic) -->
          <div v-if="availableApparatus.length > 0">
            <h3 class="text-white font-bold mb-3">{{ t('filters.apparatus') }}</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="app in availableApparatus"
                :key="`${app.code || app}-${locale}`"
                @click="toggleSelection(app.name || app, 'apparatus')"
                class="py-3 px-4 rounded-lg text-sm font-medium transition-all"
                :class="selectedApparatus.includes(app.name || app)
                  ? 'bg-cyan-400 text-[#0B1120]'
                  : 'glass-card text-white/80'"
                :aria-pressed="selectedApparatus.includes(app.name || app)"
              >
                {{ translateApparatus(app.code, app.name) || app }}
              </button>
            </div>
          </div>

          <!-- Division Filter -->
          <div v-if="availableCategories.length > 0">
            <h3 class="text-white font-bold mb-3">{{ t('filters.division') }}</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="division in availableCategories"
                :key="`${division}-${locale}`"
                @click="toggleSelection(division, 'division')"
                class="py-3 px-4 rounded-lg text-sm font-medium transition-all"
                :class="selectedDivision.includes(division)
                  ? 'bg-cyan-400 text-[#0B1120]'
                  : 'glass-card text-white/80'"
                :aria-pressed="selectedDivision.includes(division)"
              >
                {{ translateCategory(division) }}
              </button>
            </div>
          </div>

          <!-- Salle Filter -->
          <div v-if="availableLocations.length > 0">
            <h3 class="text-white font-bold mb-3">{{ t('filters.hall') }}</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="salle in availableLocations"
                :key="salle"
                @click="toggleSelection(salle, 'salle')"
                class="py-3 px-4 rounded-lg text-sm font-medium transition-all"
                :class="selectedSalle.includes(salle)
                  ? 'gradient-cyan-purple text-white'
                  : 'glass-card text-white/80'"
                :aria-pressed="selectedSalle.includes(salle)"
              >
                {{ salle }}
              </button>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-6 border-t border-white/10 flex gap-3">
          <button
            @click="clearFilters"
            class="flex-1 glass-card py-3 rounded-xl text-white font-medium hover:bg-white/15 transition-colors"
          >
            {{ t('filters.clear') }}
          </button>
          <button
            @click="applyFilters"
            class="flex-1 gradient-cyan-purple py-3 rounded-xl text-white font-medium"
          >
            {{ t('filters.apply') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
