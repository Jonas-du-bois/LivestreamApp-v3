<template>
  <div class="px-4 space-y-6 pb-6">
    <!-- Bouton retour -->
    <div class="px-2 pt-2">
      <UiBackButton to="/">
        {{ t('common.back') }}
      </UiBackButton>
    </div>

    <!-- Hero Section -->
    <div class="relative py-6 mb-4">
      <div class="pointer-events-none absolute top-0 right-0 p-6 opacity-20" aria-hidden="true">
        <Icon name="fluent:food-pizza-24-filled" class="text-9xl text-blue-500 blur-2xl animate-pulse" />
      </div>
      <h1 class="text-3xl font-black text-white mb-2 uppercase tracking-wide">
        {{ t('food.title') }}
        <span class="text-blue-500">.</span>
      </h1>
      <p class="text-white/60 text-sm max-w-xs">
        {{ t('food.subtitle') }}
      </p>
    </div>

    <!-- Filtres Catégories -->
    <UiFilterChips
      v-model="activeCategory"
      :items="categories"
      color="blue"
      :aria-label="t('food.title')"
      class="mb-8 px-4"
    />
    
    <div class=" mb-8">
      <UiInfoTile
        variant="feature"
        icon-shape="circle"
        accent="blue"
        icon="fluent:wallet-credit-card-24-regular"
        :label="t('food.paymentMethods')"
        class="bg-blue-500/5 border-blue-500/20 rounded-xl"
      >
        <span class="text-blue-200/70">{{ t('food.paymentInfo') }}</span>
      </UiInfoTile>
    </div>

    <TransitionGroup
      name="list"
      tag="div"
      class=" grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <UiMediaCard
        v-for="(spot, index) in filteredSpots"
        :key="spot.id"
        :image="spot.image"
        :alt="spot.name"
        variant="split"
        :interactive="true"
        class="premium-cascade-item rounded-2xl bg-gray-900/40 backdrop-blur-xl border-white/10 shadow-xl hover:border-blue-400/30 hover:shadow-blue-900/20 active:border-blue-400/60 active:bg-gray-800/60 active:scale-[0.98] transition-all duration-300"
        :style="{ '--cascade-index': index }"
      >
        <template #image-top>
          <div class="ml-auto pointer-events-auto">
            <UiStatusBadge
              :variant="spot.isOpen ? 'green' : 'red'"
              :show-dot="spot.isOpen"
              :pulse="spot.isOpen"
            >
              {{ spot.isOpen ? t('common.open') : t('common.closed') }}
            </UiStatusBadge>
          </div>
        </template>

        <template #image-bottom>
          <div class="flex items-end gap-3 pointer-events-auto">
            <UiIconBox
              :icon="spot.icon"
              variant="solid"
              color="blue"
              shape="rounded"
              size="md"
            />
            <div>
              <p class="text-blue-400 text-xs font-bold uppercase tracking-wider mb-0.5">{{ spot.type }}</p>
              <h2 class="text-xl font-bold text-white leading-none">{{ spot.name }}</h2>
            </div>
          </div>
        </template>

        <template #default>
          <p class="text-white/60 text-sm mb-6 leading-relaxed">
            {{ spot.description }}
          </p>

          <div class="bg-white/5 rounded-xl p-4 border border-white/5">
            <h4 class="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Icon name="fluent:options-20-filled" />
              {{ t('food.onTheMenu') }}
            </h4>
            <ul class="space-y-3">
              <li v-for="(item, idx) in spot.menu" :key="idx" class="flex items-end justify-between text-sm group/item">
                <span class="text-white/90 font-medium relative pr-2 z-10">{{ item.item }}</span>
                <span class="flex-grow border-b border-dashed border-white/10 mb-1 mx-1"></span>
                <span class="text-blue-400 font-bold pl-2 z-10">{{ item.price }}</span>
              </li>
            </ul>
          </div>
        </template>
      </UiMediaCard>
    </TransitionGroup>

    <UiEmptyState
      v-if="filteredSpots.length === 0"
      :description="t('food.noFilterMatch')"
      icon="fluent:food-24-regular"
      :glass="false"
      class="px-6 py-12"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const { t } = useI18n()

// --- Configuration ---
const activeCategory = ref('all');

const categories = computed(() => [
  { id: 'all', label: t('food.all') },
  { id: 'hot', label: t('food.hotMeals') },
  { id: 'snack', label: t('food.snacks') },
  { id: 'drink', label: t('food.drinks') },
]);

// --- Données ---
const foodSpots = computed(() => [
  {
    id: 1,
    category: 'hot',
    name: t('food.spots.cantine.name'),
    type: t('food.spots.cantine.type'),
    description: t('food.spots.cantine.description'),
    icon: "fluent:food-24-filled",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
    menu: [
      { item: t('food.menu.steakFrites'), price: "18.-" },
      { item: t('food.menu.pasta'), price: "14.-" },
      { item: t('food.menu.salad'), price: "8.-" }
    ]
  },
  {
    id: 2,
    category: 'snack',
    name: t('food.spots.burger.name'),
    type: t('food.spots.burger.type'),
    description: t('food.spots.burger.description'),
    icon: "fluent:food-24-filled",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    menu: [
      { item: t('food.menu.classicBurger'), price: "15.-" },
      { item: t('food.menu.vaudoisBurger'), price: "17.-" },
      { item: t('food.menu.fries'), price: "6.-" }
    ]
  },
  {
    id: 3,
    category: 'hot',
    name: t('food.spots.raclette.name'),
    type: t('food.spots.raclette.type'),
    description: t('food.spots.raclette.description'),
    icon: "fluent:food-toast-24-filled",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1706363447064-1ae8d6d3bc5d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    menu: [
      { item: t('food.menu.raclettePortion'), price: "7.-" },
      { item: t('food.menu.valaisanBoard'), price: "16.-" },
      { item: t('food.menu.hotTea'), price: "4.-" }
    ]
  },
  {
    id: 4,
    category: 'drink',
    name: t('food.spots.bar.name'),
    type: t('food.spots.bar.type'),
    description: t('food.spots.bar.description'),
    icon: "fluent:drink-beer-24-filled",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?auto=format&fit=crop&q=80&w=800",
    menu: [
      { item: t('food.menu.beer'), price: "5.-" },
      { item: t('food.menu.water'), price: "4.-" },
      { item: t('food.menu.coffee'), price: "3.50" }
    ]
  }
]);

// --- Computed ---
const filteredSpots = computed(() => {
  if (activeCategory.value === 'all') return foodSpots.value;
  return foodSpots.value.filter(spot => spot.category === activeCategory.value);
});
</script>

<style scoped>
/* Hide scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes cascade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.premium-cascade-item {
  animation: cascade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--cascade-index) * 100ms);
}
</style>
