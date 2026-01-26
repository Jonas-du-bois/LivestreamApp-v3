<script setup lang="ts">
interface Props {
  isOpen: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const searchQuery = ref('')

const popularSearches = [
  'FSG Yverdon',
  'FSG Lausanne',
  'Division 1',
  'Barres',
  'Résultats Sol'
]

const searchInput = ref<HTMLInputElement | null>(null)

watch(() => searchQuery.value, () => {
  // Could implement search logic here
})

onMounted(() => {
  // Focus input when opened
  nextTick(() => {
    searchInput.value?.focus()
  })
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

    <Transition name="slide-down">
      <div
        v-if="isOpen"
        class="fixed top-4 left-4 right-4 glass-panel z-[70] overflow-hidden max-w-2xl mx-auto"
      >
        <!-- Search Input -->
        <div class="p-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <Icon name="fluent:search-24-regular" class="w-5 h-5 text-white/60 flex-shrink-0" />
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un groupe, une salle..."
              class="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-lg"
            />
            <button
              @click="emit('close')"
              class="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <Icon name="fluent:dismiss-24-regular" class="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>

        <!-- Search Results / Suggestions -->
        <div class="p-4 max-h-[60vh] overflow-y-auto">
          <template v-if="!searchQuery">
            <h3 class="text-white/60 text-sm font-medium mb-3 flex items-center gap-2">
              <Icon name="fluent:arrow-trending-24-regular" class="w-4 h-4" />
              Recherches populaires
            </h3>
            <div class="space-y-2">
              <button
                v-for="search in popularSearches"
                :key="search"
                @click="searchQuery = search"
                class="w-full glass-card p-3 text-left text-white hover:bg-white/15 transition-colors rounded-lg"
              >
                {{ search }}
              </button>
            </div>
          </template>
          <template v-else>
            <div class="text-white/60 text-center py-8">
              Aucun résultat pour "{{ searchQuery }}"
            </div>
          </template>
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

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100px);
}
</style>
