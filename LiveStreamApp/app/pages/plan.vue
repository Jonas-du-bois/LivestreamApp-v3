<script setup lang="ts">
import { onMounted, ref } from 'vue';
// Leaflet doit être importé dynamiquement car il ne supporte pas le SSR (Server Side Rendering)
import 'leaflet/dist/leaflet.css';

// Demander au layout global de masquer header et footer
definePageMeta({ header: false, footer: false })

const mapContainer = ref<HTMLElement | null>(null);

// Liste des points d'intérêt (POIs)
const pointsOfInterest = [
  { name: "Entrée Principale", lat: 46.7785, lng: 6.6412, type: "info", icon: "fluent:door-arrow-left-24-regular" },
  { name: "Salle de Concours A", lat: 46.7790, lng: 6.6420, type: "gym", icon: "fluent:trophy-24-regular" },
  { name: "Salle de Concours B", lat: 46.7782, lng: 6.6405, type: "gym", icon: "fluent:trophy-24-regular" },
  { name: "Food Court", lat: 46.7788, lng: 6.6415, type: "food", icon: "fluent:food-pizza-24-regular" },
  { name: "Sanitaires", lat: 46.7786, lng: 6.6418, type: "wc", icon: "fluent:drop-24-regular" },
];

onMounted(async () => {
  if (!mapContainer.value) return;

  // Import dynamique de Leaflet
  const L = (await import('leaflet')).default;

  // 1. Initialiser la carte
  // Centré sur Yverdon (Coordonnées approximatives des Isles ou de la salle)
  const map = L.map(mapContainer.value, {
    zoomControl: false, // On va le mettre ailleurs ou le styliser nous-même
    attributionControl: false
  }).setView([46.7785, 6.6412], 16);

  // 2. Ajouter le fond de carte
  // OPTION A : Carte style "Sombre" (OpenStreetMap CartoDB DarkMatter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd',
  }).addTo(map);

  // 3. Ajouter les Marqueurs Personnalisés
  pointsOfInterest.forEach(poi => {
    // Création d'une icône HTML personnalisée (DivIcon) pour garder le style "Glass"
    const customIcon = L.divIcon({
      className: 'custom-pin', // Classe définie dans le CSS en bas
      html: `
        <div class="pin-content type-${poi.type}">
           <span class="iconify" data-icon="${poi.icon}"></span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40], // La pointe de l'épingle
      popupAnchor: [0, -45]
    });

    const marker = L.marker([poi.lat, poi.lng], { icon: customIcon }).addTo(map);
    
    // Popup stylisée
    marker.bindPopup(`
      <div class="text-center">
        <h3 class="font-bold text-gray-900">${poi.name}</h3>
      </div>
    `);
  });
});

// Back button
const router = useRouter()
const goBack = () => {
  try {
    router.back()
  } catch (e) {
    // Fallback
    window.history.back()
  }
}
</script>

<template>
  <div class="h-screen w-full relative flex flex-col">
    <!-- Back button (top-left) -->
    <div class="absolute top-4 left-4 z-[1000] p-2 pointer-events-auto safe-area-inset-left safe-area-inset-top">
      <button @click="goBack" class="glass-panel p-2 rounded-lg flex items-center gap-2">
        <Icon name="fluent:chevron-left-24-regular" class="w-4 h-4 text-white" />
        <span class="text-white text-sm">Retour</span>
      </button>
    </div>

    <div class="absolute bottom-20 left-0 right-0 z-[1000] p-4 pointer-events-none">
      <div class="glass-panel p-3 rounded-xl mx-auto max-w-max pointer-events-auto flex gap-4 overflow-x-auto no-scrollbar">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-blue-500 block"></span>
          <span class="text-xs text-white">Concours</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-orange-500 block"></span>
          <span class="text-xs text-white">Food</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-gray-400 block"></span>
          <span class="text-xs text-white">Infos</span>
        </div>
      </div>
    </div>

    <div id="map" ref="mapContainer" class="flex-1 w-full bg-gray-900 z-0"></div>
  </div>
</template>

<style>
/* Style global pour les popups Leaflet pour qu'elles matchent le thème */
.leaflet-popup-content-wrapper {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  padding: 0;
}
.leaflet-popup-tip {
  background: rgba(255, 255, 255, 0.9);
}

/* Style des épingles (Markers) */
.custom-pin {
  background: transparent;
  border: none;
}

.pin-content {
  width: 40px;
  height: 40px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  transition: transform 0.2s ease;
}

.pin-content span {
  transform: rotate(45deg); /* Redresser l'icône */
  font-size: 20px;
  color: white;
}

/* Couleurs selon le type */
.pin-content.type-gym { background: linear-gradient(135deg, #3b82f6, #2563eb); } /* Bleu */
.pin-content.type-food { background: linear-gradient(135deg, #f97316, #ea580c); } /* Orange */
.pin-content.type-wc { background: linear-gradient(135deg, #06b6d4, #0891b2); } /* Cyan */
.pin-content.type-info { background: linear-gradient(135deg, #64748b, #475569); } /* Gris */

/* Animation au clic */
.custom-pin:active .pin-content {
  transform: rotate(-45deg) scale(0.9);
}
</style>