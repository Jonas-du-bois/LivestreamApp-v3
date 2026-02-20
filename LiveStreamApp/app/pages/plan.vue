<script setup lang="ts">
import { onMounted, ref, shallowRef, computed } from 'vue';
import 'leaflet/dist/leaflet.css'; // Import CSS Leaflet
import { useRouter } from 'vue-router';

const { t } = useI18n()
const router = useRouter()

// Masquer header/footer globaux pour cette page "Plein écran"
definePageMeta({ header: false, footer: false })

const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<any>(null); // Référence à l'instance Leaflet
const currentLayer = shallowRef<any>(null); // La couche de tuiles active
const isSatellite = ref(false); // État du bouton (False = Dark, True = Satellite)

// --- CONFIGURATION DES LAYERS ---
// 1. Layer SOMBRE (CartoDB Dark Matter) - Très lisible, style "App"
const DARK_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
// 2. Layer SATELLITE (Esri WorldImagery) - Très réaliste
const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Liste des POIs (Points d'Intérêt)
const pointsOfInterest = computed(() => [
  { name: t('plan.pois.parking'), lat: 46.77151290029007, lng: 6.635177597178094, type: "info", icon: "fluent:vehicle-car-parking-24-regular" },
  { name: t('plan.pois.isle'), lat: 46.772334227855715, lng: 6.634323537615062, type: "gym", icon: "fluent:trophy-24-regular" },
  { name: t('plan.pois.leonMichaud'), lat: 46.77444599060295, lng: 6.63552351286276, type: "gym", icon: "fluent:trophy-24-regular" },
  { name: t('plan.pois.foodCourt'), lat: 46.77193320812667, lng: 6.634768482804293, type: "food", icon: "fluent:food-pizza-24-regular" },
  { name: t('plan.pois.afterParty'), lat: 46.77219666028513, lng: 6.634955252445288, type: "info", icon: "fluent:drink-beer-24-regular" },
  { name: t('plan.pois.restrooms'), lat: 46.77235046701481, lng: 6.63564229775863, type: "wc", icon: "fluent:drop-24-regular" },
]);

// Fonction pour basculer le style de carte
const toggleMapStyle = async () => {
  if (!map.value || !currentLayer.value) return;

  const L = (await import('leaflet')).default;
  
  // 1. Retirer la couche actuelle
  map.value.removeLayer(currentLayer.value);

  // 2. Inverser l'état
  isSatellite.value = !isSatellite.value;

  // 3. Créer la nouvelle couche
  const newUrl = isSatellite.value ? SAT_URL : DARK_URL;
  const newLayer = L.tileLayer(newUrl, {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap & Esri',
  });

  // 4. Ajouter la nouvelle couche
  newLayer.addTo(map.value);
  currentLayer.value = newLayer;
};

onMounted(async () => {
  if (!mapContainer.value) return;

  // Import dynamique de Leaflet (car non compatible Server Side Rendering)
  const L = (await import('leaflet')).default;

  // Initialiser la carte
  map.value = L.map(mapContainer.value, {
    zoomControl: false, // On cache les boutons +/- par défaut pour gérer le design
    attributionControl: false
  }).setView([46.77311798451803, 6.63517385120118], 16);

  // Ajouter la couche par défaut (Sombre)
  currentLayer.value = L.tileLayer(DARK_URL, {
    maxZoom: 20,
    subdomains: 'abcd',
  }).addTo(map.value);

  // Ajouter les marqueurs (POIs)
  pointsOfInterest.value.forEach(poi => {
    // 1. L'icône sur la carte (Goutte inversée)
    const customIcon = L.divIcon({
      className: 'custom-pin-container',
      html: `
        <div class="pin-content type-${poi.type}">
           <span class="iconify" data-icon="${poi.icon}"></span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40], // La pointe en bas
      popupAnchor: [0, -45] // La bulle flotte au-dessus
    });

    const marker = L.marker([poi.lat, poi.lng], { icon: customIcon }).addTo(map.value);
    
    // 2. La Popup Glassmorphic (Contenu HTML pur)
    // Design épuré : Juste l'icône ronde et le titre
    const popupContent = `
      <div class="glass-popup-content">
        <div class="popup-header type-${poi.type}">
           <span class="iconify" data-icon="${poi.icon}"></span>
        </div>
        <div class="popup-body">
           <h3 class="popup-title">${poi.name}</h3>
        </div>
      </div>
    `;

    // 3. Liaison de la popup
    marker.bindPopup(popupContent, {
      closeButton: false,        // ❌ Pas de croix (on clique à côté pour fermer)
      className: 'glass-popup',  // ✨ Classe custom pour le CSS
      maxWidth: 250,
      minWidth: 120,
      autoPanPadding: [20, 20]
    });
  });
});

const goBack = () => {
  try { router.back() } catch (e) { window.history.back() }
}
</script>

<template>
  <div class="h-screen w-full relative flex flex-col bg-gray-900 overflow-hidden">
    
    <div ref="mapContainer" class="absolute inset-0 z-0"></div>

    <div class="absolute top-safe left-4 z-[500] pt-4">
      <UiGlassBackButton @click="goBack" class="hover:bg-white/10 pointer-events-auto">
        {{ t('plan.back') }}
      </UiGlassBackButton>
    </div>

    <div class="absolute bottom-24 right-4 z-[500]">
      <button 
        @click="toggleMapStyle" 
        class="glass-panel w-12 h-12 rounded-full flex items-center justify-center shadow-xl border border-white/20 transition-all active:scale-95 pointer-events-auto"
        :class="isSatellite ? 'bg-blue-600/80' : 'bg-gray-900/60'"
      >
        <Icon 
          v-if="isSatellite" 
          name="fluent:map-24-regular" 
          class="w-6 h-6 text-white" 
        />
        <Icon 
          v-else 
          name="fluent:earth-24-regular" 
          class="w-6 h-6 text-white" 
        />
      </button>
    </div>

    <div class="absolute bottom-8 left-0 right-0 z-[500] px-4 pointer-events-none flex justify-center">
      <div class="glass-panel px-4 py-3 rounded-2xl pointer-events-auto flex items-center gap-4 shadow-xl border border-white/10 bg-black/40 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
        
        <div class="flex items-center gap-2 shrink-0">
          <div class="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
          <span class="text-xs font-bold text-white uppercase tracking-wide">{{ t('plan.competition') }}</span>
        </div>
        
        <div class="w-px h-4 bg-white/20 shrink-0"></div>

        <div class="flex items-center gap-2 shrink-0">
          <div class="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
          <span class="text-xs font-bold text-white uppercase tracking-wide">{{ t('plan.food') }}</span>
        </div>

        <div class="w-px h-4 bg-white/20 shrink-0"></div>

        <div class="flex items-center gap-2 shrink-0">
          <div class="w-3 h-3 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.6)]"></div>
          <span class="text-xs font-bold text-white uppercase tracking-wide">{{ t('plan.info') }}</span>
        </div>

        <div class="w-px h-4 bg-white/20 shrink-0"></div>

        <div class="flex items-center gap-2 shrink-0">
          <div class="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
          <span class="text-xs font-bold text-white uppercase tracking-wide">{{ t('plan.pois.restrooms') }}</span>
        </div>

      </div>
    </div>

  </div>
</template>

<style>
/* --- STYLES GLOBAUX POUR LEAFLET ---
  Ces styles ne sont pas "scoped" car Leaflet injecte le HTML 
  en dehors du scope VueJS.
*/

.top-safe {
  top: env(safe-area-inset-top, 0px);
}

/* 1. ÉPINGLES (Markers) */
.custom-pin-container {
  background: transparent;
  border: none;
}
.pin-content {
  width: 40px;
  height: 40px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg); /* Forme de goutte */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
/* Redresser l'icône à l'intérieur */
.pin-content .iconify {
  transform: rotate(45deg); 
  font-size: 20px;
  color: white;
}

/* Couleurs des pins selon le type */
.pin-content.type-gym { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.pin-content.type-food { background: linear-gradient(135deg, #f97316, #c2410c); }
.pin-content.type-info { background: linear-gradient(135deg, #64748b, #334155); }
.pin-content.type-wc { background: linear-gradient(135deg, #06b6d4, #0e7490); }

/* Animation au survol */
.custom-pin-container:hover .pin-content {
  transform: rotate(-45deg) scale(1.15) translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.4);
}

/* 2. POPUP GLASSMORPHIC (BUBBLE) */

/* On rend le wrapper de Leaflet invisible pour gérer nous-mêmes le style */
.glass-popup .leaflet-popup-content-wrapper {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0;
  border: none;
}

/* La petite flèche en bas (Tip) avec l'effet Blur */
.glass-popup .leaflet-popup-tip {
  background: rgba(17, 24, 39, 0.85); /* Même couleur que le contenu */
  backdrop-filter: blur(16px);        /* Même flou */
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

/* Notre contenu custom (Le rectangle principal) */
.glass-popup-content {
  background: rgba(17, 24, 39, 0.85); /* Fond sombre très translucide */
  backdrop-filter: blur(16px);        /* Le FLOU d'arrière-plan */
  -webkit-backdrop-filter: blur(16px); /* Pour Safari */
  
  border: 1px solid rgba(255, 255, 255, 0.1); /* Bordure subtile */
  border-radius: 12px;
  
  padding: 10px 14px; /* Padding réduit car plus de sous-titre */
  display: flex;
  align-items: center;
  gap: 12px;
  
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); /* Belle ombre portée */
  min-width: 140px;
}

/* Ajustement marges internes Leaflet */
.leaflet-popup-content {
  margin: 0 !important;
  width: auto !important;
}

/* Header (Icône ronde dans la bulle) */
.popup-header {
  width: 28px; /* Compact */
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  font-size: 14px;
}
.popup-header.type-gym { background: rgba(59, 130, 246, 0.3); color: #60a5fa; }
.popup-header.type-food { background: rgba(249, 115, 22, 0.3); color: #fb923c; }
.popup-header.type-info { background: rgba(148, 163, 184, 0.3); color: #cbd5e1; }
.popup-header.type-wc { background: rgba(6, 182, 212, 0.3); color: #22d3ee; }

/* Titre */
.popup-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: white;
  white-space: nowrap; /* Empêche le texte de passer à la ligne */
}
</style>