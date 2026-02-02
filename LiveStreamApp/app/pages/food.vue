<template>
  <div class="min-h-screen pb-24 pt-safe">
    <!-- Bouton retour -->
    <div class="px-6 pt-4 pb-2">
      <NuxtLink to="/" class="inline-flex items-center gap-2 glass-panel px-3 py-2 rounded-lg hover:bg-white/20 transition-colors">
        <Icon name="fluent:chevron-left-24-regular" class="w-5 h-5 text-white" />
        <span class="text-white text-sm font-medium">Retour</span>
      </NuxtLink>
    </div>

    <!-- Hero Section -->
    <div class="relative px-6 py-6 mb-4">
      <div class="absolute top-0 right-0 p-6 opacity-20">
        <Icon name="fluent:food-pizza-24-filled" class="text-9xl text-blue-500 blur-2xl animate-pulse" />
      </div>
      <h1 class="text-3xl font-black text-white mb-2 uppercase tracking-wide">
        Restauration
        <span class="text-blue-500">.</span>
      </h1>
      <p class="text-white/60 text-sm max-w-xs">
        Découvrez nos stands pour reprendre des forces entre deux compétitions.
      </p>
    </div>

    <div class="px-6 mb-8 flex gap-3 overflow-x-auto no-scrollbar pb-2">
      <button 
        v-for="cat in categories" 
        :key="cat.id"
        @click="activeCategory = cat.id"
        class="px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap border"
        :class="activeCategory === cat.id 
          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="px-6 mb-8">
      <div class="glass-panel p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex gap-4 items-center">
        <div class="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
          <Icon name="fluent:wallet-credit-card-24-regular" class="text-blue-400" size="20" />
        </div>
        <div>
          <h3 class="text-white font-bold text-sm">Moyens de paiement</h3>
          <p class="text-blue-200/70 text-xs mt-0.5">
            Cash, Twint & Cartes bancaires acceptés partout.
          </p>
        </div>
      </div>
    </div>

    <div class="px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <TransitionGroup name="list">
        <div 
          v-for="spot in filteredSpots" 
          :key="spot.id"
          class="group relative overflow-hidden rounded-2xl bg-gray-900 border border-white/5 shadow-xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-blue-900/10"
        >
          <div class="h-40 w-full relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10"></div>
            <img 
              :src="spot.image" 
              alt="Food" 
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
            />
            
            <div class="absolute top-3 right-3 z-20">
              <div 
                class="px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border flex items-center gap-2"
                :class="spot.status === 'Ouvert' 
                  ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                  : 'bg-red-500/20 border-red-500/30 text-red-400'"
              >
                <span v-if="spot.status === 'Ouvert'" class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {{ spot.status }}
              </div>
            </div>

            <div class="absolute bottom-3 left-4 z-20 flex items-end gap-3">
              <div class="h-10 w-10 rounded-lg bg-blue-600/90 backdrop-blur flex items-center justify-center shadow-lg">
                <Icon :name="spot.icon" class="text-white" size="20" />
              </div>
              <div>
                <p class="text-blue-400 text-xs font-bold uppercase tracking-wider mb-0.5">{{ spot.type }}</p>
                <h2 class="text-xl font-bold text-white leading-none">{{ spot.name }}</h2>
              </div>
            </div>
          </div>

          <div class="p-5">
            <p class="text-white/60 text-sm mb-6 leading-relaxed">
              {{ spot.description }}
            </p>

            <div class="bg-white/5 rounded-xl p-4 border border-white/5">
              <h4 class="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Icon name="fluent:options-20-filled" />
                Au Menu
              </h4>
              <ul class="space-y-3">
                <li v-for="(item, idx) in spot.menu" :key="idx" class="flex items-end justify-between text-sm group/item">
                  <span class="text-white/90 font-medium relative pr-2 z-10">{{ item.item }}</span>
                  <span class="flex-grow border-b border-dashed border-white/10 mb-1 mx-1"></span>
                  <span class="text-blue-400 font-bold pl-2 z-10">{{ item.price }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div v-if="filteredSpots.length === 0" class="px-6 py-12 text-center">
      <div class="inline-flex h-16 w-16 rounded-full bg-white/5 items-center justify-center mb-4">
        <Icon name="fluent:food-24-regular" class="text-white/20" size="32" />
      </div>
      <p class="text-white/40">Aucun stand ne correspond à ce filtre.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// --- Configuration ---
const activeCategory = ref('all');

const categories = [
  { id: 'all', label: 'Tout' },
  { id: 'hot', label: 'Repas Chauds' },
  { id: 'snack', label: 'Snacks & Burgers' },
  { id: 'drink', label: 'Bar & Boissons' },
];

// --- Données ---
const foodSpots = ref([
  {
    id: 1,
    category: 'hot',
    name: "La Cantine Centrale",
    type: "Restauration",
    description: "Le cœur de l'événement. Plats chauds traditionnels, pâtes fraîches et une grande zone assise conviviale.",
    icon: "fluent:food-24-filled",
    status: "Ouvert",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
    menu: [
      { item: "Assiette Steak-Frites", price: "18.-" },
      { item: "Pâtes (Bolo / Pesto)", price: "14.-" },
      { item: "Salade Mêlée", price: "8.-" }
    ]
  },
  {
    id: 2,
    category: 'snack',
    name: "Burger Express",
    type: "Food Truck",
    description: "Des burgers gourmets faits minute avec du bœuf local et du fromage de la région.",
    icon: "fluent:food-24-filled",
    status: "Ouvert",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    menu: [
      { item: "Le Classic (Bœuf)", price: "15.-" },
      { item: "Le Vaudois (Tomme)", price: "17.-" },
      { item: "Frites Maison", price: "6.-" }
    ]
  },
  {
    id: 3,
    category: 'hot',
    name: "La Raclette du Gym",
    type: "Tradition",
    description: "L'incontournable raclette valaisanne coulée sur demande. Ambiance chaleureuse garantie.",
    icon: "fluent:food-toast-24-filled",
    status: "Ouvert",
    image: "https://images.unsplash.com/photo-1706363447064-1ae8d6d3bc5d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    menu: [
      { item: "Portion Raclette", price: "7.-" },
      { item: "Planchette Valaisanne", price: "16.-" },
      { item: "Thé Chaud", price: "4.-" }
    ]
  },
  {
    id: 4,
    category: 'drink',
    name: "Le Bar des Sports",
    type: "Boissons",
    description: "Le point de rendez-vous pour fêter les résultats. Bières locales, minérales et bonne humeur.",
    icon: "fluent:drink-beer-24-filled",
    status: "Ouvert",
    image: "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?auto=format&fit=crop&q=80&w=800",
    menu: [
      { item: "Bière Pression (3dl)", price: "5.-" },
      { item: "Minérales (5dl)", price: "4.-" },
      { item: "Café / Renversé", price: "3.50" }
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
/* Transition pour la liste */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Position absolue pour que les éléments qui partent ne cassent pas la grille pendant l'anim */
.list-leave-active {
  position: absolute;
  width: 50%;
}

/* Hide scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>