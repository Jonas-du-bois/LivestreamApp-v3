<template>
  <div class="px-4 space-y-6 pb-6">
    <!-- Bouton retour -->
    <div class="px-2 pt-2">
      <UiBackButton to="/">
        {{ t('common.back') }}
      </UiBackButton>
    </div>

    <!-- Hero Section -->
    <UiPageHeader
      :title="t('food.title')"
      :subtitle="t('food.subtitle')"
      icon="fluent:food-pizza-24-filled"
      icon-color="accent-text-tertiary"
      accent-color="accent-text-tertiary"
    />

    <!-- Filtres Catégories -->
    <UiFilterChips
      v-model="activeCategory"
      :items="categories"
      color="emerald"
      :aria-label="t('food.title')"
      class="mb-8 px-4"
    />

    <div class="mb-8">
      <UiInfoTile
        variant="feature"
        icon-shape="circle"
        accent="emerald"
        icon="fluent:wallet-credit-card-24-regular"
        :label="t('food.paymentMethods')"
        class="rounded-xl"
      >
        <span class="text-emerald-200/80">{{ t('food.paymentInfo') }}</span>
      </UiInfoTile>
    </div>

    <TransitionGroup
      name="list"
      tag="div"
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <UiMediaCard
        v-for="(spot, index) in filteredSpots"
        :key="spot.id"
        :image="spot.image"
        :alt="spot.name"
        variant="split"
        :interactive="true"
        class="premium-cascade-item rounded-2xl bg-gray-900/40 backdrop-blur-xl border-white/10 shadow-xl hover:border-emerald-400/30 hover:shadow-emerald-900/20 active:border-emerald-400/60 active:bg-gray-800/60 active:scale-[0.98] transition-all duration-300"
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
              color="emerald"
              shape="rounded"
              size="md"
            />
            <div>
              <p class="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-0.5">{{ spot.type }}</p>
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
              <li
                v-for="(item, idx) in spot.menu"
                :key="idx"
                class="flex items-end justify-between text-sm group/item"
              >
                <span class="text-white/90 font-medium relative pr-2 z-10">{{ item.item }}</span>
                <span class="flex-grow border-b border-dashed border-white/10 mb-1 mx-1"></span>
                <span class="text-emerald-300 font-bold pl-2 z-10">{{ item.price }}</span>
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

const { t } = useI18n()

const activeCategory = ref('all')

const categories = computed(() => [
  { id: 'all',   label: t('food.all') },
  { id: 'hot',   label: t('food.hotMeals') },
  { id: 'snack', label: t('food.snacks') },
  { id: 'drink', label: t('food.drinks') },
])

const foodSpots = computed(() => [
  // ── PLATS CHAUDS ──────────────────────────────────────────────────────────
  {
    id: 1,
    category: 'hot',
    name: 'Cantine',
    type: 'Restauration',
    description: 'Le point central de la restauration : plats chauds, snacks et boissons pour recharger les batteries.',
    icon: 'fluent:food-24-filled',
    isOpen: true,
    image: 'livestreamapp/food/food-1',
    menu: [
      { item: 'Saucisse + Frites + Salade', price: '16.-' },
      { item: 'Salade Composée',            price: '12.-' },
      { item: 'Chicken Nuggets',            price: '8.-'  },
      { item: 'Frites',                     price: '8.-'  },
      { item: 'Hot-Dog',                    price: '5.-'  },
      { item: 'Sandwich',                   price: '5.-'  },
      { item: 'Croissant',                  price: '3.-'  },
    ],
  },
  {
    id: 2,
    category: 'hot',
    name: 'Sawasdee',
    type: 'Food Truck Thaï',
    description: 'Saveurs thaïlandaises authentiques : currys parfumés, pad thaï et entrées asiatiques.',
    icon: 'fluent:bowl-salad-24-filled',
    isOpen: true,
    image: 'livestreamapp/food/food-2',
    menu: [
      { item: 'Rouleaux de printemps (2 pcs)', price: '8.-'  },
      { item: 'Beignets de crevette (4 pcs)',  price: '8.-'  },
      { item: 'Poulet curry rouge/vert + riz', price: '18.-' },
      { item: 'Poulet aigre-doux + riz',       price: '18.-' },
      { item: 'Pad Thai crevettes',            price: '20.-' },
      { item: 'Pad Thai légumes',              price: '18.-' },
    ],
  },
  {
    id: 3,
    category: 'hot',
    name: 'Nomad',
    type: 'Food Truck',
    description: 'Notre dernier food truck de l\'édition — le menu arrive bientôt. Stay tuned !',
    icon: 'fluent:vehicle-truck-24-filled',
    isOpen: false,
    image: 'livestreamapp/food/food-3',
    menu: [
      { item: 'Menu à venir…', price: '–' },
    ],
  },

  // ── SNACKS ────────────────────────────────────────────────────────────────
  {
    id: 4,
    category: 'snack',
    name: 'Pizza au Feu de Bois',
    type: 'Pizzeria',
    description: 'Pizzas artisanales cuites au feu de bois avec des garnitures généreuses.',
    icon: 'fluent:food-pizza-24-filled',
    isOpen: true,
    image: 'livestreamapp/food/food-4',
    menu: [
      { item: 'Sèches au lard',     price: 'CHF 15.-' },
      { item: 'Margherita',         price: 'CHF 15.-' },
      { item: 'Jambon',             price: 'CHF 16.-' },
      { item: 'Jambon-Champignons', price: 'CHF 16.-' },
      { item: 'Chorizo',            price: 'CHF 16.-' },
      { item: 'Campagnarde',        price: 'CHF 18.-' },
    ],
  },

  // ── BOISSONS ──────────────────────────────────────────────────────────────
  {
    id: 5,
    category: 'drink',
    name: 'Stand Bière',
    type: 'Bar',
    description: 'Bières pression fraîches et panachés pour se rafraîchir entre deux épreuves.',
    icon: 'fluent:drink-beer-24-filled',
    isOpen: true,
    image: 'livestreamapp/food/food-5',
    menu: [
      { item: 'Bière pression (verre)',  price: '6.50' },
      { item: 'Bière pression (pichet)', price: '25.-' },
      { item: 'Panaché (verre)',         price: '6.50' },
      { item: 'Panaché (pichet)',        price: '25.-' },
    ],
  },
  {
    id: 6,
    category: 'drink',
    name: 'Isles',
    type: 'Bar',
    description: 'Boissons chaudes et fraîches, vins et petite restauration légère.',
    icon: 'fluent:drink-coffee-24-filled',
    isOpen: true,
    image: 'livestreamapp/food/food-6',
    menu: [
      { item: 'Café / Thé',                    price: '5.-'  },
      { item: 'Soft (Coca, Nestea, Focus…)',    price: '4.-'  },
      { item: 'Somersby',                      price: '7.-'  },
      { item: 'Vin Blanc / Rosé / Rouge (5dl)', price: '17.-' },
    ],
  },
  {
    id: 7,
    category: 'drink',
    name: 'Léon-Michaud',
    type: 'Bar',
    description: 'Bar avec bières pression, vins, softs et petite restauration.',
    icon: 'fluent:drink-beer-24-filled',
    isOpen: true,
    image: 'livestreamapp/food/food-7',
    menu: [
      { item: 'Bière pression (verre)',         price: '6.50' },
      { item: 'Bière pression (pichet)',        price: '25.-' },
      { item: 'Somersby',                      price: '7.-'  },
      { item: 'Vin Blanc / Rosé / Rouge (5dl)', price: '17.-' },
      { item: 'Café / Thé',                    price: '5.-'  },
    ],
  },
])

const filteredSpots = computed(() => {
  if (activeCategory.value === 'all') return foodSpots.value
  return foodSpots.value.filter(spot => spot.category === activeCategory.value)
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@keyframes cascade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.premium-cascade-item {
  animation: cascade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--cascade-index) * 100ms);
}
</style>