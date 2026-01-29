<script setup lang="ts">
import { ref } from 'vue';

// Données des Food Trucks / Stands
const foodSpots = ref([
  {
    id: 1,
    name: "Le Food Court Central",
    type: "Restauration Chaude",
    description: "Le cœur de l'événement. Plats chauds, zones assises et ambiance conviviale.",
    icon: "fluent:food-24-regular",
    status: "Ouvert",
    menu: [
      { item: "Assiette Steak-Frites", price: "18.-" },
      { item: "Pâtes (Bolo / Pesto)", price: "14.-" },
      { item: "Salade Mêlée", price: "8.-" }
    ]
  },
  {
    id: 2,
    name: "Burger Express",
    type: "Food Truck",
    description: "Des burgers gourmets faits maison avec des produits locaux.",
    icon: "fluent:food-burger-24-regular",
    status: "Ouvert",
    menu: [
      { item: "Le Classic (Bœuf)", price: "15.-" },
      { item: "Le Vaudois (Tomme)", price: "17.-" },
      { item: "Végétarien", price: "14.-" }
    ]
  },
  {
    id: 3,
    name: "La Raclette du Gym",
    type: "Spécialité Suisse",
    description: "Rien de tel qu'une bonne raclette pour reprendre des forces !",
    icon: "fluent:food-cheese-24-regular",
    status: "Ouvert 11h-22h",
    menu: [
      { item: "Portion Raclette", price: "6.-" },
      { item: "Planchette Valaisanne", price: "22.-" }
    ]
  },
  {
    id: 4,
    name: "Sweet Treats & Café",
    type: "Desserts & Boissons",
    description: "Crêpes, gaufres et café pour les petites faims.",
    icon: "fluent:drink-coffee-24-regular",
    status: "Ouvert",
    menu: [
      { item: "Crêpe Sucre/Cannelle", price: "5.-" },
      { item: "Gaufre Nutella", price: "6.-" },
      { item: "Café / Renversé", price: "3.50" }
    ]
  }
]);
</script>

<template>
  <div class="relative overflow-hidden">
    <LiquidBackground class="fixed inset-0 z-0 pointer-events-none" />

    <div class="relative z-10 p-4 max-w-3xl mx-auto space-y-4">
      
      <header class="space-y-2">
        <h1 class="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Icon name="fluent:food-pizza-24-filled" class="text-blue-400" />
          Restauration
        </h1>
        <p class="text-white/60 text-lg">
          Découvrez les stands et menus disponibles sur le site de compétition.
        </p>
      </header>

      <div class="grid gap-6">
        <div 
          v-for="spot in foodSpots" 
          :key="spot.id"
          class="glass-panel p-0 overflow-hidden rounded-2xl border border-white/10 shadow-xl backdrop-blur-md bg-white/5"
        >
          <div class="p-5 border-b border-white/5 flex items-start justify-between bg-white/5">
            <div class="flex gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Icon :name="spot.icon" size="28" />
              </div>
              <div>
                <h3 class="text-xl font-bold text-white leading-tight">{{ spot.name }}</h3>
                <span class="text-sm text-blue-300 font-medium">{{ spot.type }}</span>
              </div>
            </div>
            <div class="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wider">
              {{ spot.status }}
            </div>
          </div>

          <div class="p-5 space-y-4">
            <p class="text-white/70 text-sm leading-relaxed">
              {{ spot.description }}
            </p>

            <div class="bg-black/20 rounded-xl p-4 space-y-3">
              <h4 class="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Au Menu</h4>
              <ul class="space-y-3">
                <li v-for="(item, idx) in spot.menu" :key="idx" class="flex justify-between items-center text-sm">
                  <span class="text-white font-medium">{{ item.item }}</span>
                  <span class="text-blue-400 font-bold">{{ item.price }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-panel p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 flex gap-4 items-center">
        <Icon name="fluent:info-24-regular" class="text-yellow-400 shrink-0" size="24" />
        <p class="text-yellow-100 text-sm">
          Moyens de paiement acceptés : Cash, Twint et Cartes bancaires à tous les stands.
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.page-enter-active {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>